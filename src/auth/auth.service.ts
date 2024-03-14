import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'dryerjs';
import { Response } from 'express';
import { Model } from 'mongoose';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { UserRole } from 'src/guard/roles.guard';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { User } from 'src/user/user.definition';
import { Role, Session } from './auth.definition';
import { LoginInput } from './dto/create-auth.input';
import { ShopOwnerInput } from './dto/shopOwner.input';

function getFirstAndLastName(fullname: string) {
  const names = fullname.split(' ');
  return {
    firstName: names[0],
    lastName: names[names.length - 1],
  };
}

@Injectable()
export class AuthService {
  private readonly expiresIn = {
    accessToken: '1d',
    refreshToken: '3d',
  };
  constructor(
    @InjectFirebaseAdmin() private readonly firebaseService: FirebaseAdmin,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('Session') private readonly sessionModel: Model<Session>,
    private readonly jwtService: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(loginInput: LoginInput, roleName: string, response: Response) {
    try {
      const { idToken } = loginInput;
      const result = await this.firebaseService.auth.verifyIdToken(idToken);

      let existUser = await this.userModel.findOne({ googleId: result.uid });

      if (!existUser) {
        const userRole = await this.roleModel.findOne({ name: roleName });
        const { firstName, lastName } = getFirstAndLastName(
          result.name || 'Im Anonymous',
        );
        existUser = await this.userModel.create({
          address: [],
          avatar: result.picture,
          firstName,
          email: result.email,
          googleId: result.uid,
          lastName,
          roleId: userRole._id,
        });

        this.eventEmitter.emit('User.created', { input: existUser });
      }

      let session = await this.sessionModel.findOne({ userId: existUser._id });

      if (!session) {
        session = await this.createSession(existUser);
      } else if (this.isSessionExpired(session.accessToken)) {
        session = await this.refreshSession(existUser);
      }

      return Object.assign(session, {
        roleId: session?.roleId || existUser?.roleId,
      });
    } catch (error) {
      // Handle error appropriately
      throw error;
    }
  }

  private async createSession(user: User) {
    const payload = { email: user.email, sub: user.id, roleId: user.roleId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.accessToken,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.refreshToken,
    });

    const newSession = await this.sessionModel.create({
      userId: user.id,
      refreshToken,
      accessToken,
      roleId: user.roleId,
    });

    return newSession;
  }

  private isSessionExpired(accessToken: string) {
    const decodedAccessToken = this.jwtService.decode(accessToken);
    const expirationTime = decodedAccessToken?.exp * 1000;
    return !decodedAccessToken || expirationTime <= Date.now();
  }

  private async refreshSession(user: User) {
    const payload = { email: user.email, sub: user.id, roleId: user.roleId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.accessToken,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.refreshToken,
    });

    const updatedSession = await this.sessionModel.findOneAndUpdate(
      { userId: user.id },
      { refreshToken, accessToken, roleId: user.roleId },
      { new: true },
    );

    return updatedSession;
  }

  async registerShopOwner(input: ShopOwnerInput, sessionId: string) {
    try {
      const sessionExist = await this.sessionModel.findById(sessionId);
      if (sessionExist.roleId.toString() !== UserRole.USER.toString()) {
        throw new Error('You are not allowed to register a shop owner');
      }

      const { shopOwner } = input;

      const userId = sessionExist.userId;

      const user = await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            shopOwner: shopOwner,
            roleId: new ObjectId(UserRole.SHOP_OWNER),
          },
        },
        { new: true, upsert: true },
      );

      const session = await this.refreshSession(user);
      return Object.assign(session, {
        roleId: session?.roleId || user?.roleId,
      });
    } catch (error) {}
  }

  async logout(sessionId: string) {
    console.log('logout', sessionId);
    try {
      const session = await this.sessionModel.findById(sessionId);
      session.accessToken = null;
      session.refreshToken = null;
      await session.save();
      return session;
    } catch (error) {
      throw error;
    }
  }
}
