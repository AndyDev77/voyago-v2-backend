import { Document } from 'mongoose';
export type UserSessionDocument = UserSession & Document;
export declare class UserSession {
    user_id: string;
    session_token: string;
    expires_at: Date;
    created_at: Date;
}
export declare const UserSessionSchema: import("mongoose").Schema<UserSession, import("mongoose").Model<UserSession, any, any, any, Document<unknown, any, UserSession, any, {}> & UserSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserSession, Document<unknown, {}, import("mongoose").FlatRecord<UserSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<UserSession> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
