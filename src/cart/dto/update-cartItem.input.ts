import { Field, InputType, OmitType, registerEnumType } from '@nestjs/graphql';
import {
  CreateInputType,
  GraphQLObjectId,
  ObjectId,
  Property,
  UpdateInputType,
} from 'dryerjs';
import { CartItem } from '../definition/cartItem.definiton';

export enum ActionCartTypes {
  REMOVE = 'CartItem.removed',
  PLUS = 'CartItem.plus',
  MINUS = 'CartItem.minus',
}

// Register the enum with GraphQL
registerEnumType(ActionCartTypes, {
  name: 'ActionCartTypes',
});

const CartIemInput = UpdateInputType(CartItem);

@InputType()
export class UpdateCartInput extends OmitType(CartIemInput, [
  'cartShopItemId',
  'isAvailableProduct',
  'productId',
  'totalPrice',
  'quantity',
] as const) {
  @Field(() => ActionCartTypes)
  action: ActionCartTypes;

  @Field(() => Number, { defaultValue: 1 })
  quantity: number;
}
