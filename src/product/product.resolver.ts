import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Product } from './product.definition';
import { CreateProductInput } from './dto/create-product.input';
import { OutputType } from 'dryerjs';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import * as fs from 'fs';
import * as path from 'path';
@Resolver()
export class ProductResolver {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  @Mutation(() => String, { name: 'createProductTest' })
  async create(@Args('input') input: CreateProductInput) {
    try {
      // Define the absolute path to the file
      const filePath = path.resolve(
        __dirname,
        '..',
        '..',
        'src',
        'firebase',
        'test.txt',
      );

      // Read the file from the local file system
      const fileBuffer = fs.readFileSync(filePath);

      // Get the specific bucket and create a new blob in the bucket and upload the file data
      const bucket = this.firebase.storage.bucket('orchid-fer.appspot.com');
      const fileName = path.basename(filePath);
      const file = bucket.file(fileName);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'text/plain',
        },
      });

      writeStream.on('error', (err) => {
        console.error('Firebase Storage error:', err);
      });

      writeStream.on('finish', () => {
        console.log('File uploaded successfully');
      });

      writeStream.end(fileBuffer);

      return 'File uploaded successfully';
    } catch (error) {
      console.error('Error uploading file:', error);
      return 'Error uploading file';
    }
  }
}
