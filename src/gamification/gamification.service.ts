import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProfileSchema } from './schemas/profile.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { TenancyService } from '../tenancy/tenancy.service';

const XP_ACTIONS: Record<string, number> = {
  generate_trip: 50,
  first_swipe: 10,
  share_trip: 20,
};

const ONE_TIME_ACTIONS = ['first_swipe'];

import { GLOBAL_DB_CONNECTION } from '../common/constants';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<UserDocument>,
    private readonly tenancyService: TenancyService,
  ) {}

  async getProfile(user_id: string): Promise<object> {
    // Get profile from user's own tenant DB
    const ProfileModel = await this.tenancyService.getTenantModel<any>(
      user_id,
      'Profile',
      ProfileSchema,
    );

    let profile = await ProfileModel.findOne({ user_id }).lean().exec();
    const user = await this.userModel.findOne({ user_id }).lean().exec();

    // 1. If not found in user's tenant DB, check legacy shared DB
    if (!profile) {
      try {
        const LegacyProfileModel = await this.tenancyService.getTenantModel<any>(
          'default',
          'Profile',
          ProfileSchema,
        );
        const legacyProfile = await LegacyProfileModel.findOne({ user_id }).lean().exec();
        if (legacyProfile) {
          const newDoc = await ProfileModel.create({
            user_id,
            tenant_id: user_id,
            xp: legacyProfile.xp || 0,
            level: legacyProfile.level || 1,
            streak: legacyProfile.streak || 0,
            badges: legacyProfile.badges || [],
            trips_count: legacyProfile.trips_count || 0,
            last_active: legacyProfile.last_active || new Date(),
          });
          profile = newDoc.toObject ? newDoc.toObject() : newDoc;
          this.logger.log(`Migrated legacy profile to tenant DB for user: ${user_id}`);
        }
      } catch (err) {
        this.logger.warn(`Could not check legacy profile for ${user_id}: ${err.message}`);
      }
    }

    // 2. If still no profile, auto-create initial profile in user's tenant DB
    if (!profile) {
      const created = await ProfileModel.create({
        user_id,
        tenant_id: user_id,
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
        trips_count: 0,
        last_active: new Date(),
      });
      profile = created.toObject ? created.toObject() : created;
      this.logger.log(`Auto-created initial profile in tenant DB for user: ${user_id}`);
    }

    return {
      user_id,
      name: user?.name || 'Voyageur',
      pseudo: user?.pseudo || null,
      avatar_emoji: user?.avatar_emoji || null,
      country: user?.country || null,
      city: user?.city || null,
      is_pro: user?.is_pro || false,
      pro_tier: user?.pro_tier || null,
      xp: profile.xp ?? 0,
      level: profile.level ?? 1,
      streak: profile.streak ?? 0,
      badges: profile.badges ?? [],
      trips_count: profile.trips_count ?? 0,
      last_active: profile.last_active ?? new Date(),
      user: user
        ? {
            name: user.name,
            pseudo: user.pseudo || null,
            avatar_emoji: user.avatar_emoji || null,
            picture: user.picture || null,
            is_pro: user.is_pro || false,
          }
        : null,
    };
  }

  async awardXP(user_id: string, action: string): Promise<object> {
    const xpAmount = XP_ACTIONS[action];
    if (xpAmount === undefined) {
      throw new BadRequestException(`Unknown XP action: ${action}`);
    }

    // Get profile model from user's tenant DB
    const ProfileModel = await this.tenancyService.getTenantModel<any>(
      user_id,
      'Profile',
      ProfileSchema,
    );

    let profile = await ProfileModel.findOne({ user_id }).exec();
    if (!profile) {
      profile = await ProfileModel.create({
        user_id,
        tenant_id: user_id,
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
        trips_count: 0,
        last_active: new Date(),
      });
    }

    // One-time actions: don't award if badge already exists
    if (ONE_TIME_ACTIONS.includes(action) && profile.badges.includes(action)) {
      return {
        user_id,
        xp: profile.xp,
        level: profile.level,
        streak: profile.streak,
        badges: profile.badges,
        trips_count: profile.trips_count,
        message: 'XP already awarded for this one-time action',
      };
    }

    const newXp = profile.xp + xpAmount;
    const newLevel = Math.floor(newXp / 100) + 1;

    const updateFields: any = {
      xp: newXp,
      level: newLevel,
      last_active: new Date(),
    };

    // Award badge for first_swipe action
    if (action === 'first_swipe' && !profile.badges.includes('first_swipe')) {
      await ProfileModel.updateOne(
        { user_id },
        {
          $set: updateFields,
          $addToSet: { badges: 'first_swipe' },
        },
      ).exec();
    } else {
      await ProfileModel.updateOne({ user_id }, { $set: updateFields }).exec();
    }

    const updated = await ProfileModel.findOne({ user_id }).lean().exec();
    return {
      user_id,
      xp: updated.xp,
      level: updated.level,
      streak: updated.streak,
      badges: updated.badges,
      trips_count: updated.trips_count,
      xp_awarded: xpAmount,
    };
  }

  getXpRewards(): object {
    return {
      actions: [
        { action: 'generate_trip', xp: 50, description: 'Générer un itinéraire' },
        { action: 'first_swipe', xp: 10, description: 'Premier swipe' },
        { action: 'share_trip', xp: 20, description: 'Partager un voyage' },
      ],
      levels: [
        { level: 1, title: 'Voyageur Débutant', min_xp: 0, reward: null },
        { level: 5, title: 'Aventurier', min_xp: 400, reward: 'Badge Globe-trotter' },
        { level: 10, title: 'Explorateur', min_xp: 900, reward: '1 mois Pro offert' },
        { level: 20, title: 'Globe-trotter', min_xp: 1900, reward: '3 mois Pro offerts' },
        { level: 30, title: 'Voyageur Élite', min_xp: 2900, reward: '6 mois Pro offerts' },
        { level: 50, title: 'Légende Voyago', min_xp: 4900, reward: '1 an Pro offert' },
      ],
    };
  }

  getBadges(): object[] {
    return [
      { id: 'first_swipe', title: 'Premier Swipe', description: "Tu as sélectionné tes premières envies de voyage", emoji: '👆', xp_reward: 10 },
      { id: 'first_trip', title: 'Premier Voyage', description: "Tu as généré ton premier itinéraire", emoji: '✈️', xp_reward: 25 },
      { id: 'globe_trotter', title: 'Globe-trotter', description: '5 voyages générés', emoji: '🌍', xp_reward: 50 },
      { id: 'explorateur', title: 'Explorateur', description: '10 voyages générés', emoji: '🗺️', xp_reward: 100 },
      { id: 'en_feu', title: 'En Feu', description: '3 jours de streak', emoji: '🔥', xp_reward: 30 },
      { id: 'voyago_pro', title: 'Voyago Pro', description: 'Membre Pro Voyago', emoji: '💎', xp_reward: 0 },
    ];
  }
}
