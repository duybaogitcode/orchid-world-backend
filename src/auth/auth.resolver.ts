import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/create-auth.input';

import { OutputType } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Session } from './auth.definition';
import { Response } from 'express';

const UserEntity = OutputType(User);
const SessionEntity = OutputType(Session);
@Resolver(() => SessionEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => SessionEntity)
  login(
    @Args('loginInput') loginInput: LoginInput,
    @Context() context: { res: Response },
  ) {
    return this.authService.create(loginInput, 'user', context.res);
  }
}
