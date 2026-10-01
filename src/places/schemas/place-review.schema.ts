import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlaceReviewDocument = PlaceReview & Document;

@Schema({ collection: 'place_reviews', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class PlaceReview {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  place_key: string;

  @Prop({ required: true })
  place_name: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ default: null })
  destination: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  comment: string;

  @Prop({ default: false })
  liked: boolean;

  @Prop({ default: null })
  trip_id: string;

  created_at: Date;
  updated_at: Date;
}

export const PlaceReviewSchema = SchemaFactory.createForClass(PlaceReview);

// Un seul avis par voyageur et par lieu (modifiable)
PlaceReviewSchema.index({ place_key: 1, user_id: 1 }, { unique: true });
PlaceReviewSchema.index({ place_key: 1, updated_at: -1 });
