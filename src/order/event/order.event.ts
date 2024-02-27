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
  ) {}

  @OnEvent('OrderTransaction.created')
  async createOrderAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.order.model.db.startSession();
    session.startTransaction();
    try {
      for (const order of input.listOrderInput) {
        await this.order.model.create({
          id: new ObjectId(),
          addressFrom: order.addressFrom,
          addressTo: order.addressTo,
          amountNotShippingFee: order.amountNotShippingFee,
          totalAmount: order.totalAmount,
          note: order.note,
          shop: order.shop,
          shippingFee: order.shippingFee,
          code: order.code,
          deliveredUnit: order.deliveredUnit,
          cartShopItemId: order.cartShopItemId,
          orderTransactionId: input.newOrderTransaction.id,
          shopId: order.shopId,
          status: OrderStatus.PENDING,
        });
        await this.cartShopItem.model.findByIdAndDelete(order.cartShopItemId, {
          session: session,
        });
      }

      for (const cartItem of input.listCartItemId) {
        await this.cartItem.model.findByIdAndDelete(cartItem, {
          session: session,
        });
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
}
