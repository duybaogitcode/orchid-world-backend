import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { TagWithValues } from './tagValues.definition';
@Definition({
  timestamps: true,
})
export class Tags extends BaseModel() {
  @Property({ db: { unique: true } })
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  @Property({ type: () => [String] })
  values: string[];
}
