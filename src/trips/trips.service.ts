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

import { Trip, TripDocument, TripSchema } from './schemas/trip.schema';
import { ProfileSchema } from '../gamification/schemas/profile.schema';
import { UserXpActionSchema } from '../gamification/schemas/user-xp-action.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { GenerateTripDto } from './dto/generate-trip.dto';
import { AiService } from '../ai/ai.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    // Static TENANT_DB connection — used for community feed (public trips mirror)
    @InjectModel(Trip.name, TENANT_DB_CONNECTION) private readonly sharedTripModel: Model<TripDocument>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<UserDocument>,
    private readonly aiService: AiService,
    private readonly tenancyService: TenancyService,
  ) {}

  async getUserTrips(user_id: string): Promise<Trip[]> {
    // Read from the user's own tenant database
    const TripModel = await this.tenancyService.getTenantModel<TripDocument>(
      user_id,
      'Trip',
      TripSchema,
    );

    let trips = await TripModel.find({ user_id }).sort({ created_at: -1 }).exec();

    // If no trips in tenant DB yet, check legacy shared DB
    if (!trips || trips.length === 0) {
      try {
        const legacyTrips = await this.sharedTripModel.find({ user_id }).sort({ created_at: -1 }).exec();
        if (legacyTrips && legacyTrips.length > 0) {
          this.logger.log(`Found ${legacyTrips.length} legacy trips for user ${user_id}, migrating to tenant DB...`);
          for (const lt of legacyTrips) {
            const tripData = lt.toObject ? lt.toObject() : { ...lt };
            delete tripData._id;
            delete tripData.__v;
            tripData.tenant_id = user_id;
            try {
              await TripModel.create(tripData);
            } catch (err) {
              // ignore duplicate key errors if already exists
            }
          }
          trips = await TripModel.find({ user_id }).sort({ created_at: -1 }).exec();
        }
      } catch (err) {
        this.logger.warn(`Could not check legacy trips for ${user_id}: ${err.message}`);
      }
    }

    // Assurer que chaque voyage affiche l'édifice / monument réel de son pays
    const verifiedTrips = await Promise.all(
      trips.map(async (t) => {
        const tripObj = t.toObject ? t.toObject() : t;
        const isParisBridge =
          tripObj.pois?.[0]?.image_url?.includes('photo-1499856871958-5b9627545d1a') ||
          tripObj.cover_image_url?.includes('photo-1499856871958-5b9627545d1a');
        const isNotParis = !tripObj.destination?.toLowerCase().includes('paris');
        const lacksCover = !tripObj.cover_image_url || tripObj.cover_image_url.trim() === '';

        if ((isParisBridge && isNotParis) || lacksCover) {
          try {
            const monument = await this.aiService.resolveCountryMonument(
              tripObj.destination,
              tripObj.country,
              tripObj.city,
            );
            tripObj.cover_image_url = monument.imageUrl;
            if (tripObj.pois && tripObj.pois.length > 0) {
              if (isParisBridge || !tripObj.pois[0].image_url) {
                tripObj.pois[0].image_url = monument.imageUrl;
              }
            }
            TripModel.updateOne(
              { id: tripObj.id },
              { $set: { cover_image_url: monument.imageUrl, 'pois.0.image_url': monument.imageUrl } },
            ).exec().catch(() => {});
          } catch (_) {}
        }
        return tripObj;
      }),
    );

    return verifiedTrips;
  }

  async getTripById(trip_id: string, user_id?: string): Promise<Trip> {
    let trip: any = null;
    let model: any = null;

    // If we have a user_id, look in their tenant DB first
    if (user_id) {
      const TripModel = await this.tenancyService.getTenantModel<TripDocument>(
        user_id,
        'Trip',
        TripSchema,
      );
      model = TripModel;
      trip = await TripModel.findOne({ id: trip_id }).exec();
    }

    // Fallback: look in shared DB (for community/public trips)
    if (!trip) {
      model = this.sharedTripModel;
      trip = await this.sharedTripModel.findOne({ id: trip_id }).exec();
    }

    if (!trip) {
      throw new NotFoundException(`Trip ${trip_id} not found`);
    }

    const tripObj = trip.toObject ? trip.toObject() : trip;
    const isParisBridge =
      tripObj.pois?.[0]?.image_url?.includes('photo-1499856871958-5b9627545d1a') ||
      tripObj.cover_image_url?.includes('photo-1499856871958-5b9627545d1a');
    const isNotParis = !tripObj.destination?.toLowerCase().includes('paris');
    const lacksCover = !tripObj.cover_image_url || tripObj.cover_image_url.trim() === '';

    if ((isParisBridge && isNotParis) || lacksCover) {
      try {
        const monument = await this.aiService.resolveCountryMonument(
          tripObj.destination,
          tripObj.country,
          tripObj.city,
        );
        tripObj.cover_image_url = monument.imageUrl;
        if (tripObj.pois && tripObj.pois.length > 0) {
          if (isParisBridge || !tripObj.pois[0].image_url) {
            tripObj.pois[0].image_url = monument.imageUrl;
          }
        }
        if (model) {
          model.updateOne(
            { id: trip_id },
            { $set: { cover_image_url: monument.imageUrl, 'pois.0.image_url': monument.imageUrl } },
          ).exec().catch(() => {});
        }
      } catch (_) {}
    }

    return tripObj;
  }

  private async awardBadges(ProfileModel: Model<any>, profile: any): Promise<void> {
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
      await ProfileModel.updateOne(
        { user_id: profile.user_id },
        { $addToSet: { badges: { $each: badgesToAward } } },
      ).exec();
    }
  }

  async generateTrip(user: UserDocument, dto: GenerateTripDto): Promise<Trip> {
    const tenantId = user.user_id; // Multi-DB: tenant = user

    // Get tenant-specific models
    const TripModel = await this.tenancyService.getTenantModel<TripDocument>(
      tenantId,
      'Trip',
      TripSchema,
    );
    const ProfileModel = await this.tenancyService.getTenantModel<any>(
      tenantId,
      'Profile',
      ProfileSchema,
    );

    // Check freemium limit: 3 trips per month for non-pro users
    if (!user.is_pro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const tripsThisMonth = await TripModel.countDocuments({
        user_id: user.user_id,
        created_at: { $gte: startOfMonth },
      }).exec();

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
    const tripDto: GenerateTripDto = {
      ...dto,
      thermal_sensitivity: dto.thermal_sensitivity || user.thermal_sensitivity || 'balanced',
    };
    const rawPois = await this.aiService.generatePois(tripDto);

    // 2. Résoudre le monument ou l'édifice emblématique du pays via IA & Wikimedia
    const parts = dto.destination.split(',').map((s) => s.trim());
    const derivedCity = dto.city || (parts.length > 0 ? parts[0] : dto.destination);
    const derivedCountry = dto.country || (parts.length > 1 ? parts.slice(1).join(', ') : undefined);

    const monument = await this.aiService.resolveCountryMonument(
      dto.destination,
      derivedCountry,
      derivedCity,
    );

    const firstValidPoi = rawPois.find((p) => p.lat !== 0 && p.lng !== 0);
    const lat = firstValidPoi?.lat ?? 48.8566;
    const lng = firstValidPoi?.lng ?? 2.3522;

    const [poisWithImages, weather] = await Promise.all([
      Promise.all(
        rawPois.map(async (poi, idx) => {
          // Jour 1, Premier lieu : Toujours le monument / édifice emblématique résolu
          if (idx === 0) {
            return { ...poi, image_url: monument.imageUrl };
          }
          const isStaticPlaceholder =
            poi.image_url &&
            (poi.image_url.includes('photo-1499856871958-5b9627545d1a') ||
             poi.image_url.includes('photo-1550966871-3ed3cdb5ed0c') ||
             poi.image_url.includes('photo-1502602898657-3e91760cbb34') ||
             poi.image_url.includes('photo-1544816155-12df9643f363') ||
             poi.image_url.includes('photo-1514933651103-005eec06c04b') ||
             poi.image_url.includes('photo-1540555700478-4be289fbecef') ||
             poi.image_url.includes('photo-1483985988355-763728e1935b') ||
             poi.image_url.includes('photo-1486406146926-c627a92ad1ab') ||
             poi.image_url.includes('photo-1488646953014-85cb44e25828'));

          let imageUrl = poi.image_url;
          if (!imageUrl || isStaticPlaceholder) {
            const query = poi.image_query || `${poi.name} ${dto.destination}`;
            imageUrl = await this.aiService.fetchWikipediaImage(query, monument.imageUrl);
          }
          return { ...poi, image_url: imageUrl || monument.imageUrl };
        }),
      ),
      this.aiService.fetchWeather(lat, lng, dto.duration_days, dto.start_date),
    ]);

    // 3. Create trip document in user's tenant DB
    const tripId = uuidv4();

    const tripData = {
      id: tripId,
      user_id: user.user_id,
      tenant_id: tenantId,
      destination: dto.destination,
      city: derivedCity,
      country: derivedCountry,
      country_code: dto.country_code,
      cover_image_url: monument.imageUrl,
      start_date: dto.start_date,
      end_date: dto.end_date,
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
    };

    const trip = await TripModel.create(tripData);

    // 4. Mirror to shared DB for community feed (public trips only)
    if (tripData.is_public) {
      try {
        await this.sharedTripModel.create(tripData);
      } catch (err) {
        this.logger.warn(`Failed to mirror trip to shared DB (non-blocking): ${err.message}`);
      }
    }

    // 5. Update profile in user's tenant DB: award XP, increment trips_count, check badges
    const profile = await ProfileModel.findOne({ user_id: user.user_id }).exec();
    if (profile) {
      const isFirst = (profile.trips_count || 0) === 0;
      const tripXp = isFirst ? 7 : 3;
      const newXp = (profile.xp || 0) + tripXp;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newTripsCount = (profile.trips_count || 0) + 1;

      await ProfileModel.updateOne(
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
      ).exec();

      // Enregistrer l'action dans user_xp_actions (anti-triche & cohérence de collection)
      try {
        const ActionModel = await this.tenancyService.getTenantModel<any>(
          user.user_id,
          'UserXpAction',
          UserXpActionSchema,
        );
        const actionKey = isFirst ? 'first_trip' : 'generate_trip';
        await ActionModel.findOneAndUpdate(
          { user_id: user.user_id, action: actionKey },
          {
            $set: {
              user_id: user.user_id,
              tenant_id: tenantId,
              action: actionKey,
              xp: tripXp,
              completed: true,
              completed_at: new Date(),
            },
            $inc: { count: 1 },
          },
          { upsert: true },
        ).exec();
      } catch (err: any) {
        this.logger.warn(`Could not sync trip to user_xp_actions: ${err.message}`);
      }

      const updatedProfile = await ProfileModel.findOne({ user_id: user.user_id }).exec();
      if (updatedProfile) {
        await this.awardBadges(ProfileModel, updatedProfile);
      }
    }

    return trip;
  }
}
