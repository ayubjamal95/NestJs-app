import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserDto } from 'src/user/dto/user.dto';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendEmail(user: UserDto) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome',
      text: `Hello ${user.name}, welcome to our service!`,
    });
  }
}
