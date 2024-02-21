import { Float } from '@nestjs/graphql';
import { Definition, Property } from 'dryerjs';
import { BaseModel, SimpleStatus } from 'src/base/base.definition';
import { BaseModelHasOwner } from 'src/product/product.definition';

function generateWalletAddress() {
  return '0x' + Math.random().toString(36).slice(2, 10);
}

@Definition()
export class Wallet extends BaseModelHasOwner({
  unique: true,
}) {
  @Property({
    type: () => String,
    db: {
      default: generateWalletAddress(),
      unique: true,
    },
  })
  walletAddress: string;

  @Property({
    type: () => Float,
    db: {
      default: 0,
    },
  })
  balance: number;

  @Property({
    type: () => Float,
    db: {
      default: 0,
    },
  })
  lockFunds: number;

  @Property({
    type: () => SimpleStatus,
    db: { default: SimpleStatus.ACTIVE },
  })
  status: SimpleStatus;
}
