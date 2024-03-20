import { Int, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Wallet } from './wallet.definition';

export enum TransactionType {
  INCREASE = '1', // Cong tien
  DECREASE = '0', // Tru tien
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});

@Definition({
  timestamps: true,
})
export class Transaction extends BaseModel() {
  @Property({
    type: () => String,
    nullable: true,
  })
  description: string;

  @Property({
    type: () => GraphQLObjectId,
    db: {
      unique: false,
    },
  })
  walletId: ObjectId; // This will be null if the system is sending money

  @BelongsTo(() => Wallet, { from: 'walletId' })
  wallet: Wallet;

  @Property({
    type: () => Number,
    nullable: true,
    defaultValue: -1,
    db: {
      default: -1,
    },
  })
  amount: number;

  @Property({
    type: () => String,
    nullable: true,
    db: { unique: true, sparse: true },
  })
  paypalOrderId: string;

  @Property({
    type: () => String,
    nullable: true,
    db: { unique: true, sparse: true },
  })
  paypalBatchId: string;

  @Property({
    type: () => TransactionType,
    nullable: true,
  })
  type: TransactionType;

  @Property({
    type: () => TransactionStatus,
    db: {
      default: TransactionStatus.PENDING,
    },
  })
  status: TransactionStatus;
}
