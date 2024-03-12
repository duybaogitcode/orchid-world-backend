import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { BaseService, InjectBaseService } from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { User } from 'src/user/user.definition';
import { GqlExecutionContext, registerEnumType } from '@nestjs/graphql';
import { Cache } from 'cache-manager';
import { clear } from 'console';

@Injectable()
export class RoleMultiGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req, res } = GqlExecutionContext.create(context).getContext();

    const ctx = await this.jwtService
      .verifyAsync(req.cookies.refreshToken)
      .catch(() => null);

    if (!ctx) {
      return false;
    }

    // let user: User = await this.cacheManager.get(ctx.sub);
    // if (!user) {
    //   user = await this.userService.model.findById(ctx.sub);
    //   await this.cacheManager.set(ctx.sub, user);
    // }

    // if (!user) {
    //   return false;
    // }

    req.ctx = {
      id: ctx.sub,
      roleId: ctx.roleId,
    };
    const roles = this.reflector.get<UserRole[]>(
      RoleMultiCheck,
      context.getHandler(),
    );

    if (!ctx.roleId) {
      console.log('no role');
      res.clearCookie('refreshToken');
      for (const cookieName in req.cookies) {
        res.clearCookie(cookieName);
      }
      throw new UnauthorizedException(
        `Failed to authenticate. Please login again.`,
      );
    }

    if (!roles) return true;

    if (roles.some((role) => role === ctx.roleId.toString())) {
      return true;
    } else {
      // const requiredRoles = roles.join(', ');
      // res.clearCookie('refreshToken');
      // for (const cookieName in req.cookies) {
      //   res.clearCookie(cookieName);
      // }

      console.log(ctx.roleId, roles);
      throw new UnauthorizedException(
        `Access denied. You are not allowed to access this resource`,
      );
    }
  }
}

export const RoleMultiCheck = Reflector.createDecorator<UserRole[]>();

export const UserOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.USER]),
    UseGuards(RoleMultiGuard),
  );
};

export const ShopOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.SHOP_OWNER]),
    UseGuards(RoleMultiGuard),
  );
};

export const StaffOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.STAFF]),
    UseGuards(RoleMultiGuard),
  );
};

export const ManagerOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.MANAGER]),
    UseGuards(RoleMultiGuard),
  );
};

export const ShippingOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.SHIPPING]),
    UseGuards(RoleMultiGuard),
  );
};

export const ManagerOrStaff = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.MANAGER, UserRole.STAFF]),
    UseGuards(RoleMultiGuard),
  );
};

export const Admin = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.ADMIN]),
    UseGuards(RoleMultiGuard),
  );
};
export const ShopOrUserOnly = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.SHOP_OWNER, UserRole.USER]),
    UseGuards(RoleMultiGuard),
  );
};

export const AuthenticatedUser = () => {
  return applyDecorators(
    RoleMultiCheck([
      UserRole.SHOP_OWNER,
      UserRole.USER,
      UserRole.STAFF,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.SHIPPING,
    ]),
    UseGuards(RoleMultiGuard),
  );
};

export const AdminOrManager = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.ADMIN, UserRole.MANAGER]),
    UseGuards(RoleMultiGuard),
  );
};

export const AdminOrManagerOrStaff = () => {
  return applyDecorators(
    RoleMultiCheck([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]),
    UseGuards(RoleMultiGuard),
  );
};

export enum UserRole {
  USER = '65d317029abc164abb8a830b',
  SHOP_OWNER = '65d4ae42f18fa2591d75c6c8',
  STAFF = '65d594658407311c88986cf1',
  MANAGER = '65d5946c8407311c88986cf6',
  SHIPPING = '65e6acb8e400da00a5bdf109',
  ADMIN = '65d594718407311c88986cfb',
}

registerEnumType(UserRole, { name: 'UserRole' });
