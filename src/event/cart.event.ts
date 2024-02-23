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

@Injectable()
export class CartEvent {
  constructor(
    @InjectBaseService(CartShopItem)
    public cartShopItemService: BaseService<CartShopItem, Context>,
    @InjectBaseService(Cart) public cartService: BaseService<Cart, Context>,
    @InjectBaseService(CartItem)
    public cartItemService: BaseService<CartItem, Context>,
  ) {}

  @OnEvent('CartItem.added')
  async updateQuantityWhenCartItemCreated({
    input,
  }: AfterCreateHookInput<CartItem, Context>) {
    const session = await this.cartService.model.db.startSession();
    session.startTransaction();
    try {
      const cartItems = await this.cartItemService.model
        .find({
          cartShopItemId: input.cartShopItemId,
        })
        .session(session);

      const quantityShopItem = cartItems.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );
      const toltalPriceShopItem = cartItems.reduce(
        (acc, item) => acc + item.totalPrice,
        0,
      );

      const cartShopItem = await this.cartShopItemService.model.findById(
        input.cartShopItemId,
      );

      cartShopItem.totalQuantity = quantityShopItem;
      cartShopItem.totalPrice = toltalPriceShopItem;

      await cartShopItem.save({ session });

      const cartShopItems = await this.cartShopItemService.model
        .find({
          cartId: cartShopItem.cartId,
        })
        .session(session);

      const quantityCart = cartShopItems.reduce(
        (acc, item) => acc + item.totalQuantity,
        0,
      );

      const totalPriceCart = cartShopItems.reduce(
        (acc, item) => acc + item.totalPrice,
        0,
      );

      const cart = await this.cartService.model.findById(cartShopItem.cartId);
      cart.totalQuantity = quantityCart;
      cart.totalPrice = totalPriceCart;

      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
