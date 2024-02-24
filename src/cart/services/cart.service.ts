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
        .findOne({
          slug: input.productSlug,
        })
        .session(session);

      if (!product) {
        throw new Error('Product not found or out of stock');
      }

      let cartShopItemId, cartId, cartShopItemReturn;

      const cart = await this.cartService.model
        .findOne({
          authorId: new ObjectId(uid),
        })
        .session(session);

      if (!cart) {
        // Rarely happen. Because the cart will be created when the user is created
        const newCart = new this.cartService.model({
          authorId: new ObjectId(uid),
        });
        await newCart.save({ session });
        cartId = newCart.id;
      } else {
        cartId = cart.id;
      }
      // product.quantity -= input.quantity;
      // await product.save({ session });

      const cartShopItemExsist = await this.CartIShopItemService.model
        .findOne({
          shopId: product.authorId,
          cartId: cartId,
        })
        .session(session);

      if (!cartShopItemExsist) {
        const cartShopItem = new this.CartIShopItemService.model({
          cartId: cartId,
          shopId: product.authorId,
        });
        await cartShopItem.save({ session });
        cartShopItemId = cartShopItem.id;
        cartShopItemReturn = cartShopItem;
      } else {
        cartShopItemId = cartShopItemExsist.id;
        cartShopItemReturn = cartShopItemExsist;
      }

      const cartItemExist = await this.cartItemService.model
        .findOne({
          productId: product.id,
          cartShopItemId: cartShopItemId,
        })
        .session(session);

      if (cartItemExist) {
        cartItemExist.quantity += input.quantity;
        cartItemExist.totalPrice =
          (input.quantity + cartItemExist.quantity) * product.price;
        if (cartItemExist.quantity > product.quantity) {
          throw new Error('Product out of stock');
        }
        await cartItemExist.save({ session });
        const { toltalPriceShopItem, quantityShopItem } =
          await this.calculateTotalPriceAndQuantity(cartShopItemId, session);
        cartShopItemReturn.totalPrice = toltalPriceShopItem;
        cartShopItemReturn.totalQuantity = quantityShopItem;
        await session.commitTransaction();
        this.eventEmitter.emit('CartItem.added', { input: cartItemExist });

        session.endSession();

        return cartShopItemReturn;
      }

      const cartItem = new this.cartItemService.model({
        cartShopItemId: cartShopItemId,
        productId: product.id,
        quantity: input.quantity,
        totalPrice: product.price * input.quantity,
      });
      await cartItem.save({ session });
      if (cartItem.quantity > product.quantity) {
        throw new Error('Product out of stock');
      }

      const { toltalPriceShopItem, quantityShopItem } =
        await this.calculateTotalPriceAndQuantity(cartShopItemId, session);
      cartShopItemReturn.totalPrice = toltalPriceShopItem;
      cartShopItemReturn.totalQuantity = quantityShopItem;
      this.eventEmitter.emit('CartItem.added', { input: cartItem });

      await session.commitTransaction();
      session.endSession();

      return cartShopItemReturn;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private async calculateTotalPriceAndQuantity(
    cartShopItemId: ObjectId,
    session: any,
  ) {
    const cartItems = await this.cartItemService.model
      .find({
        cartShopItemId: cartShopItemId,
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

    return { toltalPriceShopItem, quantityShopItem };
  }

  @OnEvent('User.created')
  async createCartWhenUserCreated({
    input,
  }: AfterCreateHookInput<User, CartContext>) {
    this.cartService.create(null, {
      authorId: input.id,
    });
    console.log(
      '🚀 ~ file: cart.service.ts ~ line 30 ~ CartService ~ createCartWhenUserCreated ~ input',
      input,
    );
  }
}
