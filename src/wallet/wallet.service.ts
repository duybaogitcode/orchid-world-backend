import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Wallet } from './wallet.definition';

type Context = Wallet;

interface MutateLockFundsInput {
  payload: {
    authorId: ObjectId;
    amount: number;
  };
}

export const WalletEvents = {
  LOCK_FUNDS: 'LOCK_FUNDS',
  UNLOCK_FUNDS: 'UNLOCK_FUNDS',
};

export const WalletEventPayload = {
  getLockFundsPayload: (payload: MutateLockFundsInput) => payload,
  getUnlockFundsPayload: (payload: MutateLockFundsInput) => payload,
};

export function doesWalletAffordable(wallet: Wallet, amount: number) {
  return (
    wallet.balance - wallet.lockFunds >= amount ||
    wallet.balance + wallet.lockFunds >= amount
  );
}

@Injectable()
export class WalletService {
  constructor(
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, Context>,
  ) {}

  @OnEvent('User.created')
  async handleWhenUserCreated({ input }: AfterCreateHookInput<User, Context>) {
    this.walletService.create(null, {
      authorId: input.id,
    });
    console.log(
      '🚀 ~ file: cart.service.ts ~ line 30 ~ walletService ~ handleWhenUserCreated ~ input',
      input,
    );
  }

  @OnEvent(WalletEvents.LOCK_FUNDS)
  async handleLockFunds({ payload }: MutateLockFundsInput) {
    const authorId = payload.authorId;
    const wallet = await this.walletService.findOne(null, { authorId });
    wallet.lockFunds += payload.amount;
    await this.walletService.update(null, wallet);
    console.log(
      '🚀 ~ file: wallet.service.ts ~ line 30 ~ WalletService ~ handleLockFunds ~ wallet',
      wallet,
    );
  }

  @OnEvent(WalletEvents.UNLOCK_FUNDS)
  async handleUnlockFunds({ payload }: MutateLockFundsInput) {
    const authorId = payload.authorId;
    const wallet = await this.walletService.findOne(null, { authorId });
    wallet.lockFunds -= payload.amount;
    await this.walletService.update(null, wallet);
    console.log(
      '🚀 ~ file: wallet.service.ts ~ line 30 ~ WalletService ~ handleUnlockFunds ~ wallet',
      wallet,
    );
  }
}
