import { Injectable } from '@nestjs/common';
import {
  AfterCreateHook,
  AfterCreateHookInput,
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Product } from './product.definition';
import { Context } from 'src/auth/ctx';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { FileUpload } from 'graphql-upload-ts';
@Injectable()
export class ProductHook {
  constructor(
    @InjectBaseService(Product)
    public userService: BaseService<Product, Context>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @BeforeCreateHook(() => Product)
  async upLoadFileToFirebase({
    input,
  }: BeforeCreateHookInput<Product, Context>) {
    console.log('input', input);
    const files = input.file;

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
    console.log('media', media);
    input.media = media;
  }

  // @AfterCreateHook(() => User)
  // async createTest({ input, created }: AfterCreateHookInput<User, Context>) {
  //   console.log('toi dang test after hook');

  //   // const session = await this.testService.model.startSession();
  //   // session.startTransaction();
  //   // try {
  //   //   await this.testService.model.create(
  //   //     [{ email: input.email, name: input.name }],
  //   //     {
  //   //       session,
  //   //     },
  //   //   );

  //   //   await session.commitTransaction();
  //   // } catch (error) {
  //   //   await session.abortTransaction();
  //   //   throw error;
  //   // } finally {
  //   //   session.endSession();
  //   // }
  // }
}
