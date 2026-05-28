import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { Trip, TripSchema } from './schemas/trip.schema';
import { Profile, ProfileSchema } from '../gamification/schemas/profile.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../auth/schemas/user-session.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  controllers: [TripsController],
  providers: [TripsService, SessionAuthGuard],
  exports: [TripsService, MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }])],
})
export class TripsModule {}
