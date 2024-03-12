import { GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  Filterable,
  GraphQLObjectId,
  ObjectId,
  Property,
  Skip,
  Sortable,
} from 'dryerjs';
import { register } from 'module';
import { BaseModel } from 'src/base/base.definition';
import { User } from 'src/user/user.definition';

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  DELAYED = 'DELAYED',
  OVERDUE = 'OVERDUE',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

@Definition({
  timestamps: true,
})
export class Tasks extends BaseModel() {
  @Property({ type: () => String })
  taskName: string;

  @Property({ type: () => String })
  taskDetails: string;

  @Property({ type: () => GraphQLObjectId, nullable: true })
  assignedToUserId: ObjectId;

  @BelongsTo(() => User, { from: 'assignedToUserId' })
  assignedToUser: User;

  @Property({ type: () => GraphQLObjectId, create: Skip, update: Skip })
  assignerFromUserId: ObjectId;

  @BelongsTo(() => User, { from: 'assignerFromUserId' })
  assignerFromUser: User;

  @Property({ type: () => String, nullable: true })
  target: string;

  @Sortable()
  @Property({
    output: { type: () => GraphQLISODateTime },
  })
  deadline: Date;

  @Filterable(() => TaskStatus, {
    operators: ['eq'],
  })
  @Property({ type: () => TaskStatus, defaultValue: TaskStatus.NOT_STARTED })
  status: TaskStatus;
}
