import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenancyMiddleware } from './tenancy/tenancy.middleware';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { CommunityModule } from './community/community.module';
import { GamificationModule } from './gamification/gamification.module';
import { ProModule } from './pro/pro.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { InterestsModule } from './interests/interests.module';
import { UploadModule } from './upload/upload.module';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Connexion MongoDB Globale (Users, Auth, Sessions, Payments)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI_GLOBAL') ||
          configService.get<string>('MONGO_URL') ||
          'mongodb://localhost:27017/voyago_global',
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
      connectionName: GLOBAL_DB_CONNECTION,
    }),
    // Connexion MongoDB Tenant par défaut (Trips, Profiles)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI_TENANT') ||
          configService.get<string>('MONGO_URI_GLOBAL') ||
          'mongodb://localhost:27017/voyago_tenants',
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
      connectionName: TENANT_DB_CONNECTION,
    }),
    TenancyModule,
    AiModule,
    AuthModule,
    TripsModule,
    CommunityModule,
    GamificationModule,
    ProModule,
    WebhooksModule,
    InterestsModule,
    UploadModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applique le TenancyMiddleware sur toutes les routes de l'API
    consumer.apply(TenancyMiddleware).forRoutes('*');
  }
}
