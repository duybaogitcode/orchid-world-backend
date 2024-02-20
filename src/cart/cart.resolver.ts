import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Cart } from './definition/cart.definition';
import { OutputType } from 'dryerjs';

@Resolver()
export class CartResolver {
  constructor() {}

  @Mutation(() => String, { name: 'addToCart' })
  async create(@Args('input') input: string) {
    try {
      return '1';
    } catch (error) {
      console.error('Failed create new product:', error);
      throw error;
    }
  }
}
