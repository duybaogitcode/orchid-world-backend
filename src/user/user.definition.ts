import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  BelongsTo,
  CreateInputType,
  Definition,
  Embedded,
  GraphQLObjectId,
  ObjectId,
  OutputType,
  Property,
} from 'dryerjs';
import { GraphQLObjectType } from 'graphql';
import { skip } from 'node:test';
import { Role } from 'src/auth/auth.definition';
import { BaseModel } from 'src/base/base.definition';

@Definition()
export class address {
  @Property({ type: () => String })
  city: string;

  @Property({ type: () => String })
  district: string;
}

@Definition()
export class ShopOwner {
  @Property({ type: () => String })
  shopName: string;

  @Embedded(() => address)
  pickupAddress: address;

  @Property({ type: () => String })
  emailShop: string;

  @Property({ type: () => String })
  phoneShop: string;
}

@Definition({
  timestamps: true,
})
export class User extends BaseModel() {
  @Property({
    db: {
      unique: true,
      index: true,
    },
    // update: Skip,
  })
  googleId: String;

  @Property()
  firstName: String;

  @Property()
  lastName: String;

  @Property({
    type: () => [String],
    nullable: true,
  })
  address: String[];

  @Property({
    db: {
      unique: true,
      index: true,
    },
  })
  email: String;

  @Property({
    nullable: true,
    db: {
      unique: true,
      index: true,

      default: null,
    },
  })
  phone: String;

  @Property({
    defaultValue: false,
  })
  isPhoneVerified: Boolean;

  @Property({
    nullable: true,
  })
  avatar: String;

  @Property({
    type: () => GraphQLObjectId,
  })
  roleId: ObjectId;

  @BelongsTo(() => Role, {
    from: 'roleId',
  })
  role: Role;

  @Embedded(() => ShopOwner)
  shopOwner: ShopOwner;
}
