import { Args, Field, InputType, Mutation, Resolver } from '@nestjs/graphql';
import { SubscribeToSubscriptionDTO } from './dto/subscribe.dto';
import { SubscriptionService } from './subscription.service';
import { Context, Ctx } from 'src/auth/ctx';
import { UserSubscription } from './subscription.definition';
import { OutputType } from 'dryerjs';

@Resolver()
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Mutation(() => OutputType(UserSubscription), {
    name: 'subscribeAuctionSubscription',
  })
  async subscribe(
    @Args('input') input: SubscribeToSubscriptionDTO,
    @Ctx() ctx: Context,
  ) {
    // Logic to subscribe to a subscription
    return this.subscriptionService.subscribe(ctx?.id, input);
  }
}
