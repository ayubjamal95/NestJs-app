import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            findById: jest.fn().mockResolvedValue({}),
            getAvatar: jest.fn().mockResolvedValue('base64string'),
            deleteAvatar: jest.fn().mockResolvedValue('Deleted successfully'),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should call userService.create with the correct parameters', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'test@example.com',
        job: 'Test Job',
      };
      await controller.createUser(userDto);
      expect(service.create).toHaveBeenCalledWith(userDto);
    });
  });

  describe('findById', () => {
    it('should call userService.findById with the correct parameters', async () => {
      const userId = '123';
      await controller.findById(userId);
      expect(service.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getAvatar', () => {
    it('should call userService.getAvatar with the correct parameters', async () => {
      const userId = '123';
      await controller.getAvatar(userId);
      expect(service.getAvatar).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteAvatar', () => {
    it('should call userService.deleteAvatar with the correct parameters', async () => {
      const userId = '123';
      await controller.deleteAvatar(userId);
      expect(service.deleteAvatar).toHaveBeenCalledWith(userId);
    });
  });
});
