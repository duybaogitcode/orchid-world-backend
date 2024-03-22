import {
  Args,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ObjectId, OutputType } from 'dryerjs';
import { GetByUidInput } from './dto/get-by-uid.dto';
import { User } from './user.definition';
import { UserService } from './user.service';
import { UserProfileWithCartAndWallet } from 'src/auth/auth.definition';
import {
  Admin,
  AuthenticatedUser,
  ShopOrUserOnly,
  UserOnly,
} from 'src/guard/roles.guard';
import { SuccessResponse } from 'dryerjs/dist/types';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { Context, Ctx } from 'src/auth/ctx';
import { CreateUserDTO } from './dto/create-user.dto';

@ObjectType()
class AddressResponse {
  @Field()
  address: string;

  @Field()
  isDefault: boolean;
}

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

  @Admin()
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

  @Admin()
  @Mutation(() => SuccessResponse, {
    name: 'createNewUser',
  })
  async createNewUser(@Args('input') input: CreateUserDTO) {
    try {
      const response = await this.userService.createUser(input);
      return {
        success: Boolean(response),
      };
    } catch (error) {
      throw error;
    }
  }

  @UserOnly()
  @Mutation(() => SuccessResponse, {
    name: 'sendOtp',
  })
  async sendOtp(@Args('email') email: string) {
    try {
      const response = await this.userService.sendEmailOtp(email);
      return {
        success: Boolean(response),
      };
    } catch (error) {
      throw error;
    }
  }

  @UserOnly()
  @Query(() => SuccessResponse, {
    name: 'verifyOtp',
  })
  async verify(@Args('email') email: string, @Args('otp') otp: string) {
    try {
      const response = await this.userService.verifyEmailOtp(email, otp);
      return {
        success: Boolean(response),
      };
    } catch (error) {
      throw error;
    }
  }

  @AuthenticatedUser()
  @Query(() => [AddressResponse], {
    name: 'getListAddressString',
  })
  async getListAddressString(@Ctx() ctx: Context) {
    try {
      const response = await this.userService.getListAddressString(ctx);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
