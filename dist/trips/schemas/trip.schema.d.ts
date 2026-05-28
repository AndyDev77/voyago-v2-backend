import { Document } from 'mongoose';
export type TripDocument = Trip & Document;
export declare class POI {
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
export declare class DayWeather {
    date: string;
    weather_code: number;
    temp_max: number;
    temp_min: number;
    icon: string;
    summary: string;
}
export declare class Trip {
    id: string;
    user_id: string;
    destination: string;
    duration_days: number;
    pace: string;
    transports: string[];
    budget: string;
    interests: string[];
    pois: POI[];
    weather: DayWeather[];
    is_public: boolean;
    likes: number;
    created_at: Date;
}
export declare const TripSchema: import("mongoose").Schema<Trip, import("mongoose").Model<Trip, any, any, any, Document<unknown, any, Trip, any, {}> & Trip & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Trip, Document<unknown, {}, import("mongoose").FlatRecord<Trip>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Trip> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
