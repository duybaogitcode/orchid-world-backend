import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Report } from './report.definition';

@Definition({ timestamps: true })
export class ReportTypes extends BaseModel() {
  @Property({ type: () => String })
  name: string;

  @HasMany(() => Report, {
    to: 'reportTypeId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  report: Report[];
}
