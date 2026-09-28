import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Trip, TripDocument } from './schemas/trip.schema';
import { Profile, ProfileDocument } from '../gamification/schemas/profile.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { GenerateTripDto } from './dto/generate-trip.dto';
import { AiService } from '../ai/ai.service';
import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION, DEFAULT_TENANT_ID } from '../common/constants';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectModel(Trip.name, TENANT_DB_CONNECTION) private readonly tripModel: Model<TripDocument>,
    @InjectModel(Profile.name, TENANT_DB_CONNECTION) private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<UserDocument>,
    private readonly aiService: AiService,
  ) {}

  async getUserTrips(user_id: string, tenantId: string = DEFAULT_TENANT_ID): Promise<Trip[]> {
    return this.tripModel
      .find({
        user_id,
        ...(tenantId !== DEFAULT_TENANT_ID ? { tenant_id: tenantId } : {}),
      })
      .sort({ created_at: -1 })
      .exec();
  }

  async getTripById(trip_id: string): Promise<Trip> {
    const trip = await this.tripModel.findOne({ id: trip_id }).exec();
    if (!trip) {
      throw new NotFoundException(`Trip ${trip_id} not found`);
    }
    return trip;
  }

  private async awardBadges(profile: ProfileDocument): Promise<void> {
    const badgesToAward: string[] = [];

    if (!profile.badges.includes('first_swipe')) {
      badgesToAward.push('first_swipe');
    }

    if (profile.trips_count >= 1 && !profile.badges.includes('first_trip')) {
      badgesToAward.push('first_trip');
    }

    if (profile.trips_count >= 5 && !profile.badges.includes('globe_trotter')) {
      badgesToAward.push('globe_trotter');
    }

    if (profile.trips_count >= 10 && !profile.badges.includes('explorateur')) {
      badgesToAward.push('explorateur');
    }

    if (profile.streak >= 3 && !profile.badges.includes('en_feu')) {
      badgesToAward.push('en_feu');
    }

    if (badgesToAward.length > 0) {
      await this.profileModel
        .updateOne(
          { user_id: profile.user_id },
          { $addToSet: { badges: { $each: badgesToAward } } },
        )
        .exec();
    }
  }

  async generateTrip(user: UserDocument, dto: GenerateTripDto): Promise<Trip> {
    const tenantId = user.tenant_id || DEFAULT_TENANT_ID;

    // Check freemium limit: 3 trips per month for non-pro users
    if (!user.is_pro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const tripsThisMonth = await this.tripModel
        .countDocuments({
          user_id: user.user_id,
          created_at: { $gte: startOfMonth },
        })
        .exec();

      if (tripsThisMonth >= 3) {
        throw new HttpException(
          {
            statusCode: 402,
            message: 'Free plan limit reached. Upgrade to Pro for unlimited trips.',
            error: 'Payment Required',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    this.logger.log(`Generating trip for user ${user.user_id} (${user.name}) in ${dto.destination} [tenant: ${tenantId}]`);

    // 1. Generate POIs with AI (Gemini or Claude with smart fallback)
    const rawPois = await this.aiService.generatePois(dto);

    // 2. Fetch Wikipedia images and weather in parallel for top performance
    const firstValidPoi = rawPois.find((p) => p.lat !== 0 && p.lng !== 0);
    const lat = firstValidPoi?.lat ?? 48.8566;
    const lng = firstValidPoi?.lng ?? 2.3522;

    const [poisWithImages, weather] = await Promise.all([
      Promise.all(
        rawPois.map(async (poi) => {
          const imageUrl = poi.image_url || (await this.aiService.fetchWikipediaImage(poi.image_query || poi.name));
          return { ...poi, image_url: imageUrl };
        }),
      ),
      this.aiService.fetchWeather(lat, lng, dto.duration_days),
    ]);

    // 3. Create trip document
    const tripId = uuidv4();
    const trip = await this.tripModel.create({
      id: tripId,
      user_id: user.user_id,
      tenant_id: tenantId,
      destination: dto.destination,
      duration_days: dto.duration_days,
      pace: dto.pace,
      transports: dto.transports,
      budget: dto.budget,
      interests: dto.interests,
      pois: poisWithImages,
      weather,
      is_public: true,
      likes: 0,
      created_at: new Date(),
    });

    // 4. Update profile: award XP, increment trips_count, check badges
    const profile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
    if (profile) {
      const newXp = profile.xp + 50;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newTripsCount = profile.trips_count + 1;

      await this.profileModel
        .updateOne(
          { user_id: user.user_id },
          {
            $set: {
              xp: newXp,
              level: newLevel,
              trips_count: newTripsCount,
              last_active: new Date(),
              tenant_id: tenantId,
            },
          },
        )
        .exec();

      const updatedProfile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
      if (updatedProfile) {
        await this.awardBadges(updatedProfile);
      }
    }

    return trip;
  }
}
