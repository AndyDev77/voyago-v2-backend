import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GenerateTripDto } from './dto/generate-trip.dto';

@Controller()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('trips/:user_id')
  async getUserTrips(@Param('user_id') user_id: string) {
    return this.tripsService.getUserTrips(user_id);
  }

  @Get('trip/:trip_id')
  async getTrip(@Param('trip_id') trip_id: string) {
    // Public trip lookup falls through to shared DB
    return this.tripsService.getTripById(trip_id);
  }

  @Post('trips/generate')
  @UseGuards(SessionAuthGuard)
  async generateTrip(
    @CurrentUser() user: any,
    @Body() dto: GenerateTripDto,
  ) {
    return this.tripsService.generateTrip(user, dto);
  }
}
