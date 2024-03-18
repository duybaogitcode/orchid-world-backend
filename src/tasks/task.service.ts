import { Inject, Injectable } from '@nestjs/common';
import { Tasks } from './tasks.definition';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { Cache } from 'cache-manager';

@Injectable()
export class TasksService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectBaseService(Tasks)
    public tasksService: BaseService<Tasks, Context>,
  ) {}

  async removeTask(id: ObjectId, ctx: Context) {
    try {
      const task = await this.tasksService.model.findById(id);
      if (!task) {
        throw new Error('Task not found');
      }
      if (task.assignerFromUserId.toString() !== ctx.id.toString()) {
        throw new Error('Not authorized');
      }

      task.isRemoved = true;
      await task.save();
      return true;
    } catch (error) {
      throw error;
    }
  }
}
