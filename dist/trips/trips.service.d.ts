import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { ProfileDocument } from '../gamification/schemas/profile.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { GenerateTripDto } from './dto/generate-trip.dto';
export declare class TripsService {
    private readonly tripModel;
    private readonly profileModel;
    private readonly userModel;
    private readonly configService;
    private anthropic;
    constructor(tripModel: Model<TripDocument>, profileModel: Model<ProfileDocument>, userModel: Model<UserDocument>, configService: ConfigService);
    getUserTrips(user_id: string): Promise<Trip[]>;
    getTripById(trip_id: string): Promise<Trip>;
    private fetchWikipediaImage;
    private fetchWeather;
    private generatePoisWithClaude;
    private awardBadges;
    generateTrip(user: UserDocument, dto: GenerateTripDto): Promise<Trip>;
}
