import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Product } from './product.definition';
import { ObjectId, OutputType } from 'dryerjs';

import { CreateProductInput } from './dto/create-product.input';
import { ProductService } from './product.service';
import { UpdateProductInput } from './dto/update-product.input';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => OutputType(Product), { name: 'createProduct' })
  async create(@Args('input') input: CreateProductInput) {
    try {
      const newProduct = await this.productService.create(input);

      return newProduct;
    } catch (error) {
      console.error('Failed create new product:', error);
      throw error;
    }
  }

  @Mutation(() => OutputType(Product), { name: 'updateProduct' })
  async update(@Args('input') input: UpdateProductInput) {
    try {
      const updatedProduct = await this.productService.update(input);

      return updatedProduct;
    } catch (error) {
      console.error('Failed update product:', error);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'removeProduct' })
  async remove(@Args('id') id: string) {
    try {
      const isRemoved = await this.productService.remove(new ObjectId(id));

      return isRemoved;
    } catch (error) {
      console.error('Failed create new product:', error);
      throw error;
    }
  }
}
