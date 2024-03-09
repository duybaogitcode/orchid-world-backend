import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module, Global } from '@nestjs/common';
import { Queue } from 'bull';
import { AgendaQueue } from './agenda.queue';

@Global()
@Module({
  providers: [
    {
      provide: 'BullQueue_systemWallet',
      useFactory: async () => {
        return await BullModule.registerQueue({
          name: 'systemWallet',
        });
      },
    },
  ],
  exports: ['BullQueue_systemWallet', AgendaQueue],
})
export class BullQueueModule {}
