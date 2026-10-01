import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JournalService } from './journal.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpsertJournalEntryDto } from './dto/upsert-entry.dto';

@Controller('journal')
@UseGuards(SessionAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  /** Voyages passés (journal) */
  @Get()
  async list(@CurrentUser() user: any) {
    return this.journalService.list(user.user_id);
  }

  /** Journal détaillé d'un voyage */
  @Get(':tripId')
  async detail(@CurrentUser() user: any, @Param('tripId') tripId: string) {
    return this.journalService.detail(user.user_id, tripId);
  }

  /** Souvenir d'un lieu : note, humeurs, visité */
  @Put(':tripId/entries')
  async upsertEntry(@CurrentUser() user: any, @Param('tripId') tripId: string, @Body() dto: UpsertJournalEntryDto) {
    return this.journalService.upsertEntry(user.user_id, tripId, dto);
  }

  /** Ajout d'une photo souvenir (multipart : file, poi_name, day) */
  @Post(':tripId/photos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } }))
  async addPhoto(
    @CurrentUser() user: any,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('poi_name') poiName: string,
    @Body('day', new ParseIntPipe({ optional: true })) day?: number,
  ) {
    return this.journalService.addPhoto(user.user_id, tripId, poiName, day || 1, file);
  }

  @Delete(':tripId/photos/:key')
  async removePhoto(@CurrentUser() user: any, @Param('tripId') tripId: string, @Param('key') key: string) {
    return this.journalService.removePhoto(user.user_id, tripId, key);
  }

  /** Terminer le voyage : il quitte la carte et rejoint le journal */
  @Post(':tripId/complete')
  async complete(@CurrentUser() user: any, @Param('tripId') tripId: string) {
    return this.journalService.complete(user.user_id, tripId);
  }

  /** Remettre le voyage sur la carte */
  @Post(':tripId/reopen')
  async reopen(@CurrentUser() user: any, @Param('tripId') tripId: string) {
    return this.journalService.reopen(user.user_id, tripId);
  }

  /** Partager le journal à la communauté (+5 XP la première fois) */
  @Post(':tripId/share')
  async share(@CurrentUser() user: any, @Param('tripId') tripId: string) {
    return this.journalService.share(user.user_id, tripId);
  }
}
