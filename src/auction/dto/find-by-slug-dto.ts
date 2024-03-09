import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FindBySlugDto {
  @Field(() => String, { description: 'Product slug' })
  productSlug: string;
}
