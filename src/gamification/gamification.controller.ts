import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { IsString } from 'class-validator';

class AwardXpDto {
  @IsString()
  user_id: string;

  @IsString()
  action: string;
}

@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile/:user_id')
  async getProfile(@Param('user_id') user_id: string) {
    return this.gamificationService.getProfile(user_id);
  }

  @Post('profile/xp')
  @UseGuards(SessionAuthGuard)
  async awardXP(@Body() body: AwardXpDto) {
    return this.gamificationService.awardXP(body.user_id, body.action);
  }

  @Get('xp/rewards')
  getXpRewards() {
    return this.gamificationService.getXpRewards();
  }

  @Get('badges')
  getBadges() {
    return this.gamificationService.getBadges();
  }
}
