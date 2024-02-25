import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { CreateTransactionDto } from './dto/create-transaction-dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.definition';
import { Wallet } from './wallet.definition';

@Injectable()
export class TransactionService {
  constructor(
    @InjectBaseService(Transaction)
    public transactionService: BaseService<Transaction, {}>,
    @InjectBaseService(User) public userService: BaseService<User, {}>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, {}>,
  ) {}

  async createOne(
    createTransactionDto: CreateTransactionDto,
    userId: ObjectId,
  ) {
    const { amount, description, walletId, type } = createTransactionDto;
    let createdTransaction: Transaction;
    const session = await this.walletService.model.startSession();
    const updateAmount = type === TransactionType.DECREASE ? -amount : amount;
    const receiverWallet = await this.walletService.findOne(
      {},
      {
        _id: walletId,
      },
    );
    if (!receiverWallet) {
      throw new BadRequestException('Receiver wallet not found');
    }

    if (receiverWallet.balance + updateAmount < 0) {
      throw new BadRequestException('Not enough balance');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    try {
      session.startTransaction();
      createdTransaction = await this.transactionService.create(
        {},
        {
          amount: amount,
          walletId,
          status: TransactionStatus.SUCCESS,
          type,
          description: description || this.getTransactionDescription({ type }),
        },
      );
      await this.walletService.update(
        {},
        {
          id: walletId,
          balance: receiverWallet.balance + updateAmount,
        },
      );

      await session.commitTransaction();
      session.endSession();

      return createdTransaction;
    } catch (error) {
      console.log('🚀 ~ TransactionService ~ error:', error);
      if (createdTransaction) {
        await this.transactionService.update(
          {},
          {
            id: createdTransaction?.id,
            status: TransactionStatus.FAILED,
          },
        );
      }
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  getTransactionDescription({ type }: { type: TransactionType }) {
    return type === TransactionType.INCREASE ? 'Nạp tiền' : 'Rút tiền';
  }
}
