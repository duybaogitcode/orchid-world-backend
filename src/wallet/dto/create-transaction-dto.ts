import { InputType, OmitType } from '@nestjs/graphql';
import { Transaction } from '../transaction.definition';
import { CreateInputType } from 'dryerjs';

const TransactionInput = CreateInputType(Transaction);

@InputType()
export class CreateTransactionDto extends OmitType(TransactionInput, [
  'createdAt',
  'id',
  'sentWallet',
  'receiveWallet',
  'status',
  'updatedAt',
] as const) {}
