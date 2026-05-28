import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ collection: 'profiles' })
export class Profile {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ default: 0 })
  trips_count: number;

  @Prop({ default: Date.now })
  last_active: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
