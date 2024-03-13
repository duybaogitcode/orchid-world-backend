import { Injectable } from '@nestjs/common';
import { Tasks } from './tasks.definition';
import { Context } from 'src/auth/ctx';
import {
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  BeforeUpdateHook,
  BeforeUpdateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
import { UserRole } from 'src/guard/roles.guard';

@Injectable()
export class TasksHook {
  constructor(
    @InjectBaseService(Tasks) public tasksService: BaseService<Tasks, Context>,
  ) {}

  @BeforeCreateHook(() => Tasks)
  async addingAssigner({ input, ctx }: BeforeCreateHookInput<Tasks, Context>) {
    input.assignerFromUserId = new ObjectId(ctx.id);
  }

  @BeforeUpdateHook(() => Tasks)
  async throwErrorIfNameAlreadyExists({
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
}
