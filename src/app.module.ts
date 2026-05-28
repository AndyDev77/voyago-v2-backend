import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { CommunityModule } from './community/community.module';
import { GamificationModule } from './gamification/gamification.module';
import { ProModule } from './pro/pro.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { InterestsModule } from './interests/interests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL', 'mongodb://localhost:27017'),
        dbName: configService.get<string>('DB_NAME', 'voyago_db'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TripsModule,
    CommunityModule,
    GamificationModule,
    ProModule,
    WebhooksModule,
    InterestsModule,
  ],
})
export class AppModule {
  constructor() {
    // Health check route handled at controller level via a root controller
  }
}
