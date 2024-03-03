import { CreateInputType } from 'dryerjs';
import { ExchangePayment } from '../payment.definition';
import { InputType, PickType } from '@nestjs/graphql';

const exchangeInput = CreateInputType(ExchangePayment);

@InputType()
export class ExchangeInput extends PickType(exchangeInput, [
  'amount',
  'serviceProvider',
] as const) {}
