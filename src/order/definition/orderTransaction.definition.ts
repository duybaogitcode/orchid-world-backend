import {
  BelongsTo,
  CreateInputType,
  Definition,
  Embedded,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { Order, OrderNotId } from './order.definition';
import { Transaction } from 'src/wallet/transaction.definition';
import { forwardRef } from '@nestjs/common';
import { OmitType } from '@nestjs/graphql';
import { Omit } from 'nexus/dist/core';

@Definition()
class RecipientInformation {
  @Property({ type: () => String })
  name: string;

  @Property({ type: () => String })
  phone: string;
}

@Definition({ timestamps: true })
export class OrderTransaction extends BaseModelHasOwner() {
  @Embedded(() => OrderNotId)
  orders: OrderNotId[];

  @Property({ type: () => String, db: { unique: true, sparse: true } })
  codeBill: string;

  @Property({ type: () => GraphQLObjectId })
  transactionId: ObjectId;

  @BelongsTo(() => Transaction, { from: 'transactionId' })
  transaction: Transaction;

  @Property({ type: () => Number, defaultValue: 0 })
  totalAmount: number;

  @Embedded(() => RecipientInformation)
  recipientInformation: RecipientInformation;
}
