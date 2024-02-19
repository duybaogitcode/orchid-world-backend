import { InputType, OmitType } from '@nestjs/graphql';
import { Product } from '../product.definition';
import { UpdateInputType } from 'dryerjs';

const ProductInput = UpdateInputType(Product);

@InputType()
export class UpdateProductInput extends OmitType(ProductInput, [
  'media',
  'authorId',
  'slug',
  'file',
  'tags',
] as const) {}
