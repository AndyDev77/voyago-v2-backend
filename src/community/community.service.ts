import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { ProfileSchema } from '../gamification/schemas/profile.schema';
import { TenancyService } from '../tenancy/tenancy.service';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    // Shared/community trip mirror — reads public trips from voyago_tenants
    @InjectModel(Trip.name, TENANT_DB_CONNECTION) private readonly sharedTripModel: Model<TripDocument>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<UserDocument>,
    private readonly tenancyService: TenancyService,
  ) {}

  async getPublicFeed(): Promise<object[]> {
    // Read public trips from shared/mirrored DB
    const trips = await this.sharedTripModel
      .find({ is_public: true })
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
      .exec();

    const userIds = [...new Set(trips.map((t) => t.user_id))];
    const users = await this.userModel
      .find({ user_id: { $in: userIds } })
      .lean()
      .exec();

    const userMap = new Map(users.map((u) => [u.user_id, u]));

    return trips.map((trip: any) => {
      const author = userMap.get(trip.user_id);
      const cover = trip.cover_image_url || trip.pois?.[0]?.image_url || null;
      return {
        ...trip,
        cover_image_url: cover,
        author: author
          ? {
              user_id: author.user_id,
              name: author.name,
              pseudo: author.pseudo || null,
              avatar_emoji: author.avatar_emoji || null,
              is_pro: author.is_pro || false,
            }
          : null,
      };
    });
  }

  async getUserPublicProfile(user_id: string): Promise<object> {
    const user = await this.userModel.findOne({ user_id }).lean().exec();
    if (!user) {
      throw new NotFoundException(`User ${user_id} not found`);
    }

    // Get profile from the user's own tenant DB
    let profile: any = null;
    try {
      const ProfileModel = await this.tenancyService.getTenantModel<any>(
        user_id,
        'Profile',
        ProfileSchema,
      );
      profile = await ProfileModel.findOne({ user_id }).lean().exec();
    } catch (err) {
      this.logger.warn(`Could not fetch profile for ${user_id}: ${err.message}`);
    }

    // Get public trips from shared DB
    const trips = await this.sharedTripModel
      .find({ user_id, is_public: true })
      .sort({ created_at: -1 })
      .lean()
      .exec();

    return {
      user: {
        user_id: user.user_id,
        name: user.name,
        pseudo: user.pseudo || null,
        avatar_emoji: user.avatar_emoji || null,
        picture: user.picture || null,
        is_pro: user.is_pro || false,
        created_at: user.created_at,
      },
      profile: profile
        ? {
            xp: profile.xp,
            level: profile.level,
            streak: profile.streak,
            badges: profile.badges,
            trips_count: profile.trips_count,
          }
        : null,
      trips,
    };
  }
}
