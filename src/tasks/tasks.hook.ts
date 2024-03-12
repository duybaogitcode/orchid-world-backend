import { Injectable } from '@nestjs/common';
import { Tasks } from './tasks.definition';
import { Context } from 'src/auth/ctx';
import {
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';

@Injectable()
export class TasksHook {
  constructor(
    @InjectBaseService(Tasks) public tasksService: BaseService<Tasks, Context>,
  ) {}

  @BeforeCreateHook(() => Tasks)
  async throwErrorIfNameAlreadyExists({
    input,
    ctx,
  }: BeforeCreateHookInput<Tasks, Context>) {
    input.assignerFromUserId = new ObjectId(ctx.id);
  }
}
