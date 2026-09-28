import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenancyService } from './tenancy.service';
import { TenancyMiddleware } from './tenancy.middleware';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TenancyService, TenancyMiddleware],
  exports: [TenancyService, TenancyMiddleware],
})
export class TenancyModule {}
