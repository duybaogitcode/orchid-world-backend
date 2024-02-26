import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ObjectId, OutputType } from 'dryerjs';
import { Order } from './definition/order.definition';
import { Context, Ctx } from 'src/auth/ctx';
import { SuccessResponse } from 'dryerjs/dist/types';
import { CreateOrder } from './dto/create-order.dto';
import { OrderTransaction } from './definition/orderTransaction.definition';
import { ShopOrUserOnly } from 'src/guard/roles.guard';
import { OrderTransactionService } from './service.ts/order.service';

const orderOutputType = OutputType(OrderTransaction);

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
}
