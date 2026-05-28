import { Document } from 'mongoose';
export type PasswordResetDocument = PasswordReset & Document;
export declare class PasswordReset {
    email: string;
    user_id: string;
    code_hash: string;
    expires_at: Date;
    attempts: number;
    created_at: Date;
}
export declare const PasswordResetSchema: import("mongoose").Schema<PasswordReset, import("mongoose").Model<PasswordReset, any, any, any, Document<unknown, any, PasswordReset, any, {}> & PasswordReset & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PasswordReset, Document<unknown, {}, import("mongoose").FlatRecord<PasswordReset>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PasswordReset> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
