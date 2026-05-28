import { TripsService } from './trips.service';
import { GenerateTripDto } from './dto/generate-trip.dto';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    getUserTrips(user_id: string): Promise<import("./schemas/trip.schema").Trip[]>;
    getTrip(trip_id: string): Promise<import("./schemas/trip.schema").Trip>;
    generateTrip(user: any, dto: GenerateTripDto): Promise<import("./schemas/trip.schema").Trip>;
}
