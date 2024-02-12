import { GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  Id,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
export enum BaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
}

registerEnumType(BaseStatus, {
  name: 'Status',
});

export const BaseModel = () => {
  class BaseModelAsClass {
    @Id()
    id: ObjectId;

    @Property({
      output: { type: () => GraphQLISODateTime },
      create: Skip,
      update: Skip,
    })
    createdAt: Date;

    @Property({
      output: { type: () => GraphQLISODateTime },
      create: Skip,
      update: Skip,
    })
    updatedAt: Date;
  }
  return BaseModelAsClass;
};
