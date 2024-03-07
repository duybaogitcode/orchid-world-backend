import { Args, Field, InputType, Mutation, Resolver } from '@nestjs/graphql';
import { SubscribeToSubscriptionDTO } from './dto/subscribe.dto';
import { SubscriptionService } from './subscription.service';
import { Context, Ctx } from 'src/auth/ctx';
import { UserSubscription } from './subscription.definition';
import { ObjectId, OutputType } from 'dryerjs';
import { ShopOnly } from 'src/guard/roles.guard';

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
}
