// import { Injectable } from '@nestjs/common';
// import { User } from './user.schema';
// import {
//   AfterCreateHook,
//   AfterCreateHookInput,
//   BaseService,
//   BeforeCreateHook,
//   BeforeCreateHookInput,
//   InjectBaseService,
//   ObjectId,
// } from 'dryerjs';
// import { Test } from 'src/testSechema/test.schema';
// type Context = { user: { id: ObjectId; role: 'admin' | 'user' } };

// @Injectable()
// export class UserHook {
//   constructor(
//     @InjectBaseService(User) public userService: BaseService<User, Context>,
//     @InjectBaseService(Test) public testService: BaseService<Test, Context>,
//   ) {}

//   @BeforeCreateHook(() => User)
//   async throwErrorIfNameAlreadyExists({
//     input,
//   }: BeforeCreateHookInput<User, Context>) {
//     const existingTag = await this.userService.model.findOne({
//       email: input.email,
//     });

//     console.log('toi dang test hook thoi');
//     if (existingTag) {
//       throw new Error(`Tag with name ${input.name} already exists`);
//     }
//   }

//   @AfterCreateHook(() => User)
//   async createTest({ input, created }: AfterCreateHookInput<User, Context>) {
//     console.log('toi dang test after hook');

//     // const session = await this.testService.model.startSession();
//     // session.startTransaction();
//     // try {
//     //   await this.testService.model.create(
//     //     [{ email: input.email, name: input.name }],
//     //     {
//     //       session,
//     //     },
//     //   );

//     //   await session.commitTransaction();
//     // } catch (error) {
//     //   await session.abortTransaction();
//     //   throw error;
//     // } finally {
//     //   session.endSession();
//     // }
//   }
// }
