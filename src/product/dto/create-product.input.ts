import { InputType, OmitType } from '@nestjs/graphql';
import { Product } from '../product.definition';
import { CreateInputType } from 'dryerjs';

const ProductInput = CreateInputType(Product);

@InputType()
export class CreateProductInput extends OmitType(ProductInput, [
  'media',
  'authorId',
  'slug',
] as const) {}
