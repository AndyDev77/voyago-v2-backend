import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../auth/schemas/user-session.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Profile.name, schema: ProfileSchema }],
      TENANT_DB_CONNECTION,
    ),
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: UserSession.name, schema: UserSessionSchema },
      ],
      GLOBAL_DB_CONNECTION,
    ),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, SessionAuthGuard],
  exports: [
    GamificationService,
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }], TENANT_DB_CONNECTION),
  ],
})
export class GamificationModule {}
