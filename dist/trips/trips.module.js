"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const trips_controller_1 = require("./trips.controller");
const trips_service_1 = require("./trips.service");
const trip_schema_1 = require("./schemas/trip.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const user_session_schema_1 = require("../auth/schemas/user-session.schema");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
let TripsModule = class TripsModule {
};
exports.TripsModule = TripsModule;
exports.TripsModule = TripsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: trip_schema_1.Trip.name, schema: trip_schema_1.TripSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_session_schema_1.UserSession.name, schema: user_session_schema_1.UserSessionSchema },
            ]),
        ],
        controllers: [trips_controller_1.TripsController],
        providers: [trips_service_1.TripsService, session_auth_guard_1.SessionAuthGuard],
        exports: [trips_service_1.TripsService, mongoose_1.MongooseModule.forFeature([{ name: trip_schema_1.Trip.name, schema: trip_schema_1.TripSchema }])],
    })
], TripsModule);
//# sourceMappingURL=trips.module.js.map