import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Avatar } from 'src/user/schemas/avatar.schema';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Avatar.name) private avatarModel: Model<Avatar>,
  ) {}

  async findByUserId(userId: string): Promise<Avatar> {
    return this.avatarModel.findOne({ userId }).exec();
  }

  async findByUserIdAndDelete(userId: string): Promise<Avatar> {
    return this.avatarModel.findOneAndDelete({ userId }).exec();
  }
}
