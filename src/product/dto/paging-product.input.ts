import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
});

@InputType()
export class ProductNameFilter {
  @Field({ nullable: true })
  contains?: string;
}

@InputType()
export class ProductSort {
  @Field((type) => SortDirection, { nullable: true })
  createdAt?: SortDirection;

  @Field((type) => SortDirection, { nullable: true })
  updatedAt?: SortDirection;

  @Field((type) => SortDirection, { nullable: true })
  price?: SortDirection;
}

@InputType()
export class ProductFilter {
  @Field((type) => ProductNameFilter, { nullable: true })
  name?: ProductNameFilter;

  @Field({ nullable: true })
  search?: string;
}
