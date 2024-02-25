import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ObjectId, OutputType } from 'dryerjs';
import { Order } from './definition/order.definition';
import { Context, Ctx } from 'src/auth/ctx';
import { SuccessResponse } from 'dryerjs/dist/types';
import { CreateOrderDto } from './dto/create-order.dto';

const orderOutputType = OutputType(Order);

@Resolver()
export class OrderResolver {
  constructor() {}
}
