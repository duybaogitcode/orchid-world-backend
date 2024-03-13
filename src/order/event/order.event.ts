import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Order, OrderNotId, OrderStatus } from '../definition/order.definition';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { CartItem } from 'src/cart/definition/cartItem.definiton';
import { Cart } from 'src/cart/definition/cart.definition';
import { registerEnumType } from '@nestjs/graphql';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/wallet/transaction.definition';
import { ServiceProvider } from 'src/payment/payment.definition';
import { GoShipService } from 'src/utils/goship';
import { OrderTransaction } from '../definition/orderTransaction.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { User, address } from 'src/user/user.definition';
import { Product } from 'src/product/product.definition';
import { Auction, AuctionBiddingHistory } from 'src/auction/auction.definition';
import { v4 as uuidv4 } from 'uuid';
import { doesWalletAffordable } from 'src/wallet/wallet.service';

export enum OrderEventEnum {
  CREATED = 'Orders.created',
  CREATED_ERROR = 'Orders.created.error',
  CREATE_BY_ORDER_TRANSACTION = 'OrderTransaction.created',
  CREATE_BY_AUCTION = 'Auction.created',
}

registerEnumType(OrderEventEnum, {
  name: 'OrderEventEnum',
});

@Injectable()
export class OrderEvent {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Order)
    public order: BaseService<Order, Context>,
    @InjectBaseService(CartShopItem)
    public cartShopItem: BaseService<CartShopItem, Context>,
    @InjectBaseService(CartItem)
    public cartItem: BaseService<CartItem, Context>,
    @InjectBaseService(Cart)
    public cart: BaseService<Cart, Context>,
    @InjectBaseService(OrderTransaction)
    public orderTransactionService: BaseService<OrderTransaction, {}>,
    private readonly goshipService: GoShipService,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, {}>,
    @InjectBaseService(Transaction)
    public transactionService: BaseService<Transaction, {}>,
    @InjectBaseService(User)
    public userService: BaseService<User, {}>,
  ) {}

  @OnEvent(OrderEventEnum.CREATE_BY_ORDER_TRANSACTION)
  async createOrderAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.order.model.db.startSession();
    session.startTransaction();

    try {
      for (const order of input.listOrderInput) {
        const newOrder = new this.order.model({
          addressFrom: order.addressFrom,
          addressTo: order.addressTo,
          amountNotShippingFee: order.amountNotShippingFee,
          totalAmount: order.totalAmount,
          note: order.note,
          shop: order.shop,
          shippingFee: order.shippingFee,
          code: order.code,
          deliveredUnit: order.deliveredUnit,
          orderTransactionId: input.newOrderTransaction.id,
          shopId: order.shopId,
          status: OrderStatus.PENDING,
          authorId: input.wallet.authorId,
        });
        await newOrder.save({ session });
      }

      for (const shopItem of input.orders) {
        const deletionPromises = shopItem.cartShopItemInput.cartItemId.map(
          (cartItem) =>
            this.cartItem.model.deleteOne({ _id: cartItem }, { session }),
        );
        await Promise.all(deletionPromises);
        await this.calculateTotalPriceAndQuantity(
          input.uid,
          shopItem.cartShopItemInput.cartShopItemId,
          session,
        );
      }

      this.eventEmitter.emit(OrderEventEnum.CREATED, {
        input: input,
      });
      this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
        input: {
          amount: input.newOrderTransaction.totalAmount,
          type: TransactionType.INCREASE,
          walletId: input.wallet._id,
          logs: 'Thanh toán hóa đơn' + input.newOrderTransaction.codeBill,
          serviceProvider: ServiceProvider.vnpay,
          isTopUpOrWithdraw: false,
        },
      });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      this.eventEmitter.emit(OrderEventEnum.CREATED_ERROR, {
        input: input,
      });
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private async calculateTotalPriceAndQuantity(
    uid: ObjectId,
    cartShopItemId: ObjectId,
    session: any,
  ) {
    const cartShopItemAggregation = await this.cartShopItem.model
      .aggregate([
        { $match: { _id: cartShopItemId } },
        {
          $lookup: {
            from: 'cartitems',
            localField: '_id',
            foreignField: 'cartShopItemId',
            as: 'cartItems',
          },
        },
        {
          $addFields: {
            totalQuantity: { $sum: '$cartItems.quantity' },
            totalPrice: { $sum: '$cartItems.totalPrice' },
          },
        },
      ])
      .session(session);

    const cartShopItem = cartShopItemAggregation[0];
    await this.cartShopItem.model.updateOne(
      { _id: cartShopItemId },
      {
        $set: {
          totalQuantity: cartShopItem.totalQuantity,
          totalPrice: cartShopItem.totalPrice,
        },
      },
      { session },
    );

    if (cartShopItem.totalPrice === 0) {
      await this.cartShopItem.model.deleteOne(
        { _id: cartShopItemId },
        { session },
      );
    }

    const cartAggregation = await this.cart.model
      .aggregate([
        { $match: { authorId: new ObjectId(uid) } },
        {
          $lookup: {
            from: 'cartshopitems',
            localField: '_id',
            foreignField: 'cartId',
            as: 'cartShopItems',
          },
        },
        {
          $addFields: {
            totalQuantity: { $sum: '$cartShopItems.totalQuantity' },
            totalPrice: { $sum: '$cartShopItems.totalPrice' },
          },
        },
      ])
      .session(session);

    const cart = cartAggregation[0];
    await this.cart.model.updateOne(
      { authorId: new ObjectId(uid) },
      {
        $set: {
          totalQuantity: cart.totalQuantity,
          totalPrice: cart.totalPrice,
        },
      },
      { session },
    );

    cart.id = cart._id;

    return cart;
  }

  @OnEvent(OrderEventEnum.CREATE_BY_AUCTION)
  async createOrderAfterAuctionCreated({
    winner,
    updatedProduct,
    lastestBidding,
    auction,
  }: {
    winner: User;
    updatedProduct: Product;
    lastestBidding: AuctionBiddingHistory;
    auction: Auction;
  }) {
    const session = await this.order.model.db.startSession();
    session.startTransaction();

    try {
      const shop = await this.userService.model.findById(
        updatedProduct.authorId,
      );

      let paying = false;

      const addressFrom = await this.getAddress(shop.shopOwner.pickupAddress);
      const addressTo = await this.getAddress(winner.address[0]);
      const listOrder: OrderNotId[] = [];
      listOrder.push({
        addressFrom,
        addressTo,
        amountNotShippingFee: lastestBidding.bidPrice,
        totalAmount: lastestBidding.bidPrice,
        code: uuidv4(),
        deliveredUnit: {
          carrier_logo:
            'http://sandbox.goship.io/storage/images/carriers/2023_11_21_13_58_00_1c812f1a13f8f5441837990ee16e5fcf.jpg',
          carrier_name: 'Giao Hàng Tiết Kiệm',
          carrier_short_name: 'ghtk',
          expected: 'Dự kiến 3 ngày',
          service: 'Tiết kiệm',
        },
        cartShopItemInput: null,
        note: 'Hàng đấu giá, nhớ cẩn thận',
        shippingFee: 0,
        shop: {
          shopName: shop.shopOwner.shopName,
          shopPhone: shop.shopOwner.phoneShop,
          productInOrder: [
            {
              media: updatedProduct.media,
              price: lastestBidding.bidPrice,
              name: updatedProduct.name,
              quantity: updatedProduct.quantity,
              slug: updatedProduct.slug,
            },
          ],
        },
      });

      const orderTransaction = new this.orderTransactionService.model({
        orders: listOrder,
        recipientInformation: {
          name: winner.firstName + ' ' + winner.lastName,
          phone: winner.phone,
        },
        totalAmount: lastestBidding.bidPrice,
        transactionId: new ObjectId(),
        codeBill: uuidv4(),
        authorId: winner.id,
      });

      await orderTransaction.save({ session });

      const wallet = await this.walletService.model.findOne({
        authorId: winner.id,
      });

      const transaction = new this.transactionService.model({
        amount: lastestBidding.bidPrice,
        description: 'Tiền thanh toán đấu giá ' + updatedProduct.name,
        status: TransactionStatus.SUCCESS,
        type: '1',
        walletId: wallet._id,
      });

      const isAffordable = doesWalletAffordable(
        wallet,
        lastestBidding.bidPrice,
      );

      if (!isAffordable) {
        wallet.balance = wallet.balance;
        transaction.status = TransactionStatus.FAILED;
        transaction.description =
          'Thanh toán thất bại, số dư không đủ. ' + transaction.description;
        paying = true;
      } else {
        // Unlock funds and pay for the won product
        wallet.lockFunds = wallet.lockFunds - auction.initialPrice;
        wallet.balance =
          wallet.balance + auction.initialPrice - lastestBidding.bidPrice;
        await wallet.save({ session });
      }

      await transaction.save({ session });

      const order = new this.order.model({
        addressFrom: addressFrom,
        addressTo: addressTo,
        amountNotShippingFee: lastestBidding.bidPrice,
        totalAmount: lastestBidding.bidPrice,
        note: 'Hang dau gia, nho can than',
        shop: orderTransaction.orders[0].shop,
        shippingFee: 0,
        code: orderTransaction.orders[0].code,
        deliveredUnit: orderTransaction.orders[0].deliveredUnit,
        orderTransactionId: orderTransaction.id,
        shopId: shop._id,
        status: paying ? OrderStatus.PAYING : OrderStatus.PENDING,
        authorId: winner.id,
      });

      await order.save({ session });

      this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
        input: {
          amount: order.totalAmount,
          type: TransactionType.INCREASE,
          walletId: wallet._id,
          logs: 'Thanh toán hóa đơn' + orderTransaction.codeBill,
          serviceProvider: ServiceProvider.vnpay,
          isTopUpOrWithdraw: false,
        },
      });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
    }
  }

  private async getAddress(address: address) {
    let addressString = '';
    if (address.city) {
      const listCity = await this.goshipService.getCities();
      const city = listCity.data.find((c) => c.id === address.city);
      const cityName = city?.name || '';
      addressString += cityName;
      if (address.district) {
        const listDistrict = await this.goshipService.getDistricts(
          address.city,
        );
        const district = listDistrict.data.find(
          (d) => d.id === address.district,
        );
        const districtName = district?.name || '';
        addressString += ' ' + districtName;
        if (address.ward) {
          const listWard = await this.goshipService.getWards(address.district);
          const ward = listWard.data.find(
            (w) => w.id.toString() === address.ward,
          );
          const wardName = ward?.name || '';
          addressString += ' ' + wardName;
          if (address.detail) {
            addressString += ' ' + address.detail;
          }
        }
      }
    }

    return addressString;
  }
}
