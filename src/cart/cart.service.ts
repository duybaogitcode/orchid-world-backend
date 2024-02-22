import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Cart } from './definition/cart.definition';
import { Product } from 'src/product/product.definition';
import { CartItem } from './definition/cartItem.definiton';
import { AddToCartDTO } from './dto/add-to-card.dto';

type CartContext = Cart;

@Injectable()
export class CartService {
  constructor(
    @InjectBaseService(Cart) public cartService: BaseService<Cart, CartContext>,
    @InjectBaseService(Product) public productService: BaseService<Product, {}>,
    @InjectBaseService(CartItem)
    public cartItemService: BaseService<CartItem, {}>,
  ) {}

  async createCartItem({
    cartId,
    productId,
    product,
    quantity,
    shopId,
  }): Promise<CartItem> {
    return this.cartItemService.create(null, {
      cartId,
      productId,
      product,
      quantity,
      shopId,
      totalPrice: product.price * quantity,
    });
  }

  async updateCartItemQuantity({
    cartItem,
    quantity,
  }: {
    cartItem: CartItem;
    quantity: number;
  }) {
    return this.cartItemService.update(null, {
      id: cartItem.id,
      quantity,
      totalPrice: cartItem.product.price * quantity,
    });
  }

  async addToCart({ productId, quantity, userId }: AddToCartDTO) {
    const product = await this.productService.findOne(null, {
      _id: productId,
    });
    console.log('🚀 ~ CartService ~ addToCart ~ product:', product);

    const cart = await this.cartService.findOneNullable(null, {
      authorId: userId,
    });
    console.log({ cart });
    // If Cart not found, create a new cart and add the product to it
    if (!cart) {
      const createdCart = await this.cartService.create(null, {
        authorId: userId,
        totalQuantity: quantity,
        totalPrice: product.price * quantity,
      });

      await this.createCartItem({
        cartId: createdCart.id,
        product: product,
        productId: product.id,
        quantity,
        shopId: product.authorId,
      });

      return createdCart;
    }

    // If Cart found

    // Check if the product is already in the cart
    const cartItem = await this.cartItemService.findOne(null, {
      where: {
        productId,
        cartId: cart.id,
      },
    });

    // If the product is already in the cart, update the quantity and totalPrice
    if (cartItem) {
      await this.updateCartItemQuantity({
        cartItem: cartItem,
        quantity: cartItem.quantity + quantity,
      });
    } else {
      // If the product is not in the cart, create a new cartItem
      await this.createCartItem({
        productId: new ObjectId(productId),
        product: product,
        quantity,
        cartId: cart.id,
        shopId: product.authorId,
      });
    }

    return cart;
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
