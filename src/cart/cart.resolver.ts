import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ShopOnly, ShopOrUserOnly } from 'src/guard/roles.guard';
import { CartService } from './cart.service';
import { AddToCartDTO } from './dto/add-to-card.dto';
import { Cart } from './definition/cart.definition';
import { OutputType } from 'dryerjs';

const cartOutputType = OutputType(Cart);
@Resolver()
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  // @ShopOrUserOnly()
  @Mutation(() => cartOutputType, { name: 'addToCart' })
  async create(@Args('input') input: AddToCartDTO) {
    try {
      return this.cartService.addToCart(input);
    } catch (error) {
      console.error('Failed add to cart:', error);
      throw error;
    }
  }
}
