import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  BaseService,
  FilterOperator,
  Filterable,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductInput } from './dto/create-product.input';
import { Product, ProductStatus } from './product.definition';
import { FileUpload } from 'graphql-upload-ts';
import slugify from 'slugify';
import { Context, Ctx } from 'src/auth/ctx';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { TagWithValues } from 'src/orthersDef/tagValues.definition';
import { UpdateProductInput } from './dto/update-product.input';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from 'src/user/user.definition';
import { stat } from 'node:fs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductEventEnum } from './event/product.event';
import { Categories } from 'src/orthersDef/categories.definition';
import { filter } from 'rxjs';
import { MongoQuery } from 'src/utils/mongoquery';
import { Auction, AuctionStatus } from 'src/auction/auction.definition';

@Injectable()
export class ProductService {
  constructor(
    @InjectBaseService(Product)
    public productService: BaseService<Product, Context>,
    @InjectBaseService(TagWithValues)
    public tagWithValues: BaseService<TagWithValues, Context>,
    private readonly firebaseService: FirebaseService,
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
    @InjectBaseService(Auction)
    public auctionService: BaseService<Auction, Context>,
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Categories)
    public categories: BaseService<Categories, Context>,
    private mongoQuery: MongoQuery,
  ) {}

  async create(createProductDto: CreateProductInput, uid: ObjectId) {
    const session = await this.productService.model.startSession();
    session.startTransaction();
    let media: string[] = [];
    try {
      const files = createProductDto.file;

      const uploadPromises = files.map(
        async (filePromise: Promise<FileUpload>) => {
          const file = await filePromise;
          return this.firebaseService.uploadFile(file, 'product');
        },
      );

      const urls = await Promise.all(uploadPromises);
      media = await Promise.all(urls.map((url) => Promise.resolve(url)));

      const product = new this.productService.model({
        authorId: new ObjectId(uid),
        category_id: createProductDto.category_id,
        description: createProductDto.description,
        media: media,
        name: createProductDto.name,
        price: createProductDto.isAuction ? 0 : createProductDto.price,
        slug: `${slugify(createProductDto.name, { lower: true, strict: true })}-${Math.random().toString(36)}`,
        status: 'APPROVED',
        tags: createProductDto.tags,
        isAuction: createProductDto.isAuction,
        quantity: createProductDto.quantity,
      });

      await product.save({ session });

      const tagValues = createProductDto.tags.map((tag) => ({
        ...tag,
        product_id: product._id,
      }));

      await this.tagWithValues.model.insertMany(tagValues, { session });

      await session.commitTransaction();
      session.endSession();

      return product;
    } catch (error) {
      await Promise.all(
        media.map((filePath) => this.firebaseService.deleteFile(filePath)),
      );
      await session.abortTransaction();
      session.endSession();
      throw error; // Re-throw the error after rolling back the transaction
    }
  }

  async update(updateProductDto: UpdateProductInput, ctx: Context) {
    console.log('updateProductDto', updateProductDto);
    const session = await this.productService.model.startSession();
    session.startTransaction();
    let uploadFile: string[] = [];
    let media: string[] = [];
    let urlsToKeep: string[] = [];
    try {
      const product = await this.productService.model
        .findById(updateProductDto.id)
        .session(session);

      if (!product) {
        throw new Error('Product not found');
      }

      if (ctx.id.toString() !== product.authorId.toString()) {
        throw new Error('You are not the owner of this product');
      }

      const {
        name,
        description,
        price,
        quantity,
        tagsUpdate,
        deleteUrl,
        status,
      } = updateProductDto;

      const oldMedia = product.media;

      if (deleteUrl && deleteUrl.length > 0) {
        urlsToKeep = oldMedia.filter((url) => !deleteUrl.includes(url));
      } else {
        urlsToKeep = oldMedia;
      }

      const files = updateProductDto.fileUpdate;

      if (files && files.length > 0) {
        const uploadPromises = files.map(
          async (filePromise: Promise<FileUpload>) => {
            const file = await filePromise;
            return this.firebaseService.uploadFile(file, 'product');
          },
        );

        const urls = await Promise.all(uploadPromises);
        uploadFile = await Promise.all(urls.map((url) => Promise.resolve(url)));
      }

      media = [...urlsToKeep, ...uploadFile];

      if (media.length === 0) {
        throw new Error('Product must have at least one image');
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.quantity = quantity || product.quantity;
      product.media = media;
      product.status = status || product.status;
      product.createdAt = product.createdAt;
      product.updatedAt = new Date();

      await product.save({ session });

      if (tagsUpdate && tagsUpdate.length > 0) {
        await this.tagWithValues.model.deleteMany(
          { product_id: product._id },
          { session },
        );

        const tagValues = tagsUpdate.map((tag) => ({
          ...tag,
          product_id: product._id,
        }));

        await this.tagWithValues.model.insertMany(tagValues, { session });
      }

      if (deleteUrl && deleteUrl.length > 0) {
        this.eventEmitter.emit(ProductEventEnum.DELETEURL, {
          input: deleteUrl,
        });
      }
      this.eventEmitter.emit(ProductEventEnum.PRODUCTUPDATE, {
        productSlug: product.slug,
      });

      await session.commitTransaction();
      session.endSession();

      return product;
    } catch (error) {
      if (uploadFile.length > 0) {
        await Promise.all(
          uploadFile.map((filePath) =>
            this.firebaseService.deleteFile(filePath),
          ),
        );
      }
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // findAll() {
  //   return `This action returns all dbao`;
  // }

  async findOneBySlug(slug: string) {
    try {
      const product = await this.productService.model.findOne({ slug: slug });
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: ObjectId, authorId?: ObjectId): Promise<boolean> {
    try {
      const product = await this.productService.model.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      if (authorId && authorId.toString() !== product.authorId.toString()) {
        throw new Error('You are not the owner of this product');
      }

      product.status = ProductStatus.REMOVED;

      if (product.isAuction === true) {
        const auction = await this.auctionService.model.findOne({
          productId: product._id,
        });
        if (
          auction.status === AuctionStatus.COMPLETED ||
          auction.status === AuctionStatus.RUNNING
        ) {
          throw new Error('Không thể xóa sản phẩm đang tham gia đấu giá');
        }
      }

      await product.save();
      this.eventEmitter.emit(ProductEventEnum.PRODUCTUPDATE, {
        productSlug: product.slug,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async relatedProducts(slug: string) {
    try {
      const product = await this.productService.model.findOne({
        slug: slug,
      });
      if (!product) {
        throw new Error('Product not found');
      }

      const allProducts = await this.productService.model.find({
        _id: { $ne: product._id },
        status: ProductStatus.APPROVED,
      });

      const scoredProducts = allProducts.map((otherProduct) => {
        let score = 0;

        if (otherProduct.category_id.equals(product.category_id)) {
          score += 10;
        }

        if (otherProduct.authorId.equals(product.authorId)) {
          score += 5;
        }

        // const matchingTags = otherProduct.tags.filter((tag) =>
        //   product.tags.includes(tag),
        // );
        // score += matchingTags.length;

        if (
          Math.abs(otherProduct.price - product.price) / product.price <=
          0.1
        ) {
          score += 5;
        }

        return { product: otherProduct, score };
      });

      const relatedProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 7);

      return relatedProducts.map(({ product }) => product);
    } catch (error) {
      throw error;
    }
  }

  async getShopProducts({
    uid,
    sort = {},
    page = 1,
    limit = 10,
    ctx,
    filter,
  }: {
    uid: ObjectId;
    sort?: object;
    page?: number;
    limit?: number;
    filter?: any;
    ctx: Context;
  }) {
    const user = await this.userService.findOne(null, {
      _id: new ObjectId(uid),
    });

    if (!user.shopOwner || !user?.shopOwner?.shopName) {
      throw new BadRequestException('Vui lòng đăng ký bán hàng trước.');
    }

    console.log('filter', filter);

    const mongoQuery = this.mongoQuery.convertFilterToMongoQuery(filter);
    console.log('🚀 ~ ProductService ~ mongoQuery:', mongoQuery);
    const updateFilter = {
      ...mongoQuery,
      authorId: new ObjectId(uid),
    };

    return this.productService.paginate(ctx, updateFilter, sort, page, limit);
  }

  async pagingProducts(
    page: number,
    limit: number,
    filter: any,
    sort: any,
    ctx: Context,
  ) {
    const mongoQuery = this.mongoQuery.convertFilterToMongoQuery(filter);
    return await this.productService.paginate(
      ctx,
      mongoQuery,
      sort,
      page,
      limit,
    );
  }

  async findOneCategoryBySlug(slug: string) {
    try {
      const category = await this.categories.model.findOne({ slug: slug });
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    } catch (error) {
      throw error;
    }
  }

  async approveProduct(slug: string) {
    const product = await this.productService.model.findOne({
      slug: slug,
    });
    if (!product) {
      throw new Error('Product not found');
    }
    product.status = ProductStatus.APPROVED;
    await product.save();
    return product;
  }
}
