import { Args, Query, Resolver } from '@nestjs/graphql';
import { OutputType } from 'dryerjs';
import { GetByUidInput } from './dto/get-by-uid.dto';
import { User } from './user.definition';
import { UserService } from './user.service';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => OutputType(User), { name: 'userByGoogleId' })
  async getByGoogleId(@Args('input') input: GetByUidInput) {
    return this.userService.getByGoogleId(input.googleId);
  }
}
