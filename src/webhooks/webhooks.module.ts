import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ProModule } from '../pro/pro.module';
import { PaymentTransaction, PaymentTransactionSchema } from '../pro/schemas/payment-transaction.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Profile, ProfileSchema } from '../gamification/schemas/profile.schema';

@Module({
  imports: [
    ProModule,
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
