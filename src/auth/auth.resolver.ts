import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/create-auth.input';
import { Res } from '@nestjs/common';
import { OutputType } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Session } from './auth.definition';
import { Response } from 'express';
import { configuration } from 'src/config';

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
}
