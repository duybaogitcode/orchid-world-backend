import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import {
  CreateInputType,
  Definition,
  GraphQLObjectId,
  ObjectId,
  OutputType,
  Property,
  ReferencesMany,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Cart } from 'src/cart/definition/cart.definition';
import { User } from 'src/user/user.definition';
import { Wallet } from 'src/wallet/wallet.definition';

@Definition({
  timestamps: true,
})
export class Permission extends BaseModel() {
  @Property({ type: () => String, db: { unique: true } })
  pattern: string;
}

@Definition({
  timestamps: true,
})
export class Role extends BaseModel() {
  @Property({
    db: {
      unique: true,
    },
  })
  name: string;

  @Property({
    type: () => [GraphQLObjectId],
    nullable: true,
    db: { type: [ObjectId], default: [] },
  })
  permissionIds: ObjectId[];

  @ReferencesMany(() => Permission, {
    from: 'permissionIds',
    allowCreateWithin: true,
  })
  permissions: Permission[];
}
@Definition({
  timestamps: true,
})
export class Session extends BaseModel() {
  @Property({ type: () => GraphQLObjectId, db: { unique: true } })
  userId: ObjectId;

  @Property({ type: () => String, db: { unique: true } })
  refreshToken: string;

  @Property({ type: () => String, db: { unique: true } })
  accessToken: string;

  blacklist: string[];
}

@ObjectType()
export class AccessTokenResponse {
  @Field()
  accessToken: string;
}

const user = OutputType(User);
const cart = OutputType(Cart);
const wallet = OutputType(Wallet);

@Definition()
export class UserProfileWithCartAndWallet {
  @Property({ type: () => user })
  profile: User;

  @Property({ type: () => cart })
  cart: Cart;

  @Property({ type: () => wallet })
  wallet: Wallet;
}
