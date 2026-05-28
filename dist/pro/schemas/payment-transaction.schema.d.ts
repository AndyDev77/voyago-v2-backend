import { Document } from 'mongoose';
export type PaymentTransactionDocument = PaymentTransaction & Document;
export declare class PaymentTransaction {
    session_id: string;
    user_id: string;
    tier: string;
    amount: number;
    currency: string;
    status: string;
    payment_status: string;
    applied: boolean;
    metadata: object;
    created_at: Date;
    updated_at: Date;
}
export declare const PaymentTransactionSchema: import("mongoose").Schema<PaymentTransaction, import("mongoose").Model<PaymentTransaction, any, any, any, Document<unknown, any, PaymentTransaction, any, {}> & PaymentTransaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PaymentTransaction, Document<unknown, {}, import("mongoose").FlatRecord<PaymentTransaction>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PaymentTransaction> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
