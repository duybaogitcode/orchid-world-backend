import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { SortType } from 'dryerjs';
import { Product } from '../product.definition';

@InputType()
export class PaginateShopProductDTO {
  @Field(() => SortType(Product), {
    nullable: true,
  })
  sort: object;
  @Field(() => Int, {
    nullable: true,
  })
  page: number;

  @Field(() => Int, {
    nullable: true,
  })
  limit: number;
}
