import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProService } from './pro.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString } from 'class-validator';

class CreateCheckoutDto {
  @IsString()
  tier: string;
}

@Controller('pro')
export class ProController {
  constructor(private readonly proService: ProService) {}

  @Get('tiers')
  getTiers() {
    return this.proService.getTiers();
  }

  @Post('checkout')
  @UseGuards(SessionAuthGuard)
  async createCheckout(@CurrentUser() user: any, @Body() body: CreateCheckoutDto) {
    return this.proService.createCheckout(user, body.tier);
  }

  @Get('status/:session_id')
  async pollStatus(@Param('session_id') session_id: string) {
    return this.proService.pollPaymentStatus(session_id);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getProStatus(@CurrentUser() user: any) {
    return this.proService.getProStatus(user);
  }
}
