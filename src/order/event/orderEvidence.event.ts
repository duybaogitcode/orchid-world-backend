import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Wallet } from 'src/wallet/wallet.definition';

import { OnEvent } from '@nestjs/event-emitter';
import { OrderEvidence } from '../definition/orderEvidence.definition';
import { UpdateOrder } from '../dto/update-order.dto';
import { FirebaseService } from 'src/firebase/firebase.serivce';
import { Order } from '../definition/order.definition';

@Injectable()
export class OrderEvidenceEvent {
  constructor(
    @InjectBaseService(OrderEvidence)
    public orderEvidence: BaseService<OrderEvidence, Context>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @OnEvent('Order.status.updated')
  async createEvidenceWhenOrderStatusUpdated({
    input,
    inputOrder,
    ctx,
  }: {
    input: UpdateOrder;
    inputOrder: Order;
    ctx: Context;
  }) {
    const session = await this.orderEvidence.model.db.startSession();
    session.startTransaction();
    let media;
    try {
      if (input.file) {
        const file = await input.file;
        const url = await this.firebaseService.uploadFile(file, 'order');
        media = url;
      }

      const evidence = new this.orderEvidence.model({
        orderId: inputOrder.id,
        atStatus: input.status,
        media,
        authorId: new ObjectId(ctx.id),
        description: input.description,
      });

      await evidence.save({ session });

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
