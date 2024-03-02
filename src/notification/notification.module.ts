import { Module } from '@nestjs/common';
import { GatewayModule } from 'src/gateway/gateway.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [GatewayModule],
  providers: [NotificationService],
})
export class AuthModule {}
