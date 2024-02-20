import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AfterCreateHookInput, BaseService, InjectBaseService } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Cart } from './definition/cart.definition';

type CartContext = Cart;

@Injectable()
export class CartService {
  constructor(
    @InjectBaseService(Cart) public cartService: BaseService<Cart, CartContext>,
  ) {}

  @OnEvent('User.created')
  async createCartWhenUserCreated({
    input,
  }: AfterCreateHookInput<User, CartContext>) {
    this.cartService.create(null, {
      authorId: input.id,
    });
    console.log(
      '🚀 ~ file: cart.service.ts ~ line 30 ~ CartService ~ createCartWhenUserCreated ~ input',
      input,
    );
  }
}
