import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';

import { OnEvent } from '@nestjs/event-emitter';
import {
  SystemWallet,
  SystemWalletID,
} from '../systems/system.wallet.definition';
import { register } from 'module';
import { registerEnumType } from '@nestjs/graphql';
import { ServiceProvider } from 'src/payment/payment.definition';
import { Wallet } from '../wallet.definition';
import { TransactionType } from '../transaction.definition';
import { SystemTransaction } from '../systems/system.transaction.definition';
import { PaymentService } from 'src/payment/payment.service';

export enum SystemWalletEventEnum {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  CREATED_ERROR = 'CREATED_ERROR',
  UPDATED_ERROR = 'UPDATED_ERROR',
  DELETED_ERROR = 'DELETED_ERROR',
}

registerEnumType(SystemWalletEventEnum, {
  name: 'SystemWalletEventEnum',
});

export type SystemWalletEventPayload = {
  amount: number;
  type: TransactionType;
  walletId: ObjectId;
  logs: string;
  serviceProvider: ServiceProvider;
  isTopUpOrWithdraw: boolean;
};

@Injectable()
export class SystemWalletEvent {
  constructor(
    @InjectBaseService(SystemWallet)
    public systemWallet: BaseService<SystemWallet, Context>,
    @InjectBaseService(SystemTransaction)
    public systemTransaction: BaseService<SystemTransaction, Context>,
    private readonly paymentService: PaymentService,
  ) {}

  @OnEvent(SystemWalletEventEnum.CREATED)
  async updateWalletEvent({ input }: { input: SystemWalletEventPayload }) {
    const session = await this.systemWallet.model.db.startSession();
    session.startTransaction();
    try {
      console.log('walletSystem event');

      const systemWallet = await this.systemWallet.model
        .findById(new ObjectId(SystemWalletID.SYSTEM_WALLET_ID))
        .session(session);

      if (!systemWallet) {
        throw new Error('System wallet not found');
      }

      const exchangeMoney = this.paymentService.exchangeMoney({
        amount: input.amount,
        serviceProvider: input.serviceProvider,
      });

      if (input.type === TransactionType.INCREASE) {
        systemWallet.balance += input.amount;
        input.logs = `Cộng ${input.amount}`;
      } else if (input.type === TransactionType.DECREASE) {
        systemWallet.balance -= input.amount;
        input.logs = `Trừ ${input.amount}`;
      }

      await systemWallet.save({ session });

      const systemTransaction = new this.systemTransaction.model({
        amount: input.amount,
        type: input.type,
        walletId: new ObjectId(input.walletId),
        systemWalletId: new ObjectId(SystemWalletID.SYSTEM_WALLET_ID),
        logs: input.logs,
      });

      if (input.isTopUpOrWithdraw) {
        systemTransaction.serviceProvider = input.serviceProvider;
        systemTransaction.rate = exchangeMoney.rate;
        systemTransaction.serviceFee = exchangeMoney.serviceFee;
        systemTransaction.afterExchange = exchangeMoney.afterExchange;
        systemTransaction.totalTopUp = exchangeMoney.totalTopUp;
        systemTransaction.totalWithDraw = exchangeMoney.totalWithDraw;
      }

      await systemTransaction.save({ session });

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
