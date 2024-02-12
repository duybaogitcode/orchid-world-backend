import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BaseService, InjectBaseService, OutputType } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Context, Ctx } from './ctx';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponse } from './auth.definition';
import { UserOnly } from './role.guard';
import { UnauthorizedException } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

@Resolver()
export class AuthResolver {
  constructor(
    @InjectBaseService(User) public userService: BaseService<User, Context>,
    private readonly jwtService: JwtService,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  @Mutation(() => String)
  async signIn(
    @Args('input', {
      type: () => String,
    })
    input: string,
  ) {
    console.log(input);

    this.firebase.auth.verifyIdToken(input).then((decodedToken) => {
      console.log(decodedToken);
      const uid = decodedToken.uid;
      console.log(uid);
    });

    const accessToken = await this.jwtService.signAsync({
      test: '123',
    });

    const verify = await this.jwtService.verifyAsync(accessToken);
    console.log(verify);
    return accessToken;
  }

  @UserOnly()
  @Query(() => OutputType(User))
  async whoAmI(@Ctx() ctx: Context) {
    const user = await this.userService.findOne(ctx, { _id: ctx.id });
    if (user === null) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
