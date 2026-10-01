import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ArrivalDto } from './dto/arrival.dto';

@Controller('notifications')
@UseGuards(SessionAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.notificationsService.list(user.user_id, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.unreadCount(user.user_id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.user_id);
  }

  @Post('arrival')
  async arrival(@CurrentUser() user: any, @Body() dto: ArrivalDto) {
    return this.notificationsService.recordArrival(user.user_id, dto);
  }

  @Post(':id/read')
  async markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(user.user_id, id);
  }
}
