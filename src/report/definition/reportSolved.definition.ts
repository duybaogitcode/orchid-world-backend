import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { Report } from './report.definition';

@Definition({ timestamps: true })
export class ReportSolved extends BaseModelHasOwner() {
  @Property({ type: () => GraphQLObjectId })
  reportId: ObjectId;

  @BelongsTo(() => Report, { from: 'reportId' })
  report: Report;

  @Property({ type: () => String })
  solution: string;
}
