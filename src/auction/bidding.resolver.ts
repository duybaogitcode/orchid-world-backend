import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SuccessResponse } from 'dryerjs/dist/types';
import { BiddingService } from './bidding.service';
import { BiddingDTO } from './dto/bidding.dto';
import { Context, Ctx } from 'src/auth/ctx';
import { ShopOrUserOnly, UserOnly } from 'src/guard/roles.guard';

@Resolver()
export class BiddingResolver {
  constructor(private readonly biddingService: BiddingService) {}

  @ShopOrUserOnly()
  @Mutation(() => SuccessResponse, { name: 'bid' })
  async bid(@Args('input') input: BiddingDTO, @Ctx() ctx: Context) {
    try {
      await this.biddingService.bid(input, ctx.id);
      return {
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }
}
