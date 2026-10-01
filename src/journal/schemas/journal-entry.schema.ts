import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JournalEntryDocument = JournalEntry & Document;

export class JournalPhoto {
  url: string;
  key: string;
}

/** Souvenir d'un lieu visité (base du voyageur). */
@Schema({ collection: 'journal_entries', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class JournalEntry {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  trip_id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  poi_name: string;

  @Prop({ required: true })
  day: number;

  @Prop({ default: '' })
  note: string;

  @Prop({ type: [String], default: [] })
  mood_tags: string[];

  @Prop({ type: [Object], default: [] })
  photos: JournalPhoto[];

  @Prop({ default: false })
  visited: boolean;

  @Prop({ type: Date, default: null })
  visited_at: Date | null;

  created_at: Date;
  updated_at: Date;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);
JournalEntrySchema.index({ trip_id: 1, poi_name: 1 }, { unique: true });
