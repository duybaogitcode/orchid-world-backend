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
  Skip,
} from 'dryerjs';
import { GraphQLObjectType } from 'graphql';
import { skip } from 'node:test';
import { Role } from 'src/auth/auth.definition';
import { BaseModel } from 'src/base/base.definition';

@Definition()
export class address {
  @Property({ type: () => String, nullable: true })
  city: string;

  @Property({ type: () => String, nullable: true })
  district: string;

  @Property({ type: () => String, nullable: true })
  ward: string;

  @Property({ type: () => String, nullable: true })
  detail: string;
}

@Definition()
export class AddressWithDefaultPriority extends address {
  @Property({ type: () => Boolean, nullable: true })
  isDefault: boolean;
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

  @Embedded(() => AddressWithDefaultPriority)
  address: AddressWithDefaultPriority[];

  @Property({
    db: {
      unique: true,
      index: true,
    },
    update: Skip,
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
    update: Skip,
  })
  roleId: ObjectId;

  @BelongsTo(() => Role, {
    from: 'roleId',
  })
  role: Role;

  @Embedded(() => ShopOwner)
  shopOwner: ShopOwner;
}
