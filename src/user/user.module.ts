import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { MailerConfigModule } from 'src/mailer/mailer.module';
import { DatabaseModule } from 'src/database/database.module';
import { Avatar, AvatarSchema } from './schemas/avatar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]),
    RabbitMQModule,
    MailerConfigModule,
    DatabaseModule,
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
