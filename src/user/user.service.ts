import { Injectable } from '@nestjs/common';
import { User } from './user.definition';
import { Context } from 'src/auth/ctx';
import { BaseService, InjectBaseService } from 'dryerjs';

@Injectable()
export class UserService {
  constructor(
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
  ) {}

  async getByGoogleId(googleId: string) {
    return this.userService.model.findOne({
      googleId: googleId,
    });
  }
}
