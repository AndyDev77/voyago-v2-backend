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
import { OptionalSessionAuthGuard } from '../common/guards/optional-session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GenerateTripDto } from './dto/generate-trip.dto';

@Controller()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('trips/:user_id')
  @UseGuards(OptionalSessionAuthGuard)
  async getUserTrips(
    @Param('user_id') user_id: string,
    @CurrentUser() user: any,
  ) {
    // Owners see all their trips; everyone else only sees public ones
    const isOwner = user?.user_id === user_id;
    return this.tripsService.getUserTrips(user_id, { publicOnly: !isOwner });
  }

  @Get('trip/:trip_id')
  @UseGuards(OptionalSessionAuthGuard)
  async getTrip(@Param('trip_id') trip_id: string, @CurrentUser() user: any) {
    // Authenticated owners are looked up in their tenant DB first;
    // otherwise the public lookup falls through to the shared DB
    return this.tripsService.getTripById(trip_id, user?.user_id);
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
