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
  TOPUP = 'TOPUP', // Nap tien
  WITHDRAW = 'WITHDRAW', // Rut tien
  TRANSFER = 'TRANSFER', // Chuyen tien
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
    nullable: true,
  })
  sentWalletId: ObjectId; // This will be null if the system is sending money

  @BelongsTo(() => Wallet, { from: 'sentWalletId' })
  sentWallet: Wallet;

  @Property({
    type: () => GraphQLObjectId,
    db: {
      unique: false,
    },
  })
  receiveWalletId: ObjectId;

  @BelongsTo(() => Wallet, { from: 'receiveWalletId' })
  receiveWallet: Wallet;

  @Property({
    type: () => Int,
  })
  amount: number;

  @Property({
    type: () => TransactionType,
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
