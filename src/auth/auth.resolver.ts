import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/create-auth.input';
import { Res } from '@nestjs/common';
import { OutputType } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Session } from './auth.definition';
import { Request, Response } from 'express';
import { configuration } from 'src/config';
import { UserOnly } from 'src/guard/roles.guard';
import { ShopOwnerInput } from './dto/shopOwner.input';
import { Ctx } from './ctx';

const UserEntity = OutputType(User);
const SessionEntity = OutputType(Session);
export const KEYS = {
  SESSION_ID: 'session_id',
  SESSION_TOKEN: 'session_token',
};
@Resolver(() => SessionEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => SessionEntity)
  async login(
    @Args('loginInput') loginInput: LoginInput,
    @Context()
    context: {
      res: Response;
    },
  ) {
    const session = await this.authService.create(
      loginInput,
      'user',
      context.res,
    );
    console.log('User login');

    context.res.cookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      domain:
        configuration().NODE_ENV === 'dev'
          ? 'localhost'
          : 'orchid-world-frontend.vercel.app',
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      sameSite: 'none',
      path: '/',
    });
    context.res.cookie(KEYS.SESSION_ID, session.id, {
      httpOnly: true,
      domain:
        configuration().NODE_ENV === 'dev'
          ? 'localhost'
          : 'orchid-world-frontend.vercel.app',
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      sameSite: 'none',
      path: '/',
    });
    context.res.cookie(KEYS.SESSION_TOKEN, session.accessToken, {
      httpOnly: true,
      domain:
        configuration().NODE_ENV === 'dev'
          ? 'localhost'
          : 'orchid-world-frontend.vercel.app',
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      sameSite: 'none',
      path: '/',
    });
    return session;
  }

  @Mutation(() => SessionEntity, {
    name: 'registerShopOwner',
  })
  async registerShopOwner(
    @Args('input') input: ShopOwnerInput,
    @Context()
    context: {
      res: Response;
      req: Request;
    },
  ) {
    try {
      const session = await this.authService.registerShopOwner(
        input,
        context.req.cookies.session_id,
      );

      context.res.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        domain:
          configuration().NODE_ENV === 'dev'
            ? 'localhost'
            : 'orchid-world-frontend.vercel.app',
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        sameSite: 'none',
        path: '/',
      });
      context.res.cookie(KEYS.SESSION_ID, session.id, {
        httpOnly: true,
        domain:
          configuration().NODE_ENV === 'dev'
            ? 'localhost'
            : 'orchid-world-frontend.vercel.app',
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        sameSite: 'none',
        path: '/',
      });
      context.res.cookie(KEYS.SESSION_TOKEN, session.accessToken, {
        httpOnly: true,
        domain:
          configuration().NODE_ENV === 'dev'
            ? 'localhost'
            : 'orchid-world-frontend.vercel.app',
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        sameSite: 'none',
        path: '/',
      });
      return session;
    } catch (error) {}
  }
}
