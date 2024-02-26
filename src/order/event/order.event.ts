import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { OnEvent } from '@nestjs/event-emitter';
import { Order, OrderStatus } from '../definition/order.definition';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';

@Injectable()
export class OrderEvent {
  constructor(
    @InjectBaseService(Order)
    public order: BaseService<Order, Context>,
    @InjectBaseService(CartShopItem)
    public cartShopItem: BaseService<CartShopItem, Context>,
  ) {}

  @OnEvent('Order.created')
  async createOrderAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.order.model.db.startSession();
    session.startTransaction();
    try {
      input.listOrderInput.forEach(async (order) => {
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
        await this.cartShopItem.model.findByIdAndDelete(order.cartShopItemId);
      });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
