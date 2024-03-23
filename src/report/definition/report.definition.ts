import {
  BelongsTo,
  Definition,
  Embedded,
  Filterable,
  GraphQLObjectId,
  HasOne,
  ObjectId,
  Property,
  Ref,
} from 'dryerjs';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { ShopOwner, User } from 'src/user/user.definition';
import { ReportTypes } from './reportTypes.definition';
import { ReportSolved } from './reportSolved.definition';

@Definition({ timestamps: true })
export class Report extends BaseModelHasOwner() {
  @Property({ type: () => String })
  title: string;

  @Property({ type: () => String, nullable: true })
  targetUrl: string;

  @Property({ type: () => String })
  content: string;

  @Filterable(() => GraphQLObjectId, {
    operators: ['eq']
  })
  @Property({ type: () => GraphQLObjectId, nullable: true })
  reportTargetId: ObjectId;

  @BelongsTo(() => Product, { from: 'reportTargetId' })
  reportTarget: Product;

  @Property({ type: () => Boolean, defaultValue: false })
  isResolved: boolean;

  @HasOne(() => ReportSolved, {
    to: 'reportId',
  })
  reportSolved: Ref<ReportSolved>;

  @Property({ type: () => GraphQLObjectId })
  reportTypeId: ObjectId;

  @BelongsTo(() => ReportTypes, { from: 'reportTypeId' })
  reportType: ReportTypes;
}
