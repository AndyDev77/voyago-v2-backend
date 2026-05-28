import { Model } from 'mongoose';
import { ProfileDocument } from './schemas/profile.schema';
import { UserDocument } from '../auth/schemas/user.schema';
export declare class GamificationService {
    private readonly profileModel;
    private readonly userModel;
    constructor(profileModel: Model<ProfileDocument>, userModel: Model<UserDocument>);
    getProfile(user_id: string): Promise<object>;
    awardXP(user_id: string, action: string): Promise<object>;
    getXpRewards(): object;
    getBadges(): object[];
}
