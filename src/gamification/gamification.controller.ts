import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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

  @Post(['profile/xp', 'profile/award-xp'])
  @UseGuards(SessionAuthGuard)
  async awardXP(@Body() body: AwardXpDto, @Req() req: any) {
    const authUserId = req.user?.user_id;
    if (authUserId && body.user_id && authUserId !== body.user_id) {
      throw new ForbiddenException('Anti-cheat: Cannot award XP to another user account');
    }
    const targetUserId = authUserId || body.user_id;
    return this.gamificationService.awardXP(targetUserId, body.action);
  }

  @Get(['xp/rewards', 'xp-rewards'])
  async getXpRewards() {
    return this.gamificationService.getXpRewards();
  }

  @Get(['xp/rewards/:user_id', 'xp-rewards/:user_id'])
  async getXpRewardsForUser(@Param('user_id') user_id: string) {
    return this.gamificationService.getXpRewards(user_id);
  }

  @Get('badges')
  getBadges() {
    return this.gamificationService.getBadges();
  }
}
