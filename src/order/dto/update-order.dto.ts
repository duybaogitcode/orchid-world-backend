import { InputType, PickType } from '@nestjs/graphql';
import { UpdateInputType } from 'dryerjs';
import { Order } from '../definition/order.definition';

const updateOrder = UpdateInputType(Order);

@InputType()
export class UpdateOrder extends PickType(updateOrder, [
  'file',
  'description',
  'status',
  'code',
] as const) {}
