import { Injectable } from '@nestjs/common';

@Injectable()
export class MongoQuery {
  public convertFilterToMongoQuery(filter: any): any {
    const query: any = {};

    for (const key in filter) {
      if (filter[key].contains) {
        query[key] = { $regex: filter[key].contains, $options: 'i' };
      } else if (filter[key].eq) {
        query[key] = filter[key].eq;
      } else {
        query[key] = filter[key];
      }
    }

    return query;
  }
}
