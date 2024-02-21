import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AfterCreateHookInput } from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { Product } from 'src/product/product.definition';

@Injectable()
class EmailService {
  @OnEvent('User.created')
  async handleOrderCreatedEvent({
    input,
  }: AfterCreateHookInput<Product, Context>) {
    console.log(`Send welcome email to `);
  }
}
