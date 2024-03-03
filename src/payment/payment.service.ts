import { Injectable } from '@nestjs/common';
import { ExchangeInput } from './dto/exchange.input';
import { Rates, ServiceProvider } from './payment.definition';

@Injectable()
export class PaymentService {
  exchangeMoney(input: ExchangeInput) {
    let afterExchange: number;
    let serviceFee: number;
    let rate: number;

    switch (input.serviceProvider) {
      case ServiceProvider.paypal:
        afterExchange = input.amount / Rates.USD;
        console.log(afterExchange);
        serviceFee = afterExchange * 0.0544;
        rate = Rates.USD;
        break;
      case ServiceProvider.vnpay:
        afterExchange = input.amount;
        serviceFee = afterExchange * 0.02;
        rate = Rates.VND;
        break;
      default:
        throw new Error('Unsupported service provider');
    }

    const total = afterExchange + serviceFee;

    return {
      ...input,
      afterExchange,
      serviceFee,
      rate,
      total: total.toFixed(2).toString(),
    };
  }
}
