import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Product } from './product.definition';
import { CreateProductInput } from './dto/create-product.input';
import { OutputType } from 'dryerjs';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import * as stream from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Resolver()
export class ProductResolver {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  @Mutation(() => String, { name: 'createProductTest' })
  async create(@Args('input') input: CreateProductInput) {
    try {
      const fileUpload = await input.file[0];
      const { createReadStream } = fileUpload;

      const bucket = this.firebase.storage.bucket('orchid-fer.appspot.com');

      const fileName = uuidv4() + '.webp';
      const file = bucket.file(fileName);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'image/webp',
        },
      });

      const fileBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        createReadStream()
          .on('data', (chunk) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => resolve(Buffer.concat(chunks)));
      });

      const convertedImageBuffer = await sharp(fileBuffer)
        .toFormat('webp')
        .toBuffer();

      return new Promise((resolve, reject) => {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(convertedImageBuffer);
        bufferStream
          .pipe(writeStream)
          .on('error', (error) => {
            console.error('Error uploading file:', error);
            reject('Error uploading file');
          })
          .on('finish', async () => {
            console.log('File uploaded successfully');

            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491',
            });

            console.log('File URL:', url);
            resolve(url);
          });
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return 'Error uploading file';
    }
  }
}
