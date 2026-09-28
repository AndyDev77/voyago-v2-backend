import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProController } from './pro.controller';
import { ProService } from './pro.service';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { UserSession, UserSessionSchema } from '../auth/schemas/user-session.schema';
import { Profile, ProfileSchema } from '../gamification/schemas/profile.schema';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';

import { GLOBAL_DB_CONNECTION, TENANT_DB_CONNECTION } from '../common/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
        { name: User.name, schema: UserSchema },
        { name: UserSession.name, schema: UserSessionSchema },
      ],
      GLOBAL_DB_CONNECTION,
    ),
    MongooseModule.forFeature(
      [{ name: Profile.name, schema: ProfileSchema }],
      TENANT_DB_CONNECTION,
    ),
  ],
  controllers: [ProController],
  providers: [ProService, SessionAuthGuard],
  exports: [ProService],
})
export class ProModule {}
