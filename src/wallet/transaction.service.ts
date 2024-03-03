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
import { PaypalService } from 'src/payment/paypal.service';
import { WithdrawPaypalInput } from './dto/withdraw-paypal.input';
import { Context } from 'src/auth/ctx';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionService {
  constructor(
    @InjectBaseService(Transaction)
    public transactionService: BaseService<Transaction, {}>,
    @InjectBaseService(User) public userService: BaseService<User, {}>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, {}>,
    private readonly paypalService: PaypalService,
  ) {}

  async createOne(
    createTransactionDto: CreateTransactionDto,
    userId: ObjectId,
  ) {
    await this.paypalService.getCapture(createTransactionDto.paypalOrderId);

    const checkPaypalOrder = await this.transactionService.model.findOne({
      paypalOrderId: createTransactionDto.paypalOrderId,
    });

    if (checkPaypalOrder) {
      throw new BadRequestException('OrderPayPal already exists');
    }

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
          paypalOrderId: createTransactionDto.paypalOrderId,
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

  async findAllMyTransactions(
    userId: ObjectId,
    { page = 1, limit = 10, sort },
  ) {
    console.log(
      '🚀 ~ TransactionService ~ findAllMyTransactions ~ userId:',
      userId,
    );
    const userWallet = await this.walletService.findOne(
      {},
      {
        userId,
      },
    );

    return this.transactionService.paginate(
      {},
      {
        walletId: userWallet.id,
      },
      {
        ...sort,
      },
      page,
      limit,
    );
  }

  async withDrawPayPal(input: WithdrawPaypalInput, ctx: Context) {
    const wallet = await this.walletService.model.findOne({
      authorId: new ObjectId(ctx.id),
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const { totalWithDraw, payPalUserName } = input;

    if (Number(totalWithDraw) <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (Number(totalWithDraw) > wallet.balance) {
      throw new BadRequestException('Not enough balance');
    }

    const batchId = uuidv4();

    try {
      await this.paypalService.createPayout(
        batchId,
        totalWithDraw,
        payPalUserName,
        ctx.id.toString(),
      );

      const transaction = await this.transactionService.create(
        {},
        {
          amount: +totalWithDraw,
          walletId: wallet.id,
          status: TransactionStatus.SUCCESS,
          type: TransactionType.DECREASE,
          paypalBatchId: batchId,
          description: 'Rút tiền từ PayPal',
        },
      );

      await this.walletService.update(
        {},
        {
          id: wallet.id,
          balance: wallet.balance - Number(totalWithDraw),
        },
      );

      return transaction;
    } catch (error) {
      console.log('🚀 ~ TransactionService ~ error:', error);
      throw error;
    }
  }
}
