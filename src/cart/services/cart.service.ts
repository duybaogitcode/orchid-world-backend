import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import { Cart } from '../definition/cart.definition';
import { CartItem } from '../definition/cartItem.definiton';
import { CartShopItem } from '../definition/cartShopItem.definition';
import { CartItemInput } from '../dto/create-cartItem.input';
import { ActionCartTypes, UpdateCartInput } from '../dto/update-cartItem.input';
type CartContext = Cart;

@Injectable()
export class CartService {
  constructor(
    @InjectBaseService(Cart) public cartService: BaseService<Cart, CartContext>,
    @InjectBaseService(CartShopItem)
    public CartIShopItemService: BaseService<CartShopItem, CartContext>,
    private eventEmitter: EventEmitter2,
    @InjectBaseService(Product) public productService: BaseService<Product, {}>,
    @InjectBaseService(CartItem)
    public cartItemService: BaseService<CartItem, {}>,
  ) {}

  async addToCart(input: CartItemInput, uid: ObjectId) {
    const session = await this.productService.model.db.startSession();
    session.startTransaction();
    try {
      const product = await this.productService.model
        .findOne({ slug: input.productSlug })
        .session(session);

      if (!product) {
        throw new Error('Product not found or out of stock');
      }

      const cartId = await this.getOrCreateCart(uid, session);
      const cartShopItemId = await this.getOrCreateCartShopItem(
        product,
        cartId,
        session,
      );
      await this.getOrCreateCartItem(input, product, cartShopItemId, session);

      const result = await this.calculateTotalPriceAndQuantity(
        cartId,
        cartShopItemId,
        session,
      );

      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private async getOrCreateCart(uid: ObjectId, session: any) {
    const cart = await this.cartService.model.findOneAndUpdate(
      { authorId: new ObjectId(uid) },
      { $setOnInsert: { authorId: new ObjectId(uid) } },
      { new: true, upsert: true, session },
    );

    return cart.id;
  }

  private async getOrCreateCartShopItem(
    product: Product,
    cartId: ObjectId,
    session: any,
  ) {
    const cartShopItem = await this.CartIShopItemService.model.findOneAndUpdate(
      { shopId: product.authorId, cartId: cartId },
      { $setOnInsert: { cartId: cartId, shopId: product.authorId } },
      { new: true, upsert: true, session },
    );

    return cartShopItem.id;
  }

  private async getOrCreateCartItem(
    input: CartItemInput,
    product: any,
    cartShopItemId: ObjectId,
    session: any,
  ) {
    const cartItem = await this.cartItemService.model.findOneAndUpdate(
      { productId: product.id, cartShopItemId: cartShopItemId },
      {
        $inc: {
          quantity: input.quantity,
          totalPrice: product.price * input.quantity,
        },
        $set: {
          isAvailableProduct: true,
        },
      },
      { new: true, upsert: true, session },
    );

    if (cartItem.quantity > product.quantity) {
      throw new Error('Product out of stock');
    }
  }

  private async calculateTotalPriceAndQuantity(
    cartId: ObjectId,
    cartShopItemId: ObjectId,
    session: any,
  ) {
    const cartShopItemAggregation = await this.CartIShopItemService.model
      .aggregate([
        { $match: { _id: cartShopItemId } },
        {
          $lookup: {
            from: 'cartitems',
            localField: '_id',
            foreignField: 'cartShopItemId',
            as: 'cartItems',
          },
        },
        {
          $addFields: {
            totalQuantity: { $sum: '$cartItems.quantity' },
            totalPrice: { $sum: '$cartItems.totalPrice' },
          },
        },
      ])
      .session(session);

    const cartShopItem = cartShopItemAggregation[0];
    await this.CartIShopItemService.model.updateOne(
      { _id: cartShopItemId },
      {
        $set: {
          totalQuantity: cartShopItem.totalQuantity,
          totalPrice: cartShopItem.totalPrice,
        },
      },
      { session },
    );

    const cartAggregation = await this.cartService.model
      .aggregate([
        { $match: { _id: cartId } },
        {
          $lookup: {
            from: 'cartshopitems',
            localField: '_id',
            foreignField: 'cartId',
            as: 'cartShopItems',
          },
        },
        {
          $addFields: {
            totalQuantity: { $sum: '$cartShopItems.totalQuantity' },
            totalPrice: { $sum: '$cartShopItems.totalPrice' },
          },
        },
      ])
      .session(session);

    const cart = cartAggregation[0];
    await this.cartService.model.updateOne(
      { _id: cartId },
      {
        $set: {
          totalQuantity: cart.totalQuantity,
          totalPrice: cart.totalPrice,
        },
      },
      { session },
    );

    cart.id = cart._id;

    return cart;
  }

  async calculateTotalPriceAndQuantityForCart(cartId: ObjectId, session: any) {
    const cartAggregation = await this.cartService.model
      .aggregate([
        { $match: { _id: cartId } },
        {
          $lookup: {
            from: 'cartshopitems',
            localField: '_id',
            foreignField: 'cartId',
            as: 'cartShopItems',
          },
        },
        {
          $addFields: {
            totalQuantity: { $sum: '$cartShopItems.totalQuantity' },
            totalPrice: { $sum: '$cartShopItems.totalPrice' },
          },
        },
      ])
      .session(session);

    const cart = cartAggregation[0];
    await this.cartService.model.updateOne(
      { _id: cartId },
      {
        $set: {
          totalQuantity: cart.totalQuantity,
          totalPrice: cart.totalPrice,
        },
      },
      { session },
    );

    cart.id = cart._id;

    return cart;
  }
  async updateCartItem(input: UpdateCartInput, uid: ObjectId) {
    const session = await this.cartItemService.model.db.startSession();
    session.startTransaction();
    try {
      if (input.quantity < 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const cartItem = await this.cartItemService.model
        .findById(input.id)
        .session(session);

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      const product = await this.productService.model
        .findById(cartItem.productId)
        .session(session);

      if (input.quantity > product.quantity) {
        throw new Error('Product out of stock');
      }

      let shouldCheckCartShopItem = false;

      switch (input.action) {
        case ActionCartTypes.REMOVE:
          await this.cartItemService.model
            .findByIdAndDelete(input.id)
            .session(session);
          shouldCheckCartShopItem = true;
          break;
        case ActionCartTypes.QUANTITY:
          cartItem.quantity = input.quantity;
          break;
        case ActionCartTypes.PLUS:
          cartItem.quantity += 1;
          break;
        case ActionCartTypes.MINUS:
          cartItem.quantity -= 1;
          break;
        default:
          break;
      }

      if (cartItem.quantity > product.quantity) {
        throw new Error('Product out of stock');
      }

      if (input.action !== ActionCartTypes.REMOVE) {
        if (cartItem.quantity <= 0) {
          await this.cartItemService.model
            .findByIdAndDelete(input.id)
            .session(session);
          shouldCheckCartShopItem = true;
        } else {
          await cartItem.save({ session });
        }
      }

      const cartShopItem = await this.CartIShopItemService.model
        .findById(cartItem.cartShopItemId)
        .session(session);

      if (shouldCheckCartShopItem) {
        const cartItems = await this.cartItemService.model
          .find({ cartShopItemId: cartItem.cartShopItemId })
          .session(session);
        if (cartItems.length === 0) {
          await this.CartIShopItemService.model
            .findByIdAndDelete(cartItem.cartShopItemId)
            .session(session);
          const cart = await this.calculateTotalPriceAndQuantityForCart(
            cartShopItem.cartId,
            session,
          );
          await session.commitTransaction();
          session.endSession();
          return cart;
        }
      }

      const cart = await this.calculateTotalPriceAndQuantity(
        cartShopItem.cartId,
        cartItem.cartShopItemId,
        session,
      );

      await session.commitTransaction();
      session.endSession();

      return cart;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error; // re-throw the error
    }
  }

  @OnEvent('User.created')
  async createCartWhenUserCreated({
    input,
  }: AfterCreateHookInput<User, CartContext>) {
    this.cartService.create(null, {
      authorId: input.id,
      totalPrice: 0,
      totalQuantity: 0,
    });
    console.log(
      '🚀 ~ file: cart.service.ts ~ line 30 ~ CartService ~ createCartWhenUserCreated ~ input',
      input,
    );
  }
}
