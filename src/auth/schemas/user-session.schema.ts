import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema({ collection: 'user_sessions' })
export class UserSession {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, unique: true })
  session_token: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
