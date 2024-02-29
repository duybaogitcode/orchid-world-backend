import { Field, InputType, PickType } from '@nestjs/graphql';
import { CreateInputType } from 'dryerjs';
import { OrderTransaction } from '../definition/orderTransaction.definition';
import { Order } from '../definition/order.definition';

const orderInput = CreateInputType(OrderTransaction);
const orderNestedInput = CreateInputType(Order);

@InputType()
class OrderNestedInput extends PickType(orderNestedInput, [
  'addressTo',
  'addressFrom',
  'note',
  'cartShopItemInput',
  'shippingFee',
  'deliveredUnit',
  'shippingFee',
]) {}

@InputType()
export class CreateOrder extends PickType(orderInput, [
  'recipientInformation',
]) {
  @Field(() => [OrderNestedInput])
  order: [OrderNestedInput];
}
