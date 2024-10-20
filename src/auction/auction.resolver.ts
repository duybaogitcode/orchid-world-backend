import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auction } from './auction.definition';
import { AuctionService } from './auction.service';
import { ObjectId, OutputType } from 'dryerjs';
import { FindBySlugDto } from './dto/find-by-slug-dto';
import { SuccessResponse } from 'dryerjs/dist/types';
import { Context, Ctx } from 'src/auth/ctx';
import { AuctionInputStop, AuctionRegisterDTO } from './dto/register.dto';
import {
  ManagerOnly,
  ManagerOrStaff,
  ShopOnly,
  ShopOrUserOnly,
  UserOnly,
} from 'src/guard/roles.guard';

@Resolver()
export class AuctionResolver {
  constructor(private readonly auctionService: AuctionService) {}

  @Query(() => OutputType(Auction), { name: 'auctionByProductSlug' })
  async findOneByProductSlug(@Args('input') { productSlug }: FindBySlugDto) {
    return this.auctionService.findOneByProductSlug(productSlug);
  }

  @ShopOrUserOnly()
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

  @ShopOrUserOnly()
  @Mutation(() => SuccessResponse, { name: 'unregisterAuction' })
  async unregisterAuction(
    @Args('input') input: AuctionRegisterDTO,
    @Ctx() ctx: Context,
  ) {
    return {
      success: Boolean(
        this.auctionService.unregisterAuction(input.auctionId, ctx?.id),
      ),
    };
  }

  // @ShopOnly()
  @Mutation(() => SuccessResponse, { name: 'startAuction' })
  async startAuction(@Args('input') input: AuctionRegisterDTO) {
    return {
      success: Boolean(this.auctionService.startAuction(input.auctionId)),
    };
  }

  // @ShopOnly()
  // TODO: validate owner only

  @ManagerOnly()
  @Mutation(() => SuccessResponse, { name: 'approveAuction' })
  async approveAuction(
    @Args('input') input: AuctionRegisterDTO,
    @Ctx() ctx: Context,
  ) {
    try {
      const response = await this.auctionService.approveAuction(
        input.auctionId,
        ctx,
      );
      return {
        success: Boolean(response),
      };
    } catch (error) {
      console.log({ error });
      return {
        success: false,
      };
    }
  }

  @ManagerOrStaff()
  @Mutation(() => SuccessResponse, { name: 'staffStopAuction' })
  async staffStopAuction(@Args('input') input: AuctionInputStop) {
    try {
      const response = await this.auctionService.stopAuction(
        input.auctionId,
        input.stopReason,
      );
      return {
        success: Boolean(response),
      };
    } catch (error) {
      console.log({ error });
      return {
        success: false,
      };
    }
  }
}
