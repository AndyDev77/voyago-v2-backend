import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserXpActionDocument = UserXpAction & Document;

@Schema({ collection: 'user_xp_actions', timestamps: true })
export class UserXpAction {
  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ default: 'default' })
  tenant_id: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, default: 0 })
  xp: number;

  @Prop({ default: 1 })
  count: number;

  @Prop({ default: true })
  completed: boolean;

  @Prop({ default: Date.now })
  completed_at: Date;
}

export const UserXpActionSchema = SchemaFactory.createForClass(UserXpAction);
UserXpActionSchema.index({ user_id: 1, action: 1 }, { unique: true });
UserXpActionSchema.index({ tenant_id: 1 });
