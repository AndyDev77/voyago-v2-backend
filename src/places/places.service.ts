import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PlaceReview, PlaceReviewDocument } from './schemas/place-review.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { ReviewPlaceDto } from './dto/review-place.dto';
import { PlaceRefDto } from './dto/place-stats.dto';
import { placeKey } from './place-key';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GLOBAL_DB_CONNECTION } from '../common/constants';

export interface PlaceStats {
  place_key: string;
  rating_avg: number | null;
  reviews_count: number;
  likes_count: number;
  my_rating: number | null;
  my_liked: boolean;
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(
    @InjectModel(PlaceReview.name, GLOBAL_DB_CONNECTION)
    private readonly reviewModel: Model<PlaceReviewDocument>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION)
    private readonly userModel: Model<UserDocument>,
    private readonly gamificationService: GamificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Crée ou met à jour l'avis du voyageur sur un lieu, puis renvoie les stats à jour. */
  async review(userId: string, dto: ReviewPlaceDto) {
    const key = placeKey(dto.place_name, dto.lat, dto.lng);
    const existing = await this.reviewModel.exists({ place_key: key, user_id: userId }).exec();

    const review: any = await this.reviewModel
      .findOneAndUpdate(
        { place_key: key, user_id: userId },
        {
          // Seuls les champs envoyés sont modifiés : changer la note ne doit pas
          // effacer le commentaire ou le like déjà donnés
          $set: {
            place_name: dto.place_name.trim(),
            lat: dto.lat,
            lng: dto.lng,
            rating: dto.rating,
            ...(dto.comment !== undefined ? { comment: dto.comment.trim() } : {}),
            ...(dto.liked !== undefined ? { liked: dto.liked } : {}),
            ...(dto.destination ? { destination: dto.destination } : {}),
            ...(dto.trip_id ? { trip_id: dto.trip_id } : {}),
          },
          $setOnInsert: {
            id: uuidv4(),
            place_key: key,
            user_id: userId,
            ...(dto.comment === undefined ? { comment: '' } : {}),
            ...(dto.liked === undefined ? { liked: false } : {}),
          },
        },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    const isNew = !existing;
    let gamification: any = null;
    if (isNew) {
      // XP uniquement au premier avis sur un lieu (anti-triche : modifier un avis ne rapporte rien)
      try {
        gamification = await this.gamificationService.awardXP(userId, 'review_place');
      } catch (err: any) {
        this.logger.warn(`XP avis non attribuée à ${userId}: ${err.message}`);
      }
    }

    // La demande d'avis liée à ce lieu est traitée
    this.notificationsService.resolveArrivalForPlace(userId, key).catch(() => {});

    const [stats] = await this.statsForKeys([key], userId);
    return {
      review: this.toReviewDto(review),
      stats,
      is_new: isNew,
      gamification,
    };
  }

  /** Stats agrégées pour une liste de lieux (même ordre que la requête). */
  async statsForPlaces(places: PlaceRefDto[], userId?: string): Promise<{ stats: PlaceStats[] }> {
    if (places.length > 60) throw new BadRequestException('60 lieux maximum par requête');
    const keys = places.map((p) => placeKey(p.name, p.lat, p.lng));
    return { stats: await this.statsForKeys(keys, userId) };
  }

  async latestReviews(name: string, lat: number, lng: number, limit = 10) {
    if (!name || isNaN(lat) || isNaN(lng)) throw new BadRequestException('name, lat et lng sont requis');
    const key = placeKey(name, lat, lng);
    const safeLimit = Math.min(Math.max(limit || 10, 1), 50);

    const reviews: any[] = await this.reviewModel
      .find({ place_key: key })
      .sort({ updated_at: -1 })
      .limit(safeLimit)
      .lean()
      .exec();

    const users = await this.userModel
      .find({ user_id: { $in: [...new Set(reviews.map((r) => r.user_id))] } })
      .select('user_id name pseudo avatar_emoji picture')
      .lean()
      .exec();
    const userMap = new Map(users.map((u: any) => [u.user_id, u]));

    const [stats] = await this.statsForKeys([key]);
    return {
      stats,
      reviews: reviews.map((r) => {
        const author: any = userMap.get(r.user_id);
        return {
          ...this.toReviewDto(r),
          author: author
            ? {
                user_id: author.user_id,
                name: author.pseudo || author.name,
                avatar_emoji: author.avatar_emoji || null,
                picture: author.picture || null,
              }
            : null,
        };
      }),
    };
  }

  private async statsForKeys(keys: string[], userId?: string): Promise<PlaceStats[]> {
    const unique = [...new Set(keys)];
    const [aggregates, mine] = await Promise.all([
      this.reviewModel
        .aggregate([
          { $match: { place_key: { $in: unique } } },
          {
            $group: {
              _id: '$place_key',
              rating_avg: { $avg: '$rating' },
              reviews_count: { $sum: 1 },
              likes_count: { $sum: { $cond: ['$liked', 1, 0] } },
            },
          },
        ])
        .exec(),
      userId
        ? this.reviewModel.find({ user_id: userId, place_key: { $in: unique } }).lean().exec()
        : Promise.resolve([] as any[]),
    ]);

    const aggMap = new Map(aggregates.map((a: any) => [a._id, a]));
    const mineMap = new Map((mine as any[]).map((r) => [r.place_key, r]));

    return keys.map((key) => {
      const agg: any = aggMap.get(key);
      const my: any = mineMap.get(key);
      return {
        place_key: key,
        rating_avg: agg ? Math.round(agg.rating_avg * 10) / 10 : null,
        reviews_count: agg?.reviews_count ?? 0,
        likes_count: agg?.likes_count ?? 0,
        my_rating: my?.rating ?? null,
        my_liked: !!my?.liked,
      };
    });
  }

  private toReviewDto(r: any) {
    return {
      id: r.id,
      place_key: r.place_key,
      place_name: r.place_name,
      rating: r.rating,
      comment: r.comment || '',
      liked: !!r.liked,
      trip_id: r.trip_id || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }
}
