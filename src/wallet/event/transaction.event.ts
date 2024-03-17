import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';

import { OnEvent } from '@nestjs/event-emitter';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { CartItem } from 'src/cart/definition/cartItem.definiton';
import { Transaction, TransactionType } from '../transaction.definition';
import { OrderTransaction } from 'src/order/definition/orderTransaction.definition';
import { registerEnumType } from '@nestjs/graphql';
import { OrderEventEnum } from 'src/order/event/order.event';

export enum TransactionEventEnum {
  CREATED = 'Transaction.created',
}

registerEnumType(TransactionEventEnum, {
  name: 'TransactionEvent',
});
@Injectable()
export class TransactionEvent {
  constructor(
    @InjectBaseService(Transaction)
    public transaction: BaseService<Transaction, Context>,
  ) {}

  @OnEvent(OrderEventEnum.CREATED)
  async createTransactionAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.transaction.model.db.startSession();
    session.startTransaction();
    try {
      console.log('transaction event orders created ');

      await this.transaction.model.create(
        {
          amount: input.newOrderTransaction.totalAmount,
          type: TransactionType.DECREASE,
          status: 'SUCCESS',
          description:
            'Trừ phí theo hóa đơn ' + input.newOrderTransaction.codeBill,
          walletId: input.wallet.id,
        },
        { session },
      );

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  @OnEvent(TransactionEventEnum.CREATED)
  async createTransactionAfterWalletUpdated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.transaction.model.db.startSession();
    session.startTransaction();
    try {
      await this.transaction.model.create({
        amount: input.amount,
        type: input.type,
        status: 'SUCCESS',
        description: input.message,
        walletId: input.walletId,
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
