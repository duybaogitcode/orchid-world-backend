import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Context, Ctx } from 'src/auth/ctx';
import { OutputType, PaginatedOutputType, SortDirection } from 'dryerjs';
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

  @Query(() => PaginatedOutputType(Transaction), { name: 'myTransactions' })
  findAllMyTransactions(
    @Args('page', {
      nullable: true,
      defaultValue: 1,
      type: () => Int,
    })
    page: number,
    @Args('limit', {
      nullable: true,
      defaultValue: 10,
      type: () => Int,
    })
    limit: number,

    @Ctx() ctx: Context,
  ) {
    console.log('🚀 ~ TransactionResolver ~ ctx:', ctx);
    return this.transactionService.findAllMyTransactions(ctx?.id, {
      page,
      limit,
      sort: {},
    });
  }
}
