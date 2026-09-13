import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PaymentModule } from './modules/payment/PaymentModule';
import { WebhookModule } from './modules/webhook/WebhookModule';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConsumerModule } from './modules/consumer/ConsumerModule';

@Module({
  imports: [
    PaymentModule,
    WebhookModule,
    ConsumerModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
