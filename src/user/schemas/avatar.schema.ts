import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Avatar' })
export class Avatar extends Document {
  @Prop()
  userId: string;

  @Prop()
  avatarBase64: string;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
