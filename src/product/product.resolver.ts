import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { Product } from './product.definition';
import {
  FilterOperator,
  FilterType,
  ObjectId,
  OutputType,
  PaginatedOutputType,
  SortType,
} from 'dryerjs';

import { CreateProductInput } from './dto/create-product.input';
import { ProductService } from './product.service';
import { UpdateProductInput } from './dto/update-product.input';
import { UseGuards } from '@nestjs/common';

import { User } from 'src/user/user.definition';
import { Context, Ctx } from 'src/auth/ctx';
import { ManagerOrStaff, ShopOnly, UserOnly } from 'src/guard/roles.guard';
import { PaginationParameters } from 'dryerjs/dist/js/mongoose-paginate-v2';
import { PaginateShopProductDTO } from './dto/paginate-shop-product.dto';
import { Categories } from 'src/orthersDef/categories.definition';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => OutputType(Product), { name: 'product' })
  async findOneBySlug(@Args('slug') slug: string) {
    try {
      const product = await this.productService.findOneBySlug(slug);
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

  @Query(() => OutputType(Categories), { name: 'findOneCategoryBySlug' })
  async findOneCategoryBySlug(@Args('slug') slug: string) {
    try {
      const categoryAndProduct =
        await this.productService.findOneCategoryBySlug(slug);
      return categoryAndProduct;
    } catch (error) {
      console.error('Failed find related product:', error);
      throw error;
    }
  }

  @ManagerOrStaff()
  @Query(() => PaginatedOutputType(Product), {
    name: 'paginateStaffManagerProducts',
  })
  async paginateStaffManagerProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('filter', { type: () => FilterType(Product), nullable: true })
    filter: ReturnType<typeof FilterType>,
    @Args('sort', { type: () => SortType(Product), nullable: true })
    sort: ReturnType<typeof SortType>,
    @Ctx() ctx: Context,
  ) {
    try {
      const products = await this.productService.pagingProducts(
        page,
        limit,
        filter,
        sort,
        ctx,
      );
      return products;
    } catch (error) {
      console.error('Failed find pending product:', error);
      throw error;
    }
  }

  @ShopOnly()
  @Query(() => PaginatedOutputType(Product), { name: 'paginateShopProducts' })
  async paginateShopProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('filter', { type: () => FilterType(Product), nullable: true })
    filter: ReturnType<typeof FilterType>,
    @Args('sort', { type: () => SortType(Product), nullable: true })
    sort: ReturnType<typeof SortType>,
    @Ctx() ctx: Context,
  ) {
    try {
      const products = await this.productService.getShopProducts({
        uid: ctx?.id,
        limit: limit,
        page: page,
        sort: sort,
        filter: filter,
        ctx,
      });
      return products;
    } catch (error) {
      console.error('Failed find product:', error);
      throw error;
    }
  }

  @ShopOnly()
  @Mutation(() => OutputType(Product), { name: 'createProduct' })
  async create(@Args('input') input: CreateProductInput, @Ctx() ctx: Context) {
    try {
      const newProduct = await this.productService.create(input, ctx.id);
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
