import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/user/user.definition';

export const Ctx = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext) => {
    const { req } = GqlExecutionContext.create(executionContext).getContext();
    if (req.ctx) return req.ctx as Context;
    return null;
  },
);

export type Context = null | Pick<
  User,
  'id' | 'roleId' | 'role' | 'googleId' | 'email'
>;
