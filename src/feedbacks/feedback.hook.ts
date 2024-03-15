import { Injectable } from '@nestjs/common';
import {
  AfterUpdateHook,
  AfterUpdateHookInput,
  BaseService,
  BeforeFindManyHook,
  BeforeFindManyHookInput,
  BeforeUpdateHook,
  BeforeUpdateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { UserRole } from 'src/guard/roles.guard';
import { Feedbacks } from './feedbacks.definition';
import { Product } from 'src/product/product.definition';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { FileUpload } from 'graphql-upload-ts';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { Categories } from 'src/orthersDef/categories.definition';

@Injectable()
export class FeedbackHook {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Product)
    public productService: BaseService<Product>,
    @InjectBaseService(Feedbacks)
    public feedbacksService: BaseService<Feedbacks>,
    @InjectBaseService(Categories)
    public category: BaseService<Categories>,
    private readonly firebase: FirebaseService,
  ) {}

  @BeforeUpdateHook(() => Feedbacks)
  async beforeUpdateFeedback({
    input,
    ctx,
  }: BeforeUpdateHookInput<Feedbacks, Context>) {
    const checkFeedback = await this.feedbacksService.model.findById(input.id);

    if (!checkFeedback) {
      throw new Error('Feedback not exist');
    }

    if (checkFeedback.authorId.toString() !== ctx.id.toString()) {
      throw new Error('You are not authorized to edit this feedback');
    }

    let media = [];
    if (input.file) {
      const files = input.file;

      const uploadPromises = files.map(
        async (filePromise: Promise<FileUpload>) => {
          const file = await filePromise;
          return this.firebase.uploadFile(file, 'product');
        },
      );

      const urls = await Promise.all(uploadPromises);
      media = await Promise.all(urls.map((url) => Promise.resolve(url)));
    }

    input.media = media;
  }

  @AfterUpdateHook(() => Feedbacks)
  async afterUpdateFeedback({ updated }: AfterUpdateHookInput) {
    const product = await this.productService.model.findById(updated.productId);
    const category = await this.category.model.findById(product.category_id);
    const feedbacks = await this.feedbacksService.model.find({
      productId: updated.productId,
    });
    let totalRating = 0;
    let totalFeedback = 0;
    for (let i = 0; i < feedbacks.length; i++) {
      totalRating += feedbacks[i].rating;
      totalFeedback++;
    }
    const avgRating = totalRating / totalFeedback;
    product.rating = avgRating;
    await product.save();

    this.eventEmitter.emit(NotificationEvent.SEND, {
      href: `/${category.slug}/${product.slug}`,
      message: 'Bạn có feedback mới về đơn hàng của mình, hãy kiểm tra ngay!',
      notificationType: NotificationTypeEnum.PRODUCT,
      receiver: product.authorId,
    });
  }
}
