import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { SystemTransaction } from './system.transaction.definition';
import { registerEnumType } from '@nestjs/graphql';

export enum SystemWalletID {
  SYSTEM_WALLET_ID = '65e94b9bd064ee85710ece2e',
}

registerEnumType(SystemWalletID, {
  name: 'SystemWalletID',
});

@Definition({
  timestamps: true,
})
export class SystemWallet extends BaseModel() {
  @Property({ type: () => Number })
  balance: number;

  @Property({ type: () => String })
  currency: string;

  @HasMany(() => SystemTransaction, {
    to: 'systemWalletId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  systemTransaction: SystemTransaction[];
}
