import { Controller, Get, Param } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  async getPublicFeed() {
    return this.communityService.getPublicFeed();
  }

  @Get('user/:id')
  async getUserPublicProfile(@Param('id') id: string) {
    return this.communityService.getUserPublicProfile(id);
  }
}
