import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AfterCreateHookInput, BaseService, InjectBaseService } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Wallet } from './wallet.definition';

type Context = Wallet;

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
}
