import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ required: true, enum: ['email', 'google', 'guest'] })
  auth_provider: string;

  @Prop({ sparse: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  picture: string;

  @Prop()
  pseudo: string;

  @Prop()
  avatar_emoji: string;

  @Prop()
  date_of_birth: string;

  @Prop()
  country: string;

  @Prop()
  city: string;

  @Prop()
  password_hash: string;

  @Prop({ default: false })
  is_pro: boolean;

  @Prop({ default: null })
  pro_tier: string;

  @Prop({ default: null })
  pro_expires_at: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
