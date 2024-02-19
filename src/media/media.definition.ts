import { Definition, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';

@Definition()
export class Media extends BaseModelHasOwner() {
  @Property({ db: { unique: true } })
  name: string;

  mime: string;

  @Property({ db: { unique: true } })
  url: string;

  size: number;
  width: number;
  height: number;
}
