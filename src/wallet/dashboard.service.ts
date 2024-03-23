import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService } from 'dryerjs';
import { Order, OrderStatus } from 'src/order/definition/order.definition';
import { Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import { SystemWallet } from './systems/system.wallet.definition';
import { SystemTransaction } from './systems/system.transaction.definition';

Injectable();
export class DashboardService {
  constructor(
    @InjectBaseService(User) public userService: BaseService<User, {}>,
    @InjectBaseService(Order) public orderService: BaseService<Order, {}>,
    @InjectBaseService(Product) public productService: BaseService<Product, {}>,
    @InjectBaseService(SystemWallet)
    public systemWalletService: BaseService<SystemWallet, {}>,
    @InjectBaseService(SystemTransaction)
    public systemTransaction: BaseService<SystemTransaction, {}>,
  ) {}

  async dashboard() {
    const totalUser = await this.userService.model.countDocuments();
    const totalOrder = await this.orderService.model.countDocuments();
    const totalProduct = await this.productService.model.countDocuments();
    const totalAmountOrder = await this.orderService.model.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalProductByType = await this.productService.model.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalOrderByStatus = await this.orderService.model.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const orderSuccess = await this.orderService.model.find({
      status: OrderStatus.DELIVERED,
    });

    const systemWallets = await this.systemWalletService.model.find();
    const systemWallet = systemWallets[0];
    const systemTransaction = await this.systemTransaction.model.find();

    return {
      orderSuccess,
      totalAmountOrder: totalAmountOrder[0]?.totalAmount || 0,
      totalUser,
      totalOrder,
      totalProduct,
      totalProductByType,
      totalOrderByStatus,
      systemWallet: systemWallet?.balance,
      systemTransaction,
    };
  }
}
