import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  FilterType,
  ObjectId,
  OutputType,
  PaginatedOutputType,
  SortType,
} from 'dryerjs';
import { Context, Ctx } from 'src/auth/ctx';
import { SuccessResponse } from 'dryerjs/dist/types';
import { CreateOrder } from './dto/create-order.dto';
import { OrderTransaction } from './definition/orderTransaction.definition';
import { ShopOnly, ShopOrUserOnly } from 'src/guard/roles.guard';
import { OrderTransactionService } from './service.ts/order.service';
import { Order } from './definition/order.definition';

const orderOutputType = OutputType(OrderTransaction);

export type OrderConText = {
  id: ObjectId;
  rolId: ObjectId;
  nameResolver: string;
};

@Resolver()
export class OrderTransactionResolver {
  constructor(
    private readonly orderTransactionService: OrderTransactionService,
  ) {}

  @ShopOrUserOnly()
  @Mutation(() => orderOutputType, { name: 'createOrder' })
  async createOrder(@Args('input') input: CreateOrder, @Ctx() ctx: Context) {
    try {
      const newOrderTransaction =
        await this.orderTransactionService.createOrder(input, ctx.id);

      return newOrderTransaction;
    } catch (error) {
      throw error;
    }
  }

  @ShopOrUserOnly()
  @Query(() => PaginatedOutputType(Order), { name: 'myOrders' })
  async myOrders(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('filter', { type: () => FilterType(Order), nullable: true })
    filter: ReturnType<typeof FilterType>,
    @Args('sort', { type: () => SortType(Order), nullable: true })
    sort: ReturnType<typeof SortType>,

    @Ctx() ctx: Context,
  ) {
    try {
      return await this.orderTransactionService.pagingOrders(
        ctx,
        filter,
        sort,
        page,
        limit,
        'authorId',
      );
    } catch (error) {
      throw error;
    }
  }

  @ShopOnly()
  @Query(() => PaginatedOutputType(Order), { name: 'shopOrders' })
  async shopOrders(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('filter', { type: () => FilterType(Order), nullable: true })
    filter: ReturnType<typeof FilterType>,
    @Args('sort', { type: () => SortType(Order), nullable: true })
    sort: ReturnType<typeof SortType>,

    @Ctx() ctx: Context,
  ) {
    try {
      return await this.orderTransactionService.pagingOrders(
        ctx,
        filter,
        sort,
        page,
        limit,
        'shopId',
      );
    } catch (error) {
      throw error;
    }
  }
}
