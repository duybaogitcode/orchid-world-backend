import {
  Args,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { SubscribeToSubscriptionDTO } from './dto/subscribe.dto';
import { SubscriptionService } from './subscription.service';
import { Context, Ctx } from 'src/auth/ctx';
import { UserSubscription } from './subscription.definition';
import { ObjectId, OutputType } from 'dryerjs';
import { ShopOnly } from 'src/guard/roles.guard';
import { SuccessResponse } from 'dryerjs/dist/types';

@Resolver()
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ShopOnly()
  @Mutation(() => OutputType(UserSubscription), {
    name: 'subscribeAuctionSubscription',
  })
  async subscribe(
    @Args('input') input: SubscribeToSubscriptionDTO,
    @Ctx() ctx: Context,
  ) {
    // Logic to subscribe to a subscription
    console.log('input', ctx);
    return this.subscriptionService.subscribe(new ObjectId(ctx?.id), input);
  }

  @ShopOnly()
  @Mutation(() => SuccessResponse, {
    name: 'unsubscribeAuctionSubscription',
  })
  async unsubscribe(@Ctx() ctx: Context) {
    const success = await this.subscriptionService.unsubscribe(
      new ObjectId(ctx?.id),
    );
    // Logic to unsubscribe from a subscription
    return {
      success: Boolean(success),
    };
  }

  @ShopOnly()
  @Query(() => OutputType(UserSubscription), {
    name: 'findUserSubscription',
  })
  async findUserSubscription(@Ctx() ctx: Context) {
    // Logic to find a user subscription
    const response = await this.subscriptionService.findUserSubscriptions(
      new ObjectId(ctx?.id),
    );
    return response;
  }
}
