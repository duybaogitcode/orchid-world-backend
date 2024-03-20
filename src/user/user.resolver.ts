import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId, OutputType } from 'dryerjs';
import { GetByUidInput } from './dto/get-by-uid.dto';
import { User } from './user.definition';
import { UserService } from './user.service';
import { UserProfileWithCartAndWallet } from 'src/auth/auth.definition';
import { AuthenticatedUser, ShopOrUserOnly } from 'src/guard/roles.guard';
import { SuccessResponse } from 'dryerjs/dist/types';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { Context, Ctx } from 'src/auth/ctx';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @AuthenticatedUser()
  @Query(() => OutputType(UserProfileWithCartAndWallet), {
    name: 'userMyself',
  })
  async getByGoogleId(@Args('input') input: GetByUidInput) {
    return this.userService.getByGoogleId(input.googleId);
  }

  @Mutation(() => SuccessResponse, {
    name: 'updateUserRole',
  })
  async updateUserRole(
    @Args('input') input: UpdateRoleDTO,
    @Ctx() ctx: Context,
  ) {
    try {
      const response = await this.userService.updateUserRole(
        new ObjectId(input.userId),
        new ObjectId(input.roleId),
        new ObjectId(ctx?.id),
      );
      return {
        success: response,
      };
    } catch (error) {
      throw error;
    }
  }
}
