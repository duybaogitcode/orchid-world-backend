import { Injectable } from '@nestjs/common';
import { User } from './user.definition';
import { Context } from 'src/auth/ctx';
import { BaseService, InjectBaseService } from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';

@Injectable()
export class UserService {
  constructor(
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
    @InjectBaseService(Cart)
    public cartService: BaseService<Cart, Context>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, Context>,
  ) {}

  async getByGoogleId(googleId: string) {
    const user = await this.userService.model.findOne({
      googleId: googleId,
    });

    const cart = await this.cartService.model.findOne({
      authorId: user._id,
    });

    const wallet = await this.walletService.model.findOne({
      authorId: user._id,
    });

    console.log({
      cart,
      wallet,
    });
    return {
      profile: user,
      cart,
      wallet,
    };
  }
}
