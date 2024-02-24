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
    const { amount, description, receiveWalletId, type } = createTransactionDto;

    let senderWalletId: ObjectId | null = null;
    let createdTransaction: Transaction | null = null,
      senderWallet: Wallet;

    let session;
    const updateAmount = type === TransactionType.WITHDRAW ? -amount : amount;
    try {
      const receiverWallet = await this.walletService.findOne(
        {},
        {
          _id: receiveWalletId,
        },
      );
      if (!receiverWallet) {
        throw new BadRequestException('Receiver wallet not found');
      }

      if (type === TransactionType.TRANSFER) {
        if (!receiveWalletId || !senderWalletId) {
          throw new BadRequestException('Receiver is required for transfer');
        }

        senderWallet = await this.walletService.findOne(
          {},
          {
            authorId: userId,
          },
        );

        senderWalletId = senderWallet?.id;

        if (!senderWallet) {
          throw new BadRequestException('Sender wallet not found');
        }
      }

      if (type === TransactionType.TOPUP || type === TransactionType.WITHDRAW) {
        if (senderWalletId) {
          throw new BadRequestException('Sender is not required for top-up');
        }
      }

      if (senderWalletId && senderWalletId === receiveWalletId) {
        throw new BadRequestException('Sender and receiver cannot be the same');
      }

      if (receiverWallet.balance + updateAmount < 0) {
        throw new BadRequestException('Not enough balance');
      }

      if (amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (senderWallet && senderWallet.balance - amount < 0) {
        throw new BadRequestException('Not enough balance');
      }

      createdTransaction = await this.transactionService.create(
        {},
        {
          amount: type === TransactionType.WITHDRAW ? -amount : amount,
          receiveWalletId,

          status: TransactionStatus.PENDING,
          type,
          description: description || this.getTransactionDescription({ type }),
          ...(senderWalletId && { sentWalletId: senderWalletId }),
        },
      );
      session = await this.walletService.model.startSession();
      session.startTransaction();
      switch (type) {
        case TransactionType.TOPUP:
        case TransactionType.WITHDRAW: {
          await this.walletService.update(
            {},
            {
              id: receiveWalletId,
              balance: receiverWallet.balance + updateAmount,
            },
          );
          break;
        }
        case TransactionType.TRANSFER: {
          await this.walletService.update(
            {},
            {
              id: receiveWalletId,
              balance: receiverWallet.balance + amount,
            },
          );

          await this.walletService.update(
            {},
            {
              id: senderWalletId,
              balance: senderWallet.balance - amount,
            },
          );
          break;
        }
        default: {
          throw new BadRequestException('Invalid transaction type');
        }
      }

      if (!createdTransaction) {
        throw new BadRequestException('Failed to create transaction');
      }

      await this.transactionService.update(
        {},
        {
          id: createdTransaction.id,
          status: TransactionStatus.SUCCESS,
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
    switch (type) {
      case TransactionType.TOPUP:
        return 'Nạp tiền từ hệ thống';
      case TransactionType.WITHDRAW:
        return 'Rút tiền từ hệ thống';
      case TransactionType.TRANSFER:
        return `Chuyển tiền`;
    }
  }
}
