import { Model } from 'mongoose';
import { TripDocument } from '../trips/schemas/trip.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { ProfileDocument } from '../gamification/schemas/profile.schema';
export declare class CommunityService {
    private readonly tripModel;
    private readonly userModel;
    private readonly profileModel;
    constructor(tripModel: Model<TripDocument>, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>);
    getPublicFeed(): Promise<object[]>;
    getUserPublicProfile(user_id: string): Promise<object>;
}
