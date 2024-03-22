import { Injectable } from '@nestjs/common';
import { Tasks } from './tasks.definition';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHook,
  AfterCreateHookInput,
  AfterUpdateHook,
  AfterUpdateHookInput,
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  BeforeFindManyHook,
  BeforeUpdateHook,
  BeforeUpdateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
import { UserRole } from 'src/guard/roles.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { NotificationTypeEnum } from 'src/notification/notification.definition';

@Injectable()
export class TasksHook {
  constructor(
    @InjectBaseService(Tasks) public tasksService: BaseService<Tasks, Context>,
    @InjectBaseService(User) public userService: BaseService<User, Context>,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  @BeforeCreateHook(() => Tasks)
  async addingAssigner({ input, ctx }: BeforeCreateHookInput<Tasks, Context>) {
    input.assignerFromUserId = new ObjectId(ctx.id);
  }

  @AfterCreateHook(() => Tasks)
  async assignTaskToUser({ created }: AfterCreateHookInput<Tasks, Context>) {
    const user = await this.userService.model.findById(
      created.assignedToUserId,
    );
    if (!user) {
      throw new Error('User not found');
    }

    let role = '';
    if (user.roleId.toString() === UserRole.MANAGER.toString()) {
      role = 'manager';
    } else if (user.roleId.toString() === UserRole.STAFF.toString()) {
      role = 'staff';
    }

    this.eventEmitter.emit(NotificationEvent.SEND, {
      href: `/${role}/tasks`,
      message: 'Bạn có một công việc mới vừa được thêm vào',
      notificationType: NotificationTypeEnum.SYSTEM,
      receiver: created.assignedToUserId,
    });
  }

  @BeforeUpdateHook(() => Tasks)
  async beforeUpdateTask({
    input,
    ctx,
  }: BeforeUpdateHookInput<Tasks, Context>) {
    const task = await this.tasksService.model.findById(input.id);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.assignedToUserId) {
      if (
        ctx.id.toString() !== task.assignedToUserId.toString() &&
        ctx.id.toString() !== task.assignerFromUserId.toString() &&
        ctx.roleId.toString() !== UserRole.ADMIN.toString()
      ) {
        throw new Error('You are not authorized to edit this task');
      }
    }
  }

  @AfterUpdateHook(() => Tasks)
  async afterUpdateTask({
    updated,
    ctx,
  }: AfterUpdateHookInput<Tasks, Context>) {
    const assigned = await this.userService.model.findById(
      updated.assignedToUserId,
    );

    if (ctx.id.toString() === updated.assignedToUserId.toString()) {
      const assigner = await this.userService.model.findById(
        updated.assignerFromUserId,
      );
      let role = '';
      if (assigner.roleId.toString() === UserRole.MANAGER.toString()) {
        role = 'manager';
      } else if (assigner.roleId.toString() === UserRole.ADMIN.toString()) {
        role = 'admin';
      }
      this.eventEmitter.emit(NotificationEvent.SEND, {
        href: `/${role}/tasks`,
        message: 'Công việc của bạn vừa được cập nhật',
        notificationType: NotificationTypeEnum.SYSTEM,
        receiver: updated.assignerFromUserId,
      });
    }
    if (ctx.id.toString() === updated.assignerFromUserId.toString()) {
      let role = '';
      if (assigned.roleId.toString() === UserRole.MANAGER.toString()) {
        role = 'manager';
      } else if (assigned.roleId.toString() === UserRole.STAFF.toString()) {
        role = 'staff';
      }
      this.eventEmitter.emit(NotificationEvent.SEND, {
        href: `/${role}/tasks`,
        message: 'Công việc của bạn vừa được cập nhật',
        notificationType: NotificationTypeEnum.SYSTEM,
        receiver: updated.assignedToUserId,
      });
    }
  }

  @BeforeFindManyHook(() => Tasks)
  async filterTasksByRole({
    filter,
    ctx,
  }: {
    filter: any;
    ctx: Context;
  }): Promise<any> {
    filter.isRemoved = false;
    if (ctx.roleId.toString() === UserRole.ADMIN.toString()) {
      return filter;
    }
    filter.$or = [
      { assignerFromUserId: new ObjectId(ctx.id) },
      { assignedToUserId: new ObjectId(ctx.id) },
    ];
    return filter;
  }
}
