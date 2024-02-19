import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Product } from './product.definition';
import { OutputType } from 'dryerjs';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import * as stream from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
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
      console.error('Failed create new product:', error);
      throw error;
    }
  }
}
