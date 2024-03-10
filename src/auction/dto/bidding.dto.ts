import { InputType } from '@nestjs/graphql';
import { CreateInputType } from 'dryerjs';
import { AuctionBiddingHistory } from '../auction.definition';

@InputType()
export class BiddingDTO extends CreateInputType(AuctionBiddingHistory) {}
