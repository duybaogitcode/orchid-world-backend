import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ShopOnly, ShopOrUserOnly } from 'src/guard/roles.guard';

@Resolver()
export class CartResolver {
  constructor() {}

  @ShopOrUserOnly()
  @Mutation(() => Boolean, { name: 'addToCart' })
  async create(@Args('input') input: string) {
    try {
      console.log(input);
      return true;
    } catch (error) {
      console.error('Failed create new product:', error);
      throw error;
    }
  }
}
