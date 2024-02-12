import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';

enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
}
registerEnumType(ProductStatus, {
  name: 'ProductStatus',
});

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field()
  price: number;

  @Field({ nullable: true })
  shortDescription: string;

  @Field({ nullable: true })
  longDescription: string;

  @Field(() => [String], { nullable: true })
  tagIds: string[];

  @Field({ nullable: true })
  categoryId: string;

  @Field(() => [GraphQLUpload])
  file: Array<Promise<FileUpload>>;
}
