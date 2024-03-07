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
import { UserRole } from 'src/guard/roles.guard';
import { UpdateOrder } from '../dto/update-order.dto';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { NotificationEvent } from 'src/notification/notification.service';
import { TransactionEventEnum } from 'src/wallet/event/transaction.event';
import { OrderEvidenceEventEnum } from '../event/orderEvidence.event';
import { OrderEventEnum } from '../event/order.event';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';
import { TransactionType } from 'src/wallet/transaction.definition';
import { ServiceProvider } from 'src/payment/payment.definition';

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

      this.eventEmitter.emit(OrderEventEnum.CREATE_BY_ORDER_TRANSACTION, {
        input: {
          wallet,
          newOrderTransaction,
          listOrderInput,
          listProductInOrder,
          orders,
          uid,
        },
      });

      this.eventEmitter.emit(NotificationEvent.SEND, {
        message:
          'Đơn hàng ' + newOrderTransaction.codeBill + ' đã được cập nhật',
        notificationType: NotificationTypeEnum.ORDER,
        receiver: new ObjectId(uid),
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

  async findOneByCode(code: string, ctx: Context) {
    const order = await this.orderService.model.findOne({
      code: code,
    });

    switch (ctx.roleId.toString()) {
      case UserRole.USER:
        if (order.authorId.toString() !== ctx.id.toString()) {
          throw new Error('Access denied');
        }
        break;
      case UserRole.SHOP_OWNER:
        if (
          order.shopId.toString() !== ctx.id.toString() &&
          order.authorId.toString() !== ctx.id.toString()
        ) {
          throw new Error('Access denied');
        }
        break;
      default:
        break;
    }
    return order;
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

  async autoUpdateStatusOrder() {
    const orders = await this.orderService.model.find({
      status: OrderStatus.PENDING,
    });

    orders.forEach((order) => {
      if (order.createdAt.getTime() + 1000 * 60 * 60 * 24 * 7 < Date.now()) {
        order.status = OrderStatus.CANCELED;
        order.save();
      }
    });
  }

  async shopUpdateStatusOrder(input: UpdateOrder, ctx: Context) {
    const session = await this.orderService.model.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderService.model
        .findOne({
          code: input.code,
        })
        .session(session);

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error('Order is not pending');
      }

      if (
        input.status !== OrderStatus.CANCELED &&
        input.status !== OrderStatus.SHIPPING
      ) {
        throw new Error(
          'Invalid status, Shop can only update to shipping or cancel status',
        );
      }

      if (order.shopId.toString() !== ctx.id.toString()) {
        throw new Error('Access denied');
      }

      order.status = input.status;
      await order.save({ session });

      if (order.status === OrderStatus.CANCELED) {
        await this.handleOrderCancellation(order, ctx, session);
      }

      input.description = input.description || 'Đơn hàng bắt đầu vận chuyển';

      this.eventEmitter.emit(OrderEvidenceEventEnum.CREATED, {
        input: input,
        inputOrder: order,
        ctx: ctx,
      });

      this.eventEmitter.emit(NotificationEvent.SEND, {
        message: `Đơn hàng ${order.code} đã được cập nhật`,
        notificationType: NotificationTypeEnum.ORDER,
        receiver: order.authorId,
      });

      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async handleOrderCancellation(order: Order, ctx: Context, session: any) {
    const wallet = await this.wallet.model
      .findOne({ authorId: new ObjectId(ctx.id) })
      .session(session);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    let refundAmount;
    let message;

    if (ctx.id === order.authorId) {
      // user cancels
      refundAmount = order.totalAmount * 0.9; // refund 90%
      message = `Hoàn tiền hủy đơn hàng ${order.code} ${refundAmount}`;
      wallet.balance += refundAmount;
    } else if (ctx.id === order.shopId) {
      // shop cancels
      refundAmount = order.totalAmount * 0.1; // deduct 10%
      message = `Trừ tiền hủy đơn hàng ${order.code} ${refundAmount}`;
      wallet.balance -= refundAmount;

      if (wallet.balance < 0) {
        wallet.balance = 0;
      }
    } else {
      throw new Error('Invalid cancellation source');
    }

    await wallet.save({ session });

    const inputTransaction = {
      message: message,
      amount: refundAmount,
      type: '0',
      walletId: wallet._id,
    };

    this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
      input: {
        amount: refundAmount,
        type:
          ctx.id === order.authorId
            ? TransactionType.DECREASE
            : TransactionType.INCREASE,
        walletId: wallet._id,
        logs: '',
        serviceProvider: ServiceProvider.vnpay,
        isTopUpOrWithdraw: false,
      },
    });

    this.eventEmitter.emit(TransactionEventEnum.CREATED, {
      input: inputTransaction,
    });
  }

  async shipperUpdateStatusOrder(input: UpdateOrder, ctx: Context) {
    const session = await this.orderService.model.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderService.model
        .findOne({
          code: input.code,
        })
        .session(session);

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.SHIPPING) {
        throw new Error('Order is not shipping');
      }

      if (ctx.roleId.toString() !== UserRole.SHIPPING) {
        throw new Error('Access denied');
      }

      if (
        input.status !== OrderStatus.DELIVERED &&
        input.status !== OrderStatus.WAITING
      ) {
        throw new Error(
          'Invalid status, Shipper can only update to delivered or waiting status',
        );
      }

      if (input.status === OrderStatus.WAITING) {
        if (!input.file) {
          throw new Error('File is required when status is waiting');
        }
        if (!input.description) {
          throw new Error('Description is required when status is waiting');
        }
      }

      order.status = input.status;
      await order.save({ session });

      if (order.status === OrderStatus.DELIVERED) {
        const wallet = await this.wallet.model
          .findOne({ authorId: order.shopId })
          .session(session);

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        const inputTransaction = {
          message: `Nhận tiền từ đơn hàng ${order.code}`,
          amount: order.amountNotShippingFee,
          type: '1',
          walletId: wallet._id,
        };

        this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
          input: {
            amount: order.amountNotShippingFee,
            type: TransactionType.DECREASE,
            walletId: wallet._id,
            logs: 'Thanh toán đơn hàng',
            serviceProvider: ServiceProvider.paypal,
            isTopUpOrWithdraw: false,
          },
        });

        this.eventEmitter.emit(TransactionEventEnum.CREATED, {
          input: inputTransaction,
        });

        this.eventEmitter.emit(NotificationEvent.SEND, {
          message: `Nhận tiền từ đơn hàng ${order.code}`,
          notificationType: NotificationTypeEnum.ORDER,
          receiver: order.shopId,
        });
      }

      this.eventEmitter.emit(OrderEvidenceEventEnum.CREATED, {
        input: input,
        inputOrder: order,
        ctx: ctx,
      });

      this.eventEmitter.emit(NotificationEvent.SEND, {
        message: `Đơn hàng ${order.code} đã được cập nhật`,
        notificationType: NotificationTypeEnum.ORDER,
        receiver: order.authorId,
      });
      if (input.status === OrderStatus.WAITING) {
        this.eventEmitter.emit(NotificationEvent.SEND, {
          message: `Đơn hàng ${order.code} đã được cập nhật`,
          notificationType: NotificationTypeEnum.ORDER,
          receiver: order.shopId,
        });
      }

      await session.commitTransaction();
      session.endSession();

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
