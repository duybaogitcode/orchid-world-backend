import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext();
    const ctx = await this.jwtService
      .verifyAsync(req.cookies.refreshToken)
      .catch(() => null);

    console.log(ctx);

    return !!ctx;
  }

  // canActivate(context: ExecutionContext): boolean {
  //   const ctx = GqlExecutionContext.create(context).getContext();
  //   // Check if user is logged in
  //   return !!ctx.req.session.userId;
  // }
}
