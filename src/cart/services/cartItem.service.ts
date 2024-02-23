import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { CartItem } from '../definition/cartItem.definiton';
import { CartItemInput } from '../dto/create-cartItem.input';

@Injectable()
export class CartItemService {
  constructor(
    @InjectBaseService(CartItem)
    public cartItemService: BaseService<CartItem, Context>,
  ) {}
}
