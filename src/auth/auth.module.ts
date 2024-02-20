import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseModule } from 'nestjs-firebase';
import { User } from 'src/user/user.definition';
import { Role, Session } from './auth.definition';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: Model<User> },
      { name: Role.name, schema: Model<Role> },
      { name: Session.name, schema: Model<Session> },
    ]),
  ],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
