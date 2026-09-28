import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Profile, ProfileDocument } from '../gamification/schemas/profile.schema';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Trip.name, TENANT_DB_CONNECTION) private readonly tripModel: Model<TripDocument>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name, TENANT_DB_CONNECTION) private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async getPublicFeed(): Promise<object[]> {
    const trips = await this.tripModel
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

    return trips.map((trip) => {
      const author = userMap.get(trip.user_id);
      return {
        ...trip,
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

    const profile = await this.profileModel.findOne({ user_id }).lean().exec();
    const trips = await this.tripModel
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
