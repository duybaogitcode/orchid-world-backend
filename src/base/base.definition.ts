import { GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import { Id, ObjectId, Property, Skip } from 'dryerjs';
export enum BaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
}

registerEnumType(BaseStatus, {
  name: 'Status',
});

export enum SimpleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

registerEnumType(SimpleStatus, {
  name: 'SimpleStatus',
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
