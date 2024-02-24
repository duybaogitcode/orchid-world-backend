import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Context, Ctx } from 'src/auth/ctx';
import { OutputType } from 'dryerjs';
import { Transaction } from './transaction.definition';

@Resolver()
export class TransactionResolver {
  constructor(private readonly transactionService: TransactionService) {}

  @Mutation(() => OutputType(Transaction), { name: 'createTransaction' })
  createTransaction(
    @Args('input') input: CreateTransactionDto,
    @Ctx() ctx: Context,
  ) {
    return this.transactionService.createOne(input, ctx?.id);
  }
}
