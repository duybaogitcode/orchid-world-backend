import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ShopOnly, ShopOrUserOnly } from 'src/guard/roles.guard';
import { CartService } from './services/cart.service';
import { Cart } from './definition/cart.definition';
import { OutputType } from 'dryerjs';
import { CartItemInput } from './dto/create-cartItem.input';
import { Context, Ctx } from 'src/auth/ctx';
import { CartShopItem } from './definition/cartShopItem.definition';

const cartShopItemOutputType = OutputType(CartShopItem);
@Resolver()
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @ShopOrUserOnly()
  @Mutation(() => cartShopItemOutputType, { name: 'addToCart' })
  async create(@Args('input') input: CartItemInput, @Ctx() ctx: Context) {
    try {
      return this.cartService.addToCart(input, ctx.id);
    } catch (error) {
      console.error('Failed add to cart:', error);
      throw error;
    }
  }
}
