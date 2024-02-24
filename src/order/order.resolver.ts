import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ObjectId, OutputType } from 'dryerjs';
import { Order } from './order.definition';
import { OrderService } from './order.service';
import { Context, Ctx } from 'src/auth/ctx';
import { SuccessResponse } from 'dryerjs/dist/types';
import { CreateOrderDto } from './dto/create-order.dto';

const orderOutputType = OutputType(Order);

@Resolver()
export class OrderResolver {
  constructor(private orderService: OrderService) {}
  @Mutation(() => orderOutputType, { name: 'makeAnOrder' })
  async makeAnOrder(
    @Args('input') input: CreateOrderDto,
    @Ctx() context: Context,
  ) {
    return {
      success: this.orderService.createOrder(input.cartId, context?.id),
    };
  }
}
