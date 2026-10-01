import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommunityMemberDocument = CommunityMember & Document;

@Schema({ timestamps: { createdAt: 'joined_at', updatedAt: false } })
export class CommunityMember {
  @Prop({ required: true, index: true })
  circle_id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ default: 'explorer', enum: ['creator', 'admin', 'explorer'] })
  role: string;

  @Prop()
  joined_at: Date;
}

export const CommunityMemberSchema = SchemaFactory.createForClass(CommunityMember);
CommunityMemberSchema.index({ circle_id: 1, user_id: 1 }, { unique: true });
