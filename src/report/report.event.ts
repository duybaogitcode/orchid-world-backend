import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { registerEnumType } from '@nestjs/graphql';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { Report } from './definition/report.definition';

export enum ReportEventEnum {
  CREATED = 'ReportEventEnum_CREATED',
}

registerEnumType(ReportEventEnum, {
  name: 'ReportEventEnum',
});

@Injectable()
export class ReportEvent {
  constructor(
    @InjectBaseService(Report)
    public report: BaseService<Report, Context>,
  ) {}

  @OnEvent(ReportEventEnum.CREATED)
  async createdOrder({
    title,
    content,
    reportTypeId,
  }: {
    title: string;
    content: string;
    reportTypeId?: ObjectId;
  }) {
    const session = await this.report.model.db.startSession();
    session.startTransaction();
    try {
      //other type
      if (!reportTypeId) {
        reportTypeId = new ObjectId('65f586bd3150c6c009511524');
      }
      const report = new this.report.model({
        title,
        content,
        reportTypeId,
      });

      await report.save({ session });
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
