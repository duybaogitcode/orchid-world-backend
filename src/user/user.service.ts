import { Inject, Injectable } from '@nestjs/common';
import { User } from './user.definition';
import { Context } from 'src/auth/ctx';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MailEventEnum } from 'src/email/email.event';
import { Role, Session } from 'src/auth/auth.definition';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventGateway } from 'src/gateway/event.gateway';

export const USER_EVENTS = {
  UPDATE_ROLE: 'user:update.role',
};

export const USER_SOCKET_EVENTS = {
  UPDATE_ROLE_ERROR: 'user:update.role.error',
  UPDATE_ROLE_SUCCESS: 'user:update.role.success',
};

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectBaseService(User)
    public userService: BaseService<User, Context>,
    @InjectBaseService(Cart)
    public cartService: BaseService<Cart, Context>,
    @InjectBaseService(Wallet)
    public walletService: BaseService<Wallet, Context>,
    private readonly eventEmitter: EventEmitter2,
    @InjectBaseService(Role)
    public roleService: BaseService<Role, Context>,
    @InjectBaseService(Session)
    public sessionService: BaseService<Session, Context>,
    private readonly socketEmitter: EventGateway,
  ) {}

  async getByGoogleId(googleId: string) {
    const user = await this.userService.model.findOne({
      googleId: googleId,
    });

    const [cart, wallet] = await Promise.all([
      this.cartService.model.findOne({
        authorId: user._id,
      }),
      this.walletService.model.findOne({
        authorId: user._id,
      }),
    ]);
    // console.log({ address: user?.address });
    // if (!user?.address || user?.address === null) {
    //   user.address = [];
    // }
    // console.log({
    //   cart,
    //   wallet,
    // });

    return {
      profile: user,
      cart,
      wallet,
    };
  }

  async sendEmailOtp(email: string) {
    this.eventEmitter.emit(MailEventEnum.SEND_EMAIL_OTP, email, 'OTP', '1234');
    return {
      success: true,
      message: 'OTP sent to your email',
    };
  }
  async updateUserRole(
    userId: ObjectId,
    roleId: ObjectId,
    actionAuthor: ObjectId,
  ) {
    this.eventEmitter.emit(USER_EVENTS.UPDATE_ROLE, {
      userId,
      roleId,
      actionAuthor,
    });

    return true;
  }

  @OnEvent(USER_EVENTS.UPDATE_ROLE)
  async handleUpdateUserRole(payload: {
    userId: ObjectId;
    roleId: ObjectId;
    actionAuthor: ObjectId;
  }) {
    const { userId, roleId } = payload;
    // Verify role
    const role = await this.roleService.model.findById(roleId);
    if (!role) {
      this.socketEmitter.emitTo(
        payload.actionAuthor.toString(),
        USER_SOCKET_EVENTS.UPDATE_ROLE_ERROR,
        {
          message: 'Role not found',
        },
      );
      throw new Error('Role not found');
    }
    // Verify user
    const user = await this.userService.model.findById(userId);
    if (!user) {
      this.socketEmitter.emitTo(
        payload.actionAuthor.toString(),
        USER_SOCKET_EVENTS.UPDATE_ROLE_ERROR,
        {
          message: 'User not found',
        },
      );
      throw new Error('User not found');
    }

    // Verify action author
    const actionAuthor = await this.userService.model.findById(
      payload.actionAuthor,
    );
    if (!actionAuthor) {
      this.socketEmitter.emitTo(
        payload.actionAuthor.toString(),
        USER_SOCKET_EVENTS.UPDATE_ROLE_ERROR,
        {
          message: 'Action author not found',
        },
      );
      throw new Error('Action author not found');
    }

    // Sure that action author is admin, therefore user also admin. Admin cannot change role of admin
    if (actionAuthor.roleId === user.roleId || actionAuthor.id === user.id) {
      this.socketEmitter.emitTo(
        payload.actionAuthor.toString(),
        USER_SOCKET_EVENTS.UPDATE_ROLE_ERROR,
        {
          message: 'You do not have permission to perform this action',
        },
      );
      throw new Error('You do not have permission to perform this action');
    }

    user.roleId = new ObjectId(roleId);
    await user.save();
    this.socketEmitter.emitTo(
      payload.actionAuthor.toString(),
      USER_SOCKET_EVENTS.UPDATE_ROLE_ERROR,
      {
        message: 'Update role success',
      },
    );
    return true;
  }
}
