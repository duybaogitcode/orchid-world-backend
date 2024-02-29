import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Order, OrderStatus } from '../definition/order.definition';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { CartItem } from 'src/cart/definition/cartItem.definiton';
import { Cart } from 'src/cart/definition/cart.definition';

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
  ) {}

  @OnEvent('OrderTransaction.created')
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
          authorId: input.uid,
        });
        await newOrder.save({ session: session });
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

      this.eventEmitter.emit('Orders.created', {
        input: input,
      });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      this.eventEmitter.emit('Orders.created.error', {
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
}
