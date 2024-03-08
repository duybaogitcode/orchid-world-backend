import {
  OnQueueActive,
  OnQueueCompleted,
  Process,
  Processor,
} from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';

@Processor('systemWallet')
export class SystemWalletConsumer {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process()
  async handleTransferredEvent(job: Job) {
    const { input } = job.data;

    this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
      input: input,
    });
  }
}
