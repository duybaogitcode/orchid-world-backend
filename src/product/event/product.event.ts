import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';

import { OnEvent } from '@nestjs/event-emitter';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { CartItem } from 'src/cart/definition/cartItem.definiton';
import { OrderTransaction } from 'src/order/definition/orderTransaction.definition';
import { Product, ProductStatus } from '../product.definition';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { registerEnumType } from '@nestjs/graphql';

export enum ProductEventEnum {
  UPFILE = 'Product.upfile',
  DELETEURL = 'Product.deleteURL',
}

registerEnumType(ProductEventEnum, {
  name: 'ProductEventEnum',
});

@Injectable()
export class ProductEvent {
  constructor(
    @InjectBaseService(Product)
    public product: BaseService<Product, Context>,
    @InjectBaseService(CartItem)
    public cartItem: BaseService<CartItem, Context>,
    private readonly firebase: FirebaseService,
  ) {}

  @OnEvent('Orders.created')
  async updateProductAfterOrderCreated({
    input,
  }: AfterCreateHookInput<any, Context>) {
    const session = await this.product.model.db.startSession();
    session.startTransaction();
    try {
      console.log('product event orders created');
      for (const item of input.listProductInOrder) {
        const product = await this.product.model
          .findOne({
            slug: item.slug,
          })
          .session(session);

        product.quantity = product.quantity - item.quantity;
        await product.save({ session: session });

        if (product.quantity < 0) {
          product.status = ProductStatus.NOT_AVAILABLE;
          await product.save({ session: session });
        }

        const cartItem = await this.cartItem.model.find({
          productId: product.id,
        });

        if (cartItem.length > 0) {
          for (const item of cartItem) {
            if (item.quantity > product.quantity) {
              item.isAvailableProduct = false;
              await item.save({ session: session });
            }
          }
        }
      }
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  @OnEvent(ProductEventEnum.DELETEURL)
  async deleteURL({ input }: AfterCreateHookInput<any, Context>) {
    try {
      await Promise.all(
        input.map((filePath) => this.firebase.deleteFile(filePath)),
      );
    } catch (error) {
      console.log(error);

      throw error;
    }
  }
}
