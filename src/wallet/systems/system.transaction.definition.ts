import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { ServiceProvider } from 'src/payment/payment.definition';
import { Wallet } from '../wallet.definition';

@Definition({ timestamps: true })
export class SystemTransaction extends BaseModel() {
  @Property({ type: () => String })
  logs: string;

  @Property({ type: () => Number })
  amount: number;

  @Property({ type: () => GraphQLObjectId })
  systemWalletId: ObjectId;

  @Property({ type: () => Number, defaultValue: 1 })
  rate: number;

  @Property({ type: () => Number, defaultValue: 0 })
  serviceFee: number;

  @Property({ type: () => Number })
  afterExchange: number;

  @Property({ type: () => GraphQLObjectId })
  walletId: ObjectId;

  @BelongsTo(() => Wallet, { from: 'walletId' })
  fromWallet: Wallet;

  @Property({ type: () => String, nullable: true })
  totalTopUp: string;

  @Property({ type: () => String, nullable: true })
  totalWithDraw: string;

  @Property({ type: () => ServiceProvider, nullable: true })
  serviceProvider: ServiceProvider;
}
