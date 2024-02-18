import { InputType } from '@nestjs/graphql';
import { Product } from '../product.definition';
import { CreateInputType } from 'dryerjs';

const ProductInput = CreateInputType(Product);

@InputType()
export class CreateProductInput extends ProductInput {}
