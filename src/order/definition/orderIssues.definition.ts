import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { Order } from './order.definition';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';

@Definition({
  timestamps: true,
})
export class OrderIssues extends BaseModelHasOwner() {
  @Property({ type: () => GraphQLObjectId })
  orderId: ObjectId;

  @BelongsTo(() => Order, { from: 'orderId' })
  order: Order;

  @Property({ type: () => String })
  issue: string;

  @Property({ type: () => String })
  issueSolved: string;

  @Property({ type: () => Boolean, defaultValue: false })
  isSolved: boolean;

  @Property({
    type: () => GraphQLUpload,
    db: Skip,
    output: Skip,
  })
  file: Promise<FileUpload>;
}
