import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { UserModule } from './user/user.module';
import { MailerConfigModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RabbitMQModule,
    UserModule,
    MailerConfigModule,
  ],
})
export class AppModule {}
