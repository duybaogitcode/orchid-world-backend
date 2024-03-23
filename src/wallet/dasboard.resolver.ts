import {
  Args,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import { Context, Ctx } from 'src/auth/ctx';
import {
  Definition,
  FilterType,
  OutputType,
  PaginatedOutputType,
  Property,
  SortDirection,
  SortType,
} from 'dryerjs';
import { Transaction } from './transaction.definition';
import { WithdrawPaypalInput } from './dto/withdraw-paypal.input';
import { Admin, AuthenticatedUser } from 'src/guard/roles.guard';
import { filter } from 'rxjs';
import { BaseModel } from 'src/base/base.definition';
import { Order, OrderStatus } from 'src/order/definition/order.definition';
import { DashboardService } from './dashboard.service';
import { SystemTransaction } from './systems/system.transaction.definition';

@Resolver()
export class AdminResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Admin()
  @Query(() => OutputType(Dashboard), { name: 'dashboard' })
  async dashboard(@Ctx() ctx: Context) {
    const response = await this.dashboardService.dashboard();
    return response;
  }
}

@Definition()
export class Dashboard extends BaseModel() {
  @Property({ type: () => Number })
  totalAmountOrder: number;

  @Property({ type: () => Number })
  totalOrder: number;

  @Property({ type: () => Number })
  totalUser: number;

  @Property({ type: () => Number })
  totalProduct: number;

  @Property({ type: () => totalProductByType })
  totalProductByType: TotalProductByType[];

  @Property({ type: () => totalOrderByStatus })
  totalOrderByStatus: TotalOrderByStatus[];

  @Property({ type: () => order })
  orderSuccess: Order[];

  @Property({ type: () => Number })
  systemWallet: number;

  @Property({ type: () => systemTransaction })
  systemTransaction: SystemTransaction[];
}

@Definition()
export class TotalProductByType {
  @Property({ type: () => String, nullable: true })
  _id: string;

  @Property({ type: () => Number, nullable: true })
  count: number;
}
@Definition()
export class TotalOrderByStatus {
  @Property({ type: () => Number })
  totalAmount: number;

  @Property({ type: () => String })
  _id: string;

  @Property({ type: () => Number })
  count: Number;
}

const totalProductByType = [OutputType(TotalProductByType)];
const totalOrderByStatus = [OutputType(TotalOrderByStatus)];
const order = [OutputType(Order)];
const systemTransaction = [OutputType(SystemTransaction)];
