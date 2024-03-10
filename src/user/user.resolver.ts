import { Args, Query, Resolver } from '@nestjs/graphql';
import { OutputType } from 'dryerjs';
import { GetByUidInput } from './dto/get-by-uid.dto';
import { User } from './user.definition';
import { UserService } from './user.service';
import { UserProfileWithCartAndWallet } from 'src/auth/auth.definition';
import { AuthenticatedUser, ShopOrUserOnly } from 'src/guard/roles.guard';

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
}
