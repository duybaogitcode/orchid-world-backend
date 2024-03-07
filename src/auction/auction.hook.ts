import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AfterFindManyHook,
  AfterFindManyHookInput,
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  BeforeFindManyHook,
  BeforeFindManyHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Auction, AuctionStatus } from './auction.definition';
import { Context } from 'src/auth/ctx';
@Injectable()
export class AuctionHook {
  constructor(
    @InjectBaseService(Auction)
    public productService: BaseService<Auction>,
  ) {}

  @BeforeCreateHook(() => Auction)
  async beforeCreateAuction({
    input,
    ctx,
  }: BeforeCreateHookInput<Auction, Context>) {
    if (ctx === null) {
      throw new UnauthorizedException();
    }

    const existAuction = await this.productService.findOneNullable(
      {},
      {
        productId: input.productId,
        status: {
          $in: [
            AuctionStatus.APPROVED,
            AuctionStatus.COMPLETED,
            AuctionStatus.RUNNING,
          ],
        },
      },
    );

    if (existAuction) {
      throw new Error('Product has been auctioned');
    }

    input.authorId = new ObjectId(ctx.id);
    input.currentPrice = input?.initialPrice || 0;
  }

  @AfterFindManyHook(() => Auction)
  afterFindManyAuction({ items }: AfterFindManyHookInput<Auction, Context>) {
    return items.filter((i) => i?.product && i?.productId);
  }
}
