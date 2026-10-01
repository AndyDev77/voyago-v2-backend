import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { OptionalSessionAuthGuard } from '../common/guards/optional-session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewPlaceDto } from './dto/review-place.dto';
import { PlaceStatsDto } from './dto/place-stats.dto';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  /** Noter / liker / commenter un lieu visité */
  @Post('reviews')
  @UseGuards(SessionAuthGuard)
  async review(@CurrentUser() user: any, @Body() dto: ReviewPlaceDto) {
    return this.placesService.review(user.user_id, dto);
  }

  /** Étoiles agrégées de plusieurs lieux (+ l'avis de l'appelant s'il est connecté) */
  @Post('stats')
  @UseGuards(OptionalSessionAuthGuard)
  async stats(@CurrentUser() user: any, @Body() dto: PlaceStatsDto) {
    return this.placesService.statsForPlaces(dto.places, user?.user_id);
  }

  /** Derniers avis d'un lieu, pour les autres voyageurs */
  @Get('reviews')
  async latestReviews(
    @Query('name') name: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('limit') limit?: string,
  ) {
    return this.placesService.latestReviews(
      name,
      parseFloat(lat),
      parseFloat(lng),
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
