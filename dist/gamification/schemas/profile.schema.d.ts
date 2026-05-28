import { Document } from 'mongoose';
export type ProfileDocument = Profile & Document;
export declare class Profile {
    user_id: string;
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    trips_count: number;
    last_active: Date;
}
export declare const ProfileSchema: import("mongoose").Schema<Profile, import("mongoose").Model<Profile, any, any, any, Document<unknown, any, Profile, any, {}> & Profile & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Profile, Document<unknown, {}, import("mongoose").FlatRecord<Profile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Profile> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
