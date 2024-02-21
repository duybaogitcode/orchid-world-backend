// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   Inject,
//   applyDecorators,
//   UseGuards,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { GqlExecutionContext, registerEnumType } from '@nestjs/graphql';
// import { JwtService } from '@nestjs/jwt';
// import { Cache } from 'cache-manager';
// import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
// import { Context } from 'src/auth/ctx';
// import { User } from 'src/user/user.definition';

// @Injectable()
// export class RoleGuard implements CanActivate {
//   constructor(
//     private readonly jwtService: JwtService,
//     @Inject(CACHE_MANAGER) private cacheManager: Cache,
//     private reflector: Reflector,
//     @InjectBaseService(User)
//     public userService: BaseService<User, Context>,
//   ) {}
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const { req } = GqlExecutionContext.create(context).getContext();

//     const ctx = await this.jwtService
//       .verifyAsync(req.cookies.refreshToken)
//       .catch(() => null);

//     if (!ctx) {
//       return false;
//     }

//     let user: User = await this.cacheManager.get(ctx.sub);
//     if (!user) {
//       user = await this.userService.model.findById(ctx.sub);
//       await this.cacheManager.set(ctx.sub, user);
//     }

//     if (!user) {
//       return false;
//     }

//     req.ctx = user;

//     const role = this.reflector.get(RoleCheck, context.getHandler());

//     if (!role) return true;
//     switch (role) {
//       case UserRole.ADMIN:
//         if (user.roleId.toString() !== UserRole.ADMIN.toString()) {
//           throw new UnauthorizedException('AdminOnly');
//         }
//         break;
//       case UserRole.SHOP_OWNER:
//         if (user.roleId.toString() !== UserRole.SHOP_OWNER) {
//           throw new UnauthorizedException('ShopOwnerOnly');
//         }
//         break;
//       case UserRole.STAFF:
//         if (user.roleId.toString() !== UserRole.STAFF) {
//           throw new UnauthorizedException('StaffOnly');
//         }
//         break;
//       case UserRole.MANAGER:
//         if (user.roleId.toString() !== UserRole.MANAGER) {
//           throw new UnauthorizedException('ManagerOnly');
//         }
//         break;
//       case UserRole.USER:
//         if (user.roleId.toString() !== UserRole.USER) {
//           throw new UnauthorizedException('UserOnly');
//         }
//         break;
//       default:
//         return false;
//     }
//     return true;
//   }

//   // canActivate(context: ExecutionContext): boolean {
//   //   const ctx = GqlExecutionContext.create(context).getContext();
//   //   // Check if user is logged in
//   //   return !!ctx.req.session.userId;
//   // }
// }

// export const UserOnly = () => {
//   return applyDecorators(RoleCheck(UserRole.USER), UseGuards(RoleGuard));
// };

// export const ShopOnly = () => {
//   return applyDecorators(RoleCheck(UserRole.SHOP_OWNER), UseGuards(RoleGuard));
// };

// export const StaffOnly = () => {
//   return applyDecorators(RoleCheck(UserRole.STAFF), UseGuards(RoleGuard));
// };

// export const ManagerOnly = () => {
//   return applyDecorators(RoleCheck(UserRole.MANAGER), UseGuards(RoleGuard));
// };

// export const AdminOnly = () => {
//   return applyDecorators(RoleCheck(UserRole.ADMIN), UseGuards(RoleGuard));
// };

// // export const UserOrShopOnly = () => {
// //   return applyDecorators(
// //     RoleCheck(UserRole.USER, UserRole.SHOP_OWNER),
// //     UseGuards(RoleGuard),
// //   );
// // };

// export enum UserRole {
//   USER = '65d317029abc164abb8a830b',
//   SHOP_OWNER = '65d4ae42f18fa2591d75c6c8',
//   STAFF = '65d594658407311c88986cf1',
//   MANAGER = '65d5946c8407311c88986cf6',
//   ADMIN = '65d594718407311c88986cfb',
// }

// registerEnumType(UserRole, { name: 'UserRole' });

// export const RoleCheck = Reflector.createDecorator<UserRole>();
