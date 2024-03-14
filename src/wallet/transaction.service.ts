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
import { PaymentService } from 'src/payment/payment.service';
import { ServiceProvider } from 'src/payment/payment.definition';
import { ExchangeInput } from 'src/payment/dto/exchange.input';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemWalletEventEnum } from './event/system.wallet.event';
import { doesWalletAffordable } from './wallet.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectBaseService(Transaction)
    public transactionService: BaseService<Transaction, {}>,
    @InjectBaseService(User) public userService: BaseService<User, {}>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, {}>,
    private readonly paypalService: PaypalService,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
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
    const session = await this.walletService.model.startSession();
    const updateAmount = type === TransactionType.DECREASE ? -amount : amount;
    const receiverWallet = await this.walletService.model.findById(walletId);
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

      this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
        input: {
          amount,
          type,
          walletId,
          logs: description,
          serviceProvider: ServiceProvider.paypal,
          isTopUpOrWithdraw: true,
        },
      });

      const createdTransaction = new this.transactionService.model({
        amount: amount,
        walletId,
        status: TransactionStatus.SUCCESS,
        type,
        description: description || this.getTransactionDescription({ type }),
        paypalOrderId: createTransactionDto.paypalOrderId,
      });
      await createdTransaction.save({ session });
      receiverWallet.balance += updateAmount;
      await receiverWallet.save({ session });

      setTimeout(() => {
        this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
          input: {
            amount,
            type: TransactionType.DECREASE,
            walletId,
            logs: description,
            serviceProvider: ServiceProvider.paypal,
            isTopUpOrWithdraw: false,
          },
        });
      }, 3000);

      await session.commitTransaction();
      session.endSession();

      return createdTransaction;
    } catch (error) {
      console.log('🚀 ~ TransactionService ~ error:', error);

      await session.abortTransaction();
      session.endSession();

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

    const { amount, payPalUserName } = input;

    if (Number(amount) <= 50000) {
      throw new BadRequestException('Amount must be greater than 50000');
    }

    if (Number(amount) > wallet.balance) {
      throw new BadRequestException('Not enough balance');
    }

    const isAffordable = doesWalletAffordable(wallet, amount);
    if (!isAffordable) {
      throw new BadRequestException(
        'Not enough balance because of your lock funds',
      );
    }

    const exchagneInput: ExchangeInput = {
      amount: amount,
      serviceProvider: ServiceProvider.paypal,
    };

    const exchangeMoney = this.paymentService.exchangeMoney(exchagneInput);

    const batchId = uuidv4();
    const session = await this.walletService.model.startSession();
    session.startTransaction();

    try {
      await this.paypalService.createPayout(
        batchId,
        exchangeMoney.totalWithDraw,
        payPalUserName,
        ctx.id.toString(),
      );

      const transaction = new this.transactionService.model({
        amount: amount,
        walletId: wallet._id,
        status: TransactionStatus.SUCCESS,
        type: TransactionType.DECREASE,
        description: 'Rút tiền',
        paypalOrderId: batchId,
      });

      await transaction.save({ session });

      wallet.balance -= amount;
      if (wallet.balance < 0) {
        throw new BadRequestException('Not enough balance');
      }

      this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
        input: {
          amount: amount,
          type: TransactionType.INCREASE,
          walletId: wallet._id,
          logs: '',
          serviceProvider: ServiceProvider.paypal,
          isTopUpOrWithdraw: false,
        },
      });

      await wallet.save({ session });

      setTimeout(() => {
        this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
          input: {
            amount: amount,
            type: TransactionType.DECREASE,
            walletId: wallet._id,
            logs: '',
            serviceProvider: ServiceProvider.paypal,
            isTopUpOrWithdraw: true,
          },
        });
      }, 3000);
      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (error) {
      console.log('🚀 ~ TransactionService ~ error:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
