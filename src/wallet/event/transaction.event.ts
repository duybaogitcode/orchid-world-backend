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
import { Transaction } from '../transaction.definition';
import { OrderTransaction } from 'src/order/definition/orderTransaction.definition';

@Injectable()
export class TransactionEvent {
  constructor(
    @InjectBaseService(Transaction)
    public transaction: BaseService<Transaction, Context>,
  ) {}

  @OnEvent('Order.created')
  async createTransactionAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.transaction.model.db.startSession();
    session.startTransaction();
    try {
      await this.transaction.model.create({
        id: input.newOrderTransaction.id,
        amount: input.newOrderTransaction.totalAmount,
        type: '0',
        Status: 'SUCCESS',
        description: 'Trừ phí đơn hàng ' + input.newOrderTransaction.codeBill,
        walletId: input.wallet.id,
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
