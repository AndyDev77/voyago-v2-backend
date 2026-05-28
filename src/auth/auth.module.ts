import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { PasswordReset, PasswordResetSchema } from './schemas/password-reset.schema';
import { Profile, ProfileSchema } from '../gamification/schemas/profile.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard],
  exports: [
    AuthService,
    SessionAuthGuard,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
})
export class AuthModule {}
