import { Inject, Injectable } from '@nestjs/common';
import { User } from './user.definition';
import { Context } from 'src/auth/ctx';
import { BaseService, InjectBaseService } from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailEventEnum } from 'src/email/email.event';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
    @InjectBaseService(Cart)
    public cartService: BaseService<Cart, Context>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, Context>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getByGoogleId(googleId: string) {
    const user = await this.userService.model.findOne({
      googleId: googleId,
    });

    const [cart, wallet] = await Promise.all([
      this.cartService.model.findOne({
        authorId: user._id,
      }),
      this.walletService.model.findOne({
        authorId: user._id,
      }),
    ]);
    // console.log({ address: user?.address });
    // if (!user?.address || user?.address === null) {
    //   user.address = [];
    // }
    // console.log({
    //   cart,
    //   wallet,
    // });

    return {
      profile: user,
      cart,
      wallet,
    };
  }

  async sendEmailOtp(email: string) {
    this.eventEmitter.emit(MailEventEnum.SEND_EMAIL_OTP, email, 'OTP', '1234');
    return {
      success: true,
      message: 'OTP sent to your email',
    };
  }
}
