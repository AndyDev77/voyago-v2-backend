import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PlaceReview, PlaceReviewSchema } from './schemas/place-review.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../auth/schemas/user-session.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { OptionalSessionAuthGuard } from '../common/guards/optional-session-auth.guard';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GLOBAL_DB_CONNECTION } from '../common/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: PlaceReview.name, schema: PlaceReviewSchema },
        { name: User.name, schema: UserSchema },
        { name: UserSession.name, schema: UserSessionSchema },
      ],
      GLOBAL_DB_CONNECTION,
    ),
    GamificationModule,
    NotificationsModule,
  ],
  controllers: [PlacesController],
  providers: [PlacesService, SessionAuthGuard, OptionalSessionAuthGuard],
})
export class PlacesModule {}
