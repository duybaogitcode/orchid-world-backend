import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductInput } from './dto/create-product.input';
import { Product } from './product.definition';
import { Context } from 'src/auth/ctx';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { FileUpload } from 'graphql-upload-ts';
import { TagWithValues } from 'src/orthersDef/tagValues.definition';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(
    @InjectBaseService(Product)
    public productService: BaseService<Product, Context>,
    @InjectBaseService(TagWithValues)
    public tagWithValues: BaseService<TagWithValues, Context>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(createProductDto: CreateProductInput) {
    const session = await this.productService.model.startSession();
    session.startTransaction();

    try {
      const files = createProductDto.file;

      const uploadPromises = files.map(
        async (filePromise: Promise<FileUpload>) => {
          const file = await filePromise;
          return this.firebaseService.uploadFile(file, 'product');
        },
      );

      const urls = await Promise.all(uploadPromises);
      const media: string[] = await Promise.all(
        urls.map((url) => Promise.resolve(url)),
      );

      const product = new this.productService.model({
        authorId: '111230125052579288677',
        category_id: createProductDto.category_id,
        description: createProductDto.description,
        media: media,
        name: createProductDto.name,
        price: createProductDto.price,
        slug: `${slugify(createProductDto.name, { lower: true, strict: true })}-${Math.random().toString(36)}`,
        status: 'PENDING',
        tags: createProductDto.tags,
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
      await session.abortTransaction();
      session.endSession();
      throw error; // Re-throw the error after rolling back the transaction
    }
  }

  // findAll() {
  //   return `This action returns all dbao`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} dbao`;
  // }

  // update(id: number, updateDbaoInput: UpdateDbaoInput) {
  //   return `This action updates a #${id} dbao`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} dbao`;
  // }
}
