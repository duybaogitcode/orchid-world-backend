import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { Product } from './product.definition';
import { ObjectId, OutputType } from 'dryerjs';

import { CreateProductInput } from './dto/create-product.input';
import { ProductService } from './product.service';
import { UpdateProductInput } from './dto/update-product.input';
import { UseGuards } from '@nestjs/common';

import { User } from 'src/user/user.definition';
import { Context, Ctx } from 'src/auth/ctx';
import { ShopOnly } from 'src/guard/roles.guard';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => OutputType(Product), { name: 'product' })
  async findOne(@Args('slug') slug: string) {
    try {
      const product = await this.productService.findOne(slug);
      return product;
    } catch (error) {
      console.error('Failed find product:', error);
      throw error;
    }
  }

  @Query(() => [OutputType(Product)], { name: 'productRelated' })
  async findRelatedProduct(@Args('slug') slug: string) {
    try {
      const products = await this.productService.relatedProducts(slug);
      return products;
    } catch (error) {
      console.error('Failed find related product:', error);
      throw error;
    }
  }

  @ShopOnly()
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

  @ShopOnly()
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

  @ShopOnly()
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
