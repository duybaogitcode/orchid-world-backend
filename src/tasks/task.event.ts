import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { registerEnumType } from '@nestjs/graphql';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { TaskImportance, Tasks, TaskTags } from './tasks.definition';

export enum TasksEventEnum {
  CREATED = 'TasksEventEnum_CREATED',
  AUTO_CREATE_AUTO_ASSIGN = 'TasksEventEnum_AUTO_CREATE_AUTO_ASSIGN',
}

registerEnumType(TasksEventEnum, {
  name: 'TasksEventEnum',
});

@Injectable()
export class TasksEvent {
  constructor(
    @InjectBaseService(Tasks)
    public tasks: BaseService<Tasks, Context>,
  ) {}

  @OnEvent(TasksEventEnum.AUTO_CREATE_AUTO_ASSIGN)
  async createdOrder({
    taskName,
    taskDetails,
    assignerFromUserId,
    target,
    deadline,
  }: {
    taskName: string;
    taskDetails: string;
    assignerFromUserId: ObjectId;
    target: ObjectId;
    deadline: Date;
  }) {
    const session = await this.tasks.model.db.startSession();
    session.startTransaction();
    try {
      const users = await this.tasks.model.aggregate([
        { $group: { _id: '$assignedToUserId', count: { $sum: 1 } } },
        { $sort: { count: 1 } },
      ]);

      const userWithLeastTasks = users[0]._id;

      const task = new this.tasks.model({
        taskName,
        taskDetails,
        assignerFromUserId,
        target,
        deadline: deadline,
        taskImportance: TaskImportance.MEDIUM,
        taskTags: TaskTags.AUCTION,
        assignedToUserId: new ObjectId(userWithLeastTasks),
      });

      await task.save({ session });
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
