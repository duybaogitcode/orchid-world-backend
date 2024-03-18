import { Args, Field, InputType, Mutation, Resolver } from '@nestjs/graphql';
import { TasksService } from './task.service';
import { AdminOrManager } from 'src/guard/roles.guard';
import { SuccessResponse } from 'dryerjs/dist/types';
import { GraphQLObjectId } from 'dryerjs';
import { Types } from 'mongoose';
import { Context, Ctx } from 'src/auth/ctx';

@InputType()
export class TaskID {
  @Field(() => GraphQLObjectId)
  id: Types.ObjectId;
}

@Resolver()
export class TaskResolver {
  constructor(private readonly taskService: TasksService) {}

  @AdminOrManager()
  @Mutation(() => SuccessResponse, { name: 'removeTask' })
  async remove(@Args('input') input: TaskID, @Ctx() ctx: Context) {
    try {
      const newProduct = await this.taskService.removeTask(input.id, ctx);
      return {
        success: Boolean(newProduct),
      };
    } catch (error) {
      console.error('Failed remove tasks:', error);
      throw error;
    }
  }
}
