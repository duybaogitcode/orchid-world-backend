import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Wallet } from 'src/wallet/wallet.definition';

import { OnEvent } from '@nestjs/event-emitter';

import { OrderTransaction } from 'src/order/definition/orderTransaction.definition';

@Injectable()
export class OrderTransactionEvent {
  constructor(
    @InjectBaseService(OrderTransaction)
    public orderTransaction: BaseService<OrderTransaction, Context>,
  ) {}

  @OnEvent('Orders.created.error')
  async deleteOrderTransactionAfterOrderCreatedFailed({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.orderTransaction.model.db.startSession();
    session.startTransaction();
    try {
      console.log('OrderTransaction event orders created failed');

      await this.orderTransaction.model.findOneAndDelete({
        id: input.newOrderTransaction.id,
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
