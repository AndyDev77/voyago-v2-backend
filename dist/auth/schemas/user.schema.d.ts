import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    user_id: string;
    auth_provider: string;
    email: string;
    name: string;
    picture: string;
    pseudo: string;
    avatar_emoji: string;
    date_of_birth: string;
    country: string;
    city: string;
    password_hash: string;
    is_pro: boolean;
    pro_tier: string;
    pro_expires_at: Date;
    created_at: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
