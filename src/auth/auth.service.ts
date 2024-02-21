import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { LoginInput } from './dto/create-auth.input';
import { BaseService, InjectBaseService, OutputType } from 'dryerjs';
import { User } from 'src/user/user.definition';
import { Context } from './ctx';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, Session } from './auth.definition';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Response } from 'express';

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
        const { firstName, lastName } = getFirstAndLastName(result.name);
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
        session = await this.createSession(existUser, roleName);
      } else if (this.isSessionExpired(session.accessToken)) {
        session = await this.refreshSession(existUser, roleName);
      }

      response.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'strict',
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });

      return session;
    } catch (error) {
      // Handle error appropriately
      throw error;
    }
  }

  private async createSession(user: User, roleName: string) {
    const payload = { email: user.email, sub: user.id, roleName: roleName };
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
    });

    return newSession;
  }

  private isSessionExpired(accessToken: string) {
    const decodedAccessToken = this.jwtService.decode(accessToken);
    const expirationTime = decodedAccessToken?.exp * 1000;
    return !decodedAccessToken || expirationTime <= Date.now();
  }

  private async refreshSession(user: User, roleName: string) {
    const payload = { email: user.email, sub: user.id, roleName: roleName };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.accessToken,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresIn.refreshToken,
    });

    const updatedSession = await this.sessionModel.findOneAndUpdate(
      { userId: user.id },
      { refreshToken, accessToken },
      { new: true },
    );

    return updatedSession;
  }
}
