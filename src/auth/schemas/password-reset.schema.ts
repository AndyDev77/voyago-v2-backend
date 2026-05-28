import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PasswordResetDocument = PasswordReset & Document;

@Schema({ collection: 'password_resets' })
export class PasswordReset {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  code_hash: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
