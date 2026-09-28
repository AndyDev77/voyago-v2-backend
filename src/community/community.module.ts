import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { Trip, TripSchema } from '../trips/schemas/trip.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Profile, ProfileSchema } from '../gamification/schemas/profile.schema';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Trip.name, schema: TripSchema },
        { name: Profile.name, schema: ProfileSchema },
      ],
      TENANT_DB_CONNECTION,
    ),
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      GLOBAL_DB_CONNECTION,
    ),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
