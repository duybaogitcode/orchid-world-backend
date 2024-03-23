import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AfterCreateHook, AfterCreateHookInput, BeforeCreateHook, BeforeCreateHookInput, ObjectId } from "dryerjs";
import { Report } from "../definition/report.definition";
import { Context } from "src/auth/ctx";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotificationEvent } from "src/notification/notification.service";
import { createNotification } from "src/notification/notification.resolver";
import { NotificationTypeEnum } from "src/notification/notification.definition";

@Injectable()
export class ReportHook {
    constructor(private readonly eventEmitter: EventEmitter2) { }

    @BeforeCreateHook(() => Report)
    beforeCreateReport({ input, ctx }: BeforeCreateHookInput<Report, Context>) {
        if (ctx === null || ctx?.id === null) {
            throw new UnauthorizedException('Unauthorized');
        }
        input.authorId = new ObjectId(ctx?.id);
        console.log('Before create report');
    }

    // @AfterCreateHook(() => Report)
    // afterCreateReport({ created, ctx }: AfterCreateHookInput<Report, Context>) {
    //     console.log('After create report');
    //     this.eventEmitter.emit(NotificationEvent.SEND, createNotification({
    //         href: `/manager/reports`,
    //         message: `Báo cáo mới từ ${ctx?.firstName} ${ctx?.lastName}`,
    //         notificationType: NotificationTypeEnum.REPORT,
    //         receiver: []
    //     }))
    // }
}