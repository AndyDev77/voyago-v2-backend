import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ collection: 'payment_transactions' })
export class PaymentTransaction {
  @Prop({ required: true, unique: true })
  session_id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  tier: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ default: 'initiated' })
  status: string;

  @Prop({ default: 'unpaid' })
  payment_status: string;

  @Prop({ default: false })
  applied: boolean;

  @Prop({ type: Object, default: {} })
  metadata: object;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
