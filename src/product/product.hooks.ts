import { Injectable } from '@nestjs/common';
import {
  AfterCreateHook,
  AfterCreateHookInput,
  AfterFindManyHook,
  AfterFindManyHookInput,
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  BeforeFindManyHook,
  BeforeFindManyHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Product, ProductStatus } from './product.definition';
import { Context } from 'src/auth/ctx';
import { UserRole } from 'src/guard/roles.guard';

@Injectable()
export class ProductHook {
  constructor(
    @InjectBaseService(Product)
    public productService: BaseService<Product>,
  ) {}

  @BeforeFindManyHook(() => Product)
  async beforeFindManyProduct({
    filter,
    ctx,
  }: BeforeFindManyHookInput<Product, Context>) {
    if (ctx === null) {
      ctx = {
        id: new ObjectId(),
        roleId: new ObjectId(UserRole.USER),
      };
    }
    switch (ctx.roleId.toString()) {
      case UserRole.ADMIN:
        break;
      case UserRole.SHOP_OWNER:
        break;
      case UserRole.MANAGER:
        break;
      case UserRole.STAFF:
        break;
      case UserRole.USER:
        filter.status = ProductStatus.APPROVED;
        break;
      default:
        filter.status = ProductStatus.APPROVED;
        break;
    }
  }

  // @AfterFindManyHook(() => Product)
  // async afterFindManyProduct({
  //   items,
  // }: AfterFindManyHookInput<Product, Context>) {
  //   for (let i = items.length - 1; i >= 0; i--) {
  //     if (items[i].status !== ProductStatus.APPROVED) {
  //       items.splice(i, 1);
  //     }
  //   }
  //   return items;
  // }

  // @BeforeCreateHook(() => Product)
  // async upLoadFileToFirebase({
  //   input,
  // }: BeforeCreateHookInput<Product, Context>) {
  //   console.log('input', input);
  //   const files = input.file;

  //   const uploadPromises = files.map(
  //     async (filePromise: Promise<FileUpload>) => {
  //       const file = await filePromise;
  //       return this.firebaseService.uploadFile(file, 'product');
  //     },
  //   );

  //   const urls = await Promise.all(uploadPromises);
  //   const media: string[] = await Promise.all(
  //     urls.map((url) => Promise.resolve(url)),
  //   );
  //   console.log('media', media);
  //   input.media = media;
  // }

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
