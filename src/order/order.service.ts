import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Order, OrderItem } from './order.definition';
import { CartService } from 'src/cart/services/cart.service';
import { Cart } from 'src/cart/definition/cart.definition';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { CartItem } from 'src/cart/definition/cartItem.definiton';

@Injectable()
export class OrderService {
  constructor(
    @InjectBaseService(Cart)
    private cartService: BaseService<Cart, {}>,
    @InjectBaseService(CartShopItem)
    private cartShopitemService: BaseService<CartShopItem, {}>,
    @InjectBaseService(CartItem)
    private cartItemService: BaseService<CartItem, {}>,
    @InjectBaseService(Order) private orderService: BaseService<Order, {}>,
    @InjectBaseService(OrderItem)
    private orderItemService: BaseService<OrderItem, {}>,
  ) {}

  async createOrder(cartId: ObjectId, userId: ObjectId) {
    const cart = await this.cartService.findOne({}, { _id: cartId });
    const cartShopItems = await this.cartShopitemService.findAll(
      {},
      { cartId: cartId },
      {},
    );

    //   .populate('cartItem', '', this.cartItemService.model, {});

    console.log('🚀 ~ OrderService ~ createOrder ~ cart:', {
      cart,
      cartShopItems,
    });
    return true;
  }
}
