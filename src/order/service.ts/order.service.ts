import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import { Cart } from 'src/cart/definition/cart.definition';
import { CreateOrder } from '../dto/create-order.dto';
import { OrderTransaction } from '../definition/orderTransaction.definition';
import { BaseService, InjectBaseService, ObjectId, FilterType } from 'dryerjs';
import {
  Order,
  OrderNotId,
  OrderStatus,
  ProductInOrder,
} from '../definition/order.definition';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Wallet } from 'src/wallet/wallet.definition';
import { contains } from 'class-validator';

@Injectable()
export class OrderTransactionService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Wallet)
    public wallet: BaseService<Wallet, Context>,
    @InjectBaseService(Cart) public cartService: BaseService<Cart, Context>,
    @InjectBaseService(OrderTransaction)
    public orderTransactionService: BaseService<OrderTransaction, Context>,
    @InjectBaseService(Order)
    public orderService: BaseService<Order, Context>,
  ) {}

  async createOrder(input: CreateOrder, uid: ObjectId) {
    const session = await this.cartService.model.db.startSession();
    session.startTransaction();
    try {
      const wallet = await this.wallet.model
        .findOne({ authorId: new ObjectId(uid) })
        .session(session);

      if (!wallet) {
        throw new Error('Wallet not found');
      }
      const result = await this.cartService.model
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
            $unwind: '$cartShopItems',
          },
          {
            $lookup: {
              from: 'cartitems',
              localField: 'cartShopItems._id',
              foreignField: 'cartShopItemId',
              as: 'cartShopItems.cartItems',
            },
          },
          {
            $unwind: '$cartShopItems.cartItems',
          },
          {
            $lookup: {
              from: 'users',
              localField: 'cartShopItems.shopId',
              foreignField: '_id',
              as: 'cartShopItems.shop',
            },
          },
          {
            $unwind: '$cartShopItems.shop',
          },
          {
            $lookup: {
              from: 'products',
              localField: 'cartShopItems.cartItems.productId',
              foreignField: '_id',
              as: 'cartShopItems.cartItems.product',
            },
          },
          {
            $unwind: '$cartShopItems.cartItems.product',
          },
          {
            $group: {
              _id: '$cartShopItems._id',
              cartItems: { $push: '$cartShopItems.cartItems' },
              shop: { $first: '$cartShopItems.shop' },
            },
          },
        ])
        .session(session);

      // console.log(result);

      const orders = input.order;
      // console.log(orders);

      const listOrder: OrderNotId[] = [];
      const listOrderInput = [];
      const listProductInOrder: ProductInOrder[] = [];

      input.order.forEach((orderItem) => {
        const matchingShopItems = result.filter(
          (item) =>
            item._id.toString() ===
            orderItem.cartShopItemInput.cartShopItemId.toString(),
        );

        if (matchingShopItems.length === 0) {
          throw new Error('Cart shop item not found');
        }

        matchingShopItems.forEach((shopItem) => {
          const listProductInOrderSeparate: ProductInOrder[] = [];
          orderItem.cartShopItemInput.cartItemId.forEach((cartItemId) => {
            const matchingCartItem = shopItem.cartItems.find(
              (cartItem) =>
                cartItem._id.toString() === cartItemId.toString() &&
                cartItem.quantity > 0,
            );
            if (!matchingCartItem) {
              throw new Error(`Cart item not found: ${cartItemId}`);
            }

            if (matchingCartItem) {
              listProductInOrder.push({
                name: matchingCartItem.product.name,
                slug: matchingCartItem.product.slug,
                media: matchingCartItem.product.media,
                price: matchingCartItem.product.price,
                quantity: matchingCartItem.quantity,
              });
              listProductInOrderSeparate.push({
                name: matchingCartItem.product.name,
                slug: matchingCartItem.product.slug,
                media: matchingCartItem.product.media,
                price: matchingCartItem.product.price,
                quantity: matchingCartItem.quantity,
              });
            }
          });

          listOrder.push({
            addressTo: orderItem.addressTo,
            addressFrom: orderItem.addressFrom,
            note: orderItem.note,
            cartShopItemInput: orderItem.cartShopItemInput,
            shippingFee: orderItem.shippingFee,
            deliveredUnit: orderItem.deliveredUnit,
            shop: {
              shopName: shopItem.shop.shopName,
              shopPhone: shopItem.shop.shopPhone,
              productInOrder: listProductInOrderSeparate,
            },
            totalAmount:
              listProductInOrderSeparate.reduce(
                (acc, cur) => acc + cur.price * cur.quantity,
                0,
              ) + orderItem.shippingFee,
            amountNotShippingFee: listProductInOrderSeparate.reduce(
              (acc, cur) => acc + cur.price * cur.quantity,
              0,
            ),
            code: uuidv4(),
          });

          listOrderInput.push({
            addressTo: orderItem.addressTo,
            addressFrom: orderItem.addressFrom,
            note: orderItem.note,
            cartShopItemInput: orderItem.cartShopItemInput,
            shippingFee: orderItem.shippingFee,
            deliveredUnit: orderItem.deliveredUnit,
            shop: {
              shopName: shopItem.shop.shopOwner.shopName,
              shopPhone: shopItem.shop.shopOwner.phoneShop,
              productInOrder: listProductInOrderSeparate,
            },
            amountNotShippingFee: listProductInOrderSeparate.reduce(
              (acc, cur) => acc + cur.price * cur.quantity,
              0,
            ),
            totalAmount:
              listProductInOrderSeparate.reduce(
                (acc, cur) => acc + cur.price * cur.quantity,
                0,
              ) + orderItem.shippingFee,
            code: uuidv4(),
            shopId: shopItem.shop._id,
          });
        });
      });

      const newOrderTransaction = new this.orderTransactionService.model({
        orders: listOrder,
        recipientInformation: input.recipientInformation,
        totalAmount: listOrder.reduce((acc, cur) => acc + cur.totalAmount, 0),
        transactionId: new ObjectId(),
        codeBill: uuidv4(),
        authorId: new ObjectId(uid),
      });

      if (wallet.balance < newOrderTransaction.totalAmount) {
        throw new Error('Not enough money');
      }

      wallet.balance -= newOrderTransaction.totalAmount;

      await wallet.save({ session });

      // throw new Error('Failed create order transaction');

      await newOrderTransaction.save({ session });

      this.eventEmitter.emit('OrderTransaction.created', {
        input: {
          wallet,
          newOrderTransaction,
          listOrderInput,
          listProductInOrder,
          orders,
          uid,
        },
      });
      await session.commitTransaction();
      session.endSession();
      return newOrderTransaction;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async pagingOrders(
    ctx: Context,
    filter: any,
    sort: any,
    page: number,
    limit: number,
    ref: string,
  ) {
    if (filter) {
      filter = {
        code: { $regex: filter?.code?.contains ?? '', $options: 'i' },
      };
    }

    switch (ref) {
      case 'authorId':
        const newFilter = {
          ...filter,
          authorId: new ObjectId(ctx.id),
        };
        return await this.orderService.paginate(
          ctx,
          newFilter,
          sort,
          page,
          limit,
        );

      case 'shopId':
        const newFilterShop = {
          ...filter,
          shopId: new ObjectId(ctx.id),
        };
        return await this.orderService.paginate(
          ctx,
          newFilterShop,
          sort,
          page,
          limit,
        );
      default:
        return await this.orderService.paginate(ctx, filter, sort, page, limit);
    }
  }
}
