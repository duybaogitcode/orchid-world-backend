import { registerEnumType } from '@nestjs/graphql';
import { Definition, Property, Skip } from 'dryerjs';

export enum ServiceProvider {
  paypal = 'Paypal',
  vnpay = 'Vnpay',
}
registerEnumType(ServiceProvider, {
  name: 'ServiceProvider',
});

export enum Rates {
  USD = 24655,
  VND = 1,
}
registerEnumType(Rates, {
  name: 'Rates',
});

@Definition()
export class ExchangePayment {
  @Property({ type: () => Number, db: Skip })
  amount: number;

  @Property({ type: () => Number, db: Skip })
  rate: number;

  @Property({ type: () => Number, db: Skip })
  serviceFee: number;

  @Property({ type: () => Number, db: Skip })
  afterExchange: number;

  @Property({ type: () => String, db: Skip })
  total: string;

  @Property({ type: () => ServiceProvider, db: Skip })
  serviceProvider: ServiceProvider;
}
