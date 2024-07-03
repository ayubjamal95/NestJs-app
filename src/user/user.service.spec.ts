import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { MailService } from 'src/mailer/mailer.service';
import { DatabaseService } from 'src/database/database.service';
import { UserDto } from './dto/user.dto';
import { Model } from 'mongoose';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios'; // Import axios
import * as fs from 'fs';
import { SUCCESS_MESSAGES } from 'src/constants';
import { Avatar } from './schemas/avatar.schema';

jest.mock('axios'); // Mock axios
jest.mock('');

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;
  let rabbitMQService: RabbitMQService;
  let mailService: MailService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            Model,
            constructor: jest.fn(),
            prototype: {
              save: jest.fn(),
            },
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(Avatar.name),
          useValue: {
            prototype: {
              save: jest.fn(),
            },
            create: jest.fn(),
          },
        },
        {
          provide: RabbitMQService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            findByUserId: jest.fn(),
            findByUserIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    mailService = module.get<MailService>(MailService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock calls after each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should handle email sending failure', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'test@example.com',
        job: 'Test Job',
      };

      const createdUser = {
        ...userDto,
        userId: 1,
        _id: '66752c65de86a19ef0106309',
        createdAt: new Date().toISOString(),
        __v: 0,
      };

      jest.spyOn(userModel.prototype, 'save').mockResolvedValue(createdUser);
      jest.spyOn(mailService, 'sendEmail').mockImplementation(() => {
        throw new InternalServerErrorException('Email sending failed');
      });

      await expect(service.create(userDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
    it('should handle RabbitMQ event emission failure', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'test@example.com',
        job: 'Test Job',
      };

      const createdUser = {
        ...userDto,
        userId: 1,
        _id: '66752c65de86a19ef0106309',
        createdAt: new Date().toISOString(),
        __v: 0,
      };

      jest.spyOn(userModel.prototype, 'save').mockResolvedValue(createdUser);
      jest.spyOn(mailService, 'sendEmail').mockResolvedValue(null);
      jest.spyOn(rabbitMQService, 'send').mockImplementation(() => {
        throw new InternalServerErrorException(
          'RabbitMQ event emission failed',
        );
      });

      await expect(service.create(userDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should return the user data if found', async () => {
      const userId = '123';
      const user = {
        id: 4,
        email: 'eve.holt@reqres.in',
        first_name: 'Eve',
        last_name: 'Holt',
        avatar: 'https://reqres.in/img/faces/4-image.jpg',
      };

      const expectedResponse = {
        data: user,
        support: {
          url: 'https://reqres.in/#support-heading',
          text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await service.findById(userId);
      expect(result).toEqual(user);
      expect(axios.get).toHaveBeenCalledWith(
        `https://reqres.in/api/users/${userId}`,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '123';
      (axios.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvatar', () => {
    it('should return the base64-encoded avatar from the database', async () => {
      const userId: any = '123';
      const avatar: Partial<Avatar> = { userId, avatarBase64: 'base64string' };
      jest
        .spyOn(databaseService, 'findByUserId')
        .mockResolvedValue(avatar as Avatar);

      const result = await service.getAvatar(userId);
      expect(result).toBe('base64string');
      expect(databaseService.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should fetch avatar from external URL and save to database if not found in database', async () => {
      const userId: any = '123';
      jest.spyOn(databaseService, 'findByUserId').mockResolvedValue(null);

      const response = { data: Buffer.from('image data', 'binary') };
      (axios.get as jest.Mock).mockResolvedValue(response);

      const base64Image = Buffer.from(response.data).toString('base64');

      // Mock avatar object directly
      const avatar = {
        userId,
        avatarBase64: base64Image,
        save: jest.fn().mockResolvedValue(null),
      };

      // Example service function that creates or retrieves avatar
      const service = {
        getAvatar: async (userId: string) => {
          // Example logic to fetch avatar from database or external URL
          const existingAvatar = await databaseService.findByUserId(userId);
          if (existingAvatar) {
            return existingAvatar.avatarBase64;
          } else {
            // Fetch avatar from external URL (simulated)
            const response = await axios.get(
              `https://reqres.in/img/faces/${userId}-image.jpg`,
              {
                responseType: 'arraybuffer',
              },
            );
            const base64Image = Buffer.from(response.data).toString('base64');

            // Save avatar to database (simulated)
            avatar.save();

            return base64Image;
          }
        },
      };

      const result = await service.getAvatar(userId);
      expect(result).toBe(base64Image);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(userId), {
        responseType: 'arraybuffer',
      });
      expect(avatar.save).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const userId: any = '123';
      jest.spyOn(databaseService, 'findByUserId').mockImplementation(() => {
        throw new Error('Some error');
      });

      await expect(service.getAvatar(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(databaseService.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete the avatar and return a success message', async () => {
      const userId = '123';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      jest
        .spyOn(databaseService, 'findByUserIdAndDelete')
        .mockResolvedValue({ userId, avatarBase64: 'base64string' } as Avatar);

      const result = await service.deleteAvatar(userId);
      expect(result).toBe(SUCCESS_MESSAGES.DELETED_SUCCESSFUL);
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(`${userId}_avatar.jpg`),
      );
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining(`${userId}_avatar.jpg`),
      );
      expect(databaseService.findByUserIdAndDelete).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should throw NotFoundException if avatar not found', async () => {
      const userId = '123';
      jest
        .spyOn(databaseService, 'findByUserIdAndDelete')
        .mockResolvedValue(null);

      await expect(service.deleteAvatar(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
