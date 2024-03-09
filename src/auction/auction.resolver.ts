import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auction } from './auction.definition';
import { AuctionService } from './auction.service';
import { OutputType } from 'dryerjs';
import { FindBySlugDto } from './dto/find-by-slug-dto';
import { SuccessResponse } from 'dryerjs/dist/types';
import { Context, Ctx } from 'src/auth/ctx';
import { AuctionRegisterDTO } from './dto/register.dto';
import { ShopOrUserOnly, UserOnly } from 'src/guard/roles.guard';

@Resolver()
export class AuctionResolver {
  constructor(private readonly auctionService: AuctionService) {}

  @Query(() => OutputType(Auction), { name: 'auctionByProductSlug' })
  async findOneByProductSlug(@Args('input') { productSlug }: FindBySlugDto) {
    return this.auctionService.findOneByProductSlug(productSlug);
  }

  @UserOnly()
  @Mutation(() => SuccessResponse, { name: 'registerAuction' })
  async registerAuction(
    @Args('input') input: AuctionRegisterDTO,
    @Ctx() ctx: Context,
  ) {
    console.log({ ctx, input });
    const res = await this.auctionService.registerAuction(
      input.auctionId,
      ctx?.id,
    );
    return {
      success: Boolean(res),
    };
  }

  @UserOnly()
  @Mutation(() => SuccessResponse, { name: 'unregisterAuction' })
  async unregisterAuction(
    @Args('input') input: AuctionRegisterDTO,
    @Ctx() ctx: Context,
  ) {
    console.log({ ctx });
    return this.auctionService.unregisterAuction(input.auctionId, ctx?.id);
  }
}
