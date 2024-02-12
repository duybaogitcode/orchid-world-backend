import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext, registerEnumType } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'dryerjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(executionContext).getContext();

    const ctx = await this.jwtService
      .verifyAsync(req.header('Authorization')?.split(' ')?.[1])
      .catch(() => null);

    if (ctx?.id) {
      ctx.id = new ObjectId(ctx.id);
    }

    req.ctx = ctx;

    const role = this.reflector.get(RoleEnum, executionContext.getHandler());
    if (!role) return true;

    switch (role) {
      case UserRole.ADMIN:
        if (ctx?.role !== UserRole.ADMIN) {
          throw new UnauthorizedException('AdminOnly');
        }
        break;
      case UserRole.USER:
        if (![UserRole.ADMIN, UserRole.USER].includes(ctx?.role)) {
          throw new UnauthorizedException('UserOnly');
        }
        break;
      case UserRole.STAFF:
        if (![UserRole.ADMIN, UserRole.STAFF].includes(ctx?.role)) {
          throw new UnauthorizedException('StaffOnly');
        }
        break;
      case UserRole.SHOP_OWNER:
        if (![UserRole.ADMIN, UserRole.SHOP_OWNER].includes(ctx?.role)) {
          throw new UnauthorizedException('ShopOwnerOnly');
        }
        break;
      case UserRole.MANAGER:
        if (![UserRole.ADMIN, UserRole.MANAGER].includes(ctx?.role)) {
          throw new UnauthorizedException('ManagerOnly');
        }
        break;
    }

    return true;
  }
}

export const UserOnly = () => {
  return applyDecorators(RoleEnum(UserRole.USER), UseGuards(RoleGuard));
};

export const AdminOnly = () => {
  return applyDecorators(RoleEnum(UserRole.ADMIN), UseGuards(RoleGuard));
};

export const StaffOnly = () => {
  return applyDecorators(RoleEnum(UserRole.STAFF), UseGuards(RoleGuard));
};

export const ManagerOnly = () => {
  return applyDecorators(RoleEnum(UserRole.MANAGER), UseGuards(RoleGuard));
};

export const Show_OwnerOnly = () => {
  return applyDecorators(RoleEnum(UserRole.SHOP_OWNER), UseGuards(RoleGuard));
};

export const PublicAccessWithRole = () => applyDecorators(UseGuards(RoleGuard));

enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  SHOP_OWNER = 'SHOP_OWNER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

registerEnumType(UserRole, { name: 'UserRole' });

export const RoleEnum = Reflector.createDecorator<UserRole>();
