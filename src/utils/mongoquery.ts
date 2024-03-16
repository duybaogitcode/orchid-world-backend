import { Injectable } from '@nestjs/common';

@Injectable()
export class MongoQuery {
  public convertFilterToMongoQuery(filter: any): any {
    const query: any = {};

    for (const key in filter) {
      if (filter[key].contains) {
        query[key] = { $regex: filter[key].contains, $options: 'i' };
      } else if (filter[key].eq) {
        query[key] = { $eq: filter[key].in };
      } else if (filter[key].in) {
        query[key] = { $in: filter[key].in };
      } else if (filter[key].notIn) {
        query[key] = { $notIn: filter[key].in };
      } else if (filter[key].notEq) {
        query[key] = { $ne: filter[key].in };
      } else {
        query[key] = filter[key];
      }
    }

    return query;
  }
}
