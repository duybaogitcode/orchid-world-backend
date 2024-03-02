import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OutputType } from 'dryerjs';
import { Context, Ctx } from 'src/auth/ctx';
import { ShopOrUserOnly } from 'src/guard/roles.guard';
import { Cart } from './definition/cart.definition';
import { CartItemInput } from './dto/create-cartItem.input';
import { UpdateCartInput } from './dto/update-cartItem.input';
import { CartService } from './services/cart.service';

const cartOutputType = OutputType(Cart);
@Resolver()
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @ShopOrUserOnly()
  @Mutation(() => cartOutputType, { name: 'addToCart' })
  async create(@Args('input') input: CartItemInput, @Ctx() ctx: Context) {
    try {
      return this.cartService.addToCart(input, ctx.id);
    } catch (error) {
      console.error('Failed add to cart:', error);
      throw error;
    }
  }

  @ShopOrUserOnly()
  @Mutation(() => cartOutputType, { name: 'updateCart' })
  async update(@Args('input') input: UpdateCartInput, @Ctx() ctx: Context) {
    try {
      return this.cartService.updateCartItem(input, ctx.id);
    } catch (error) {
      console.error('Failed add to cart:', error);
      throw error;
    }
  }
}
