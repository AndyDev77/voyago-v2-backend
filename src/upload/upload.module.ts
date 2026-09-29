import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../auth/schemas/user-session.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { GLOBAL_DB_CONNECTION } from '../common/constants';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: UserSession.name, schema: UserSessionSchema },
      ],
      GLOBAL_DB_CONNECTION,
    ),
  ],
  controllers: [UploadController],
  providers: [UploadService, SessionAuthGuard],
  exports: [UploadService],
})
export class UploadModule {}
