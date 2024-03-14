import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Context, Ctx } from 'src/auth/ctx';
import {
  FilterType,
  OutputType,
  PaginatedOutputType,
  SortDirection,
  SortType,
} from 'dryerjs';
import { Transaction } from './transaction.definition';
import { WithdrawPaypalInput } from './dto/withdraw-paypal.input';
import { AuthenticatedUser } from 'src/guard/roles.guard';
import { filter } from 'rxjs';

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

  @AuthenticatedUser()
  @Mutation(() => OutputType(Transaction), { name: 'withDrawPaypal' })
  withDrawPaypal(
    @Args('input') input: WithdrawPaypalInput,
    @Ctx() ctx: Context,
  ) {
    return this.transactionService.withDrawPayPal(input, ctx);
  }

  @AuthenticatedUser()
  @Query(() => PaginatedOutputType(Transaction), { name: 'myTransactions' })
  findAllMyTransactions(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('sort', { type: () => SortType(Transaction), nullable: true })
    sort: any,
    @Ctx() ctx: Context,
  ) {
    return this.transactionService.findAllMyTransactions(
      ctx.id,
      sort,
      page,
      limit,
    );
  }
}
