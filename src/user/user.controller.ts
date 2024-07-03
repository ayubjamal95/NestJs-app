import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  async createUser(@Body(new ValidationPipe()) userDto: UserDto) {
    return this.userService.create(userDto);
  }

  @Get('user/:userId')
  async findById(@Param('userId') userId: string) {
    return this.userService.findById(userId);
  }

  @Get('user/:userId/avatar')
  async getAvatar(@Param('userId') userId: string) {
    return this.userService.getAvatar(userId);
  }

  @Delete('user/:userId/avatar')
  async deleteAvatar(@Param('userId') userId: string) {
    return this.userService.deleteAvatar(userId);
  }
}
