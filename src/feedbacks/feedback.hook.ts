import { Injectable } from '@nestjs/common';
import {
  AfterUpdateHook,
  AfterUpdateHookInput,
  BaseService,
  BeforeFindManyHook,
  BeforeFindManyHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { UserRole } from 'src/guard/roles.guard';
import { Feedbacks } from './feedbacks.definition';
import { Product } from 'src/product/product.definition';

@Injectable()
export class FeedbackHook {
  constructor(
    @InjectBaseService(Product)
    public productService: BaseService<Product>,
    @InjectBaseService(Feedbacks)
    public feedbacksService: BaseService<Feedbacks>,
  ) {}

  @AfterUpdateHook(() => Feedbacks)
  async afterUpdateFeedback({ updated }: AfterUpdateHookInput) {
    const product = await this.productService.model.findById(updated.productId);
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
  }
}
