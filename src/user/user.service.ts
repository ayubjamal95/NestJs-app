import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UserDto } from './dto/user.dto';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { MailService } from 'src/mailer/mailer.service';
import { DatabaseService } from 'src/database/database.service';
import {
  ERROR_MESSAGES,
  RABBITMQ,
  SUCCESS_MESSAGES,
  URLs,
} from 'src/constants';
import { Avatar } from './schemas/avatar.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Avatar.name) private readonly avatarModel: Model<Avatar>,
    private readonly rabbitMQService: RabbitMQService,
    private readonly mailService: MailService,
    private readonly databaseService: DatabaseService,
  ) {}
  async create(userDto: UserDto): Promise<User> {
    try {
      // Create user
      const createdUser = new this.userModel(userDto);
      const savedUser = await createdUser.save();

      try {
        // Send email
        this.mailService.sendEmail(userDto);
      } catch (emailError) {
        throw new InternalServerErrorException(ERROR_MESSAGES.EMAIL_FAILED);
      }

      try {
        // Emit RabbitMQ event
        this.rabbitMQService.send(RABBITMQ.PRODUCER_PATTERN, {
          message: userDto.name,
        });
      } catch (rabbitmqError) {
        throw new InternalServerErrorException(ERROR_MESSAGES.RABBITMQ_FAILED);
      }
      return savedUser;
    } catch (error) {
      throw new InternalServerErrorException(ERROR_MESSAGES.USER_FAILED);
    }
  }

  async findById(userId: string): Promise<any> {
    try {
      const response = await axios.get(URLs.USER_URL(userId));
      if (response.data) {
        return response.data;
      } else {
        throw new NotFoundException(
          ERROR_MESSAGES.USER_NOT_FOUND_WITH_ID(userId),
        );
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundException(
          ERROR_MESSAGES.USER_NOT_FOUND_WITH_ID(userId),
        );
      } else {
        throw new InternalServerErrorException(
          ERROR_MESSAGES.USER_FETCH_FAILED(userId) + `: ${error.message}`,
        );
      }
    }
  }

  async getAvatar(userId: string): Promise<string> {
    try {
      let avatar = await this.databaseService.findByUserId(userId);
      if (avatar == null) {
        avatar = new this.avatarModel({ userId });
      }
      // Check if avatarBase64 exists in the user document
      if (
        avatar !== null &&
        avatar.avatarBase64 !== undefined &&
        avatar.avatarBase64 !== null
      ) {
        return avatar.avatarBase64; // Return base64-encoded avatar from MongoDB
      }

      const avatarUrl = URLs.AVATAR_URL(userId);
      const response = await axios.get(avatarUrl, {
        responseType: 'arraybuffer',
      });

      const imageBuffer = Buffer.from(response.data, 'binary');
      const base64Image = imageBuffer.toString('base64');

      // Save image to local filesystem
      const avatarFileName = `${userId}_avatar.jpg`; // Adjust file extension as needed
      const avatarPath = path.join(
        __dirname,
        `../../avatars/${avatarFileName}`,
      );

      fs.writeFileSync(avatarPath, imageBuffer);

      // Save the avatarBase64 in MongoDB
      avatar.avatarBase64 = base64Image;
      avatar.userId = userId;
      await avatar.save();
      return base64Image; // Return base64-encoded avatar
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundException(ERROR_MESSAGES.AVATAR_NOT_FOUND);
      } else if (error.isAxiosError) {
        throw new InternalServerErrorException(ERROR_MESSAGES.AVATAR_FAILED);
      } else {
        throw new InternalServerErrorException(ERROR_MESSAGES.AVATAR_ERROR);
      }
    }
  }

  async deleteAvatar(userId: string): Promise<string> {
    const avatarFileName = `${userId}_avatar.jpg`;
    const avatarPath = path.join(__dirname, `../../avatars/${avatarFileName}`);

    try {
      // Delete the avatar file from the local filesystem
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }

      // Update the avatar document in MongoDB to clear avatarBase64
      const deletedAvatar =
        await this.databaseService.findByUserIdAndDelete(userId);

      if (!deletedAvatar) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return SUCCESS_MESSAGES.DELETED_SUCCESSFUL;
    } catch (error) {
      // Rollback operations if necessary (e.g., restore deleted file)
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          ERROR_MESSAGES.AVATAR_NOT_DELETED,
        );
      }
    }
  }
}
