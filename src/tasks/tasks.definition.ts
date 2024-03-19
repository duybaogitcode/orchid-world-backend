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
  OVERDUE = 'OVERDUE',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
});

export enum TaskImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

registerEnumType(TaskImportance, {
  name: 'TaskImportance',
});

export enum TaskTags {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  SHOP = 'SHOP',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  FEEDBACK = 'FEEDBACK',
  REPORT = 'REPORT',
  OTHERS = 'OTHERS',
}

registerEnumType(TaskTags, {
  name: 'TaskTags',
});

@Definition({
  timestamps: true,
  enableTextSearch: true,
})
export class Tasks extends BaseModel() {
  @Filterable(() => String, {
    operators: ['contains'],
  })
  @Property({ type: () => String })
  taskName: string;

  @Property({ type: () => String })
  taskDetails: string;

  @Property({ type: () => GraphQLObjectId, nullable: true })
  assignedToUserId: ObjectId;

  @BelongsTo(() => User, { from: 'assignedToUserId', skipExistenceCheck: true })
  assignedToUser: User;

  @Property({ type: () => GraphQLObjectId, create: Skip, update: Skip })
  assignerFromUserId: ObjectId;

  @BelongsTo(() => User, { from: 'assignerFromUserId' })
  assignerFromUser: User;

  @Property({ type: () => Boolean, defaultValue: false })
  isRemoved: boolean;

  @Property({ type: () => String, nullable: true })
  target: string;

  @Property({ type: () => String, nullable: true })
  note: string;

  @Sortable()
  @Property({
    output: { type: () => GraphQLISODateTime },
  })
  deadline: Date;

  @Filterable(() => TaskStatus, {
    operators: ['eq', 'notEq'],
  })
  @Property({ type: () => TaskStatus, defaultValue: TaskStatus.NOT_STARTED })
  status: TaskStatus;

  @Filterable(() => TaskImportance, {
    operators: ['eq'],
  })
  @Property({ type: () => TaskImportance })
  taskImportance: TaskImportance;

  @Filterable(() => TaskTags, {
    operators: ['eq'],
  })
  @Property({ type: () => TaskTags })
  taskTags: TaskTags;
}
