import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import { Cart } from 'src/cart/definition/cart.definition';
import { CreateOrder } from '../dto/create-order.dto';
import { OrderTransaction } from '../definition/orderTransaction.definition';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { skip } from 'node:test';
import {
  Order,
  OrderNotId,
  OrderStatus,
  ProductInOrder,
} from '../definition/order.definition';
import { OmitType } from '@nestjs/graphql';
import { v4 as uuidv4 } from 'uuid';
import { Omit } from 'nexus/dist/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Wallet } from 'src/wallet/wallet.definition';

@Injectable()
export class OrderTransactionService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Wallet)
    public wallet: BaseService<Wallet, Context>,
    @InjectBaseService(Cart) public cartService: BaseService<Cart, Context>,
    @InjectBaseService(OrderTransaction)
    public orderTransactionService: BaseService<OrderTransaction, Context>,
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

      const listOrder: OrderNotId[] = [];
      const listOrderInput = [];

      const listProductInOrder: ProductInOrder[] = [];

      input.order.forEach((orderItem) => {
        const matchingShopItems = result.filter(
          (item) => item._id.toString() === orderItem.cartShopItemId.toString(),
        );

        if (matchingShopItems.length === 0) {
          throw new Error('Cart shop item not found');
        }

        matchingShopItems.forEach((shopItem) => {
          console.log(shopItem.shop);
          let totalAmount = 0;
          shopItem.cartItems.forEach((cartItem) => {
            const productInOrder: ProductInOrder = {
              price: cartItem.totalPrice,
              quantity: cartItem.quantity,
              media: cartItem.product.media,
              name: cartItem.product.name,
              slug: cartItem.product.slug,
            };
            listProductInOrder.push(productInOrder);
            totalAmount += cartItem.totalPrice;
          });

          const order: OrderNotId = {
            addressFrom: orderItem.addressFrom,
            addressTo: orderItem.addressTo,
            amountNotShippingFee: totalAmount,
            totalAmount: totalAmount + orderItem.shippingFee,
            cartShopItemId: orderItem.cartShopItemId,
            note: orderItem.note,
            shop: {
              shopName: shopItem.shop.shopOwner.shopName,
              shopPhone: shopItem.shop.shopOwner.phoneShop,
              productInOrder: listProductInOrder,
            },
            shippingFee: orderItem.shippingFee,
            code: uuidv4(),
            deliveredUnit: orderItem.deliveredUnit,
          };

          listOrder.push(order);

          const orderInput = {
            shopId: shopItem.shop._id,
            ...order,
          };
          listOrderInput.push(orderInput);
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
      // console.log(newOrderTransaction);

      await newOrderTransaction.save({ session });

      this.eventEmitter.emit('Order.created', {
        input: { wallet, newOrderTransaction, listOrderInput, session },
      });
      // throw new Error('test');
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
}
