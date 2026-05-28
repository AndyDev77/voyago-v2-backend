import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { PaymentTransactionDocument } from './schemas/payment-transaction.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { ProfileDocument } from '../gamification/schemas/profile.schema';
export declare class ProService {
    private readonly transactionModel;
    private readonly userModel;
    private readonly profileModel;
    private readonly configService;
    private stripe;
    constructor(transactionModel: Model<PaymentTransactionDocument>, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>, configService: ConfigService);
    getTiers(): object[];
    createCheckout(user: UserDocument, tier: string): Promise<{
        checkout_url: string;
        session_id: string;
    }>;
    pollPaymentStatus(session_id: string): Promise<{
        status: string;
        payment_status: string;
        applied: boolean;
    }>;
    applyProStatus(user_id: string, tier: string, session_id: string): Promise<void>;
    getProStatus(user: UserDocument): Promise<object>;
}
