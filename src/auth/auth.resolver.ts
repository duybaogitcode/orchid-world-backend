import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { OutputType } from 'dryerjs';
import { Request, Response } from 'express';
import { configuration } from 'src/config';
import { User } from 'src/user/user.definition';
import { Session } from './auth.definition';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/create-auth.input';
import { ShopOwnerInput } from './dto/shopOwner.input';

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
        configuration().NODE_ENV === 'dev' ? 'localhost' : '.movie-world.store',
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      sameSite: 'none',
      path: '/',
    });
    context.res.cookie(KEYS.SESSION_ID, session.id, {
      httpOnly: true,
      domain:
        configuration().NODE_ENV === 'dev' ? 'localhost' : '.movie-world.store',
      secure: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      sameSite: 'none',
      path: '/',
    });
    context.res.cookie(KEYS.SESSION_TOKEN, session.accessToken, {
      httpOnly: true,
      domain:
        configuration().NODE_ENV === 'dev' ? 'localhost' : '.movie-world.store',
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
            : '.movie-world.store',
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
            : '.movie-world.store',
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
            : '.movie-world.store',
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        sameSite: 'none',
        path: '/',
      });
      return session;
    } catch (error) {}
  }

  @Mutation(() => String, {
    name: 'logOut',
  })
  async logOut(
    @Context()
    context: {
      res: Response;
      req: Request;
    },
  ) {
    try {
      if (!context.req.cookies.session_id) {
        throw new Error('No session found');
      }
      this.authService.logout(context.req.cookies.session_id);
      console.log(
        '🚀 ~ file: auth.resolver.ts ~ line 123 ~ AuthResolver ~ context',
        context,
      );
      const cookies = context.req.cookies;
      for (const cookieName in cookies) {
        context.res.clearCookie(cookieName, {
          domain:
            configuration().NODE_ENV === 'dev'
              ? 'localhost'
              : '.movie-world.store',
          secure: true,
          sameSite: 'none',
          path: '/',
        });
      }
      return 'LOGGED OUT';
    } catch (error) {
      // Log the error or handle it appropriately
      console.error(error);
      return 'LOG OUT FAILED';
    }
  }
}
