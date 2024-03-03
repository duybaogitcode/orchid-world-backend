import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OutputType } from 'dryerjs';
import { ShopOrUserOnly } from 'src/guard/roles.guard';
import { PaymentService } from './payment.service';
import { ExchangePayment } from './payment.definition';
import { ExchangeInput } from './dto/exchange.input';

@Resolver()
export class ExchangePaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @ShopOrUserOnly()
  @Mutation(() => OutputType(ExchangePayment), {
    name: 'exchangeMoney',
  })
  exchangeMoney(@Args('input') input: ExchangeInput) {
    return this.paymentService.exchangeMoney(input);
  }
}
