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

@Injectable()
export class WalletEvent {
  constructor(
    @InjectBaseService(Wallet)
    public wallet: BaseService<Wallet, Context>,
  ) {}

  @OnEvent('Orders.created.error')
  async updateWalletAfterOrderCreatedFailed({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.wallet.model.db.startSession();
    session.startTransaction();
    try {
      console.log('wallet event orders created failed');

      const wallet = await this.wallet.model
        .findById(input.wallet.id)
        .session(session);

      wallet.balance += input.newOrderTransaction.totalAmount;
      await wallet.save();

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
