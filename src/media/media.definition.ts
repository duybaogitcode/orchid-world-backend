import { Definition, Property } from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';

@Definition()
export class Media extends BaseModel() {
  @Property({ db: { unique: true } })
  name: string;
  mime: string;

  @Property({ db: { unique: true } })
  url: string;

  size: number;
  width: number;
  height: number;
  authorId: string;
}
