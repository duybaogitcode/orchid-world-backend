import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Wallet } from 'src/wallet/wallet.definition';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { register } from 'module';
import { registerEnumType } from '@nestjs/graphql';
import { Feedbacks } from './feedbacks.definition';
import { Order } from 'src/order/definition/order.definition';
import { Product } from 'src/product/product.definition';
import { NotificationEvent } from 'src/notification/notification.service';
import { NotificationTypeEnum } from 'src/notification/notification.definition';

export enum FeedbackEventEnum {
  CREATED = 'Feedback.created',
}

registerEnumType(FeedbackEventEnum, {
  name: 'FeedbackEventEnum',
});

@Injectable()
export class FeedbackEvent {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Feedbacks)
    public feedback: BaseService<Feedbacks, Context>,
    @InjectBaseService(Product)
    public product: BaseService<Product, Context>,
  ) {}

  @OnEvent(FeedbackEventEnum.CREATED)
  async createFeedback({ order }: { order: Order }) {
    const session = await this.feedback.model.db.startSession();
    session.startTransaction();

    try {
      const listProductSlug = order?.shop?.productInOrder.map((product) => {
        return product.slug;
      });

      const products = await this.product.model.find({
        slug: { $in: listProductSlug },
      });

      for (let i = 0; i < products.length; i++) {
        const productId = products[i]._id;
        const newFeedbacks = new this.feedback.model({
          productId: new ObjectId(productId),
          authorId: new ObjectId(order.authorId),
        });
        this.eventEmitter.emit(NotificationEvent.SEND, {
          href: `/feedback/${newFeedbacks._id}`,
          message:
            'Feedback của bạn đã được tạo thành công!, hãy đánh giá sản phẩm mà bạn vừa mua!',
          notificationType: NotificationTypeEnum.FEEDBACK,
          receiver: newFeedbacks.authorId,
        });
        await newFeedbacks.save({ session });
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
}
