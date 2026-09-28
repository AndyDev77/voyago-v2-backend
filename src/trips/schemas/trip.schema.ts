import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TripDocument = Trip & Document;

export class POI {
  name: string;
  description: string;
  lat: number;
  lng: number;
  day: number;
  order: number;
  duration_minutes: number;
  category: string;
  image_query: string;
  image_url: string | null;
}

export class DayWeather {
  date: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
  icon: string;
  summary: string;
}

@Schema({ collection: 'trips' })
export class Trip {
  @Prop({ required: true })
  id: string;

  @Prop({ default: 'default' })
  tenant_id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ required: true })
  duration_days: number;

  @Prop({ required: true })
  pace: string;

  @Prop({ type: [String], default: [] })
  transports: string[];

  @Prop({ required: true })
  budget: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [Object], default: [] })
  pois: POI[];

  @Prop({ type: [Object], default: [] })
  weather: DayWeather[];

  @Prop({ default: true })
  is_public: boolean;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

// Explicit Indexes
TripSchema.index({ id: 1 }, { unique: true });
TripSchema.index({ tenant_id: 1 });
TripSchema.index({ user_id: 1 });
TripSchema.index({ user_id: 1, tenant_id: 1 });
TripSchema.index({ is_public: 1, created_at: -1 });
TripSchema.index({ tenant_id: 1, is_public: 1, created_at: -1 });
TripSchema.index({ destination: 1 });
