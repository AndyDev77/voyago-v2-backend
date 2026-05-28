"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trip_schema_1 = require("../trips/schemas/trip.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
let CommunityService = class CommunityService {
    constructor(tripModel, userModel, profileModel) {
        this.tripModel = tripModel;
        this.userModel = userModel;
        this.profileModel = profileModel;
    }
    async getPublicFeed() {
        const trips = await this.tripModel
            .find({ is_public: true })
            .sort({ created_at: -1 })
            .limit(50)
            .lean()
            .exec();
        const userIds = [...new Set(trips.map((t) => t.user_id))];
        const users = await this.userModel
            .find({ user_id: { $in: userIds } })
            .lean()
            .exec();
        const userMap = new Map(users.map((u) => [u.user_id, u]));
        return trips.map((trip) => {
            const author = userMap.get(trip.user_id);
            return {
                ...trip,
                author: author
                    ? {
                        user_id: author.user_id,
                        name: author.name,
                        pseudo: author.pseudo || null,
                        avatar_emoji: author.avatar_emoji || null,
                        is_pro: author.is_pro || false,
                    }
                    : null,
            };
        });
    }
    async getUserPublicProfile(user_id) {
        const user = await this.userModel.findOne({ user_id }).lean().exec();
        if (!user) {
            throw new common_1.NotFoundException(`User ${user_id} not found`);
        }
        const profile = await this.profileModel.findOne({ user_id }).lean().exec();
        const trips = await this.tripModel
            .find({ user_id, is_public: true })
            .sort({ created_at: -1 })
            .lean()
            .exec();
        return {
            user: {
                user_id: user.user_id,
                name: user.name,
                pseudo: user.pseudo || null,
                avatar_emoji: user.avatar_emoji || null,
                picture: user.picture || null,
                is_pro: user.is_pro || false,
                created_at: user.created_at,
            },
            profile: profile
                ? {
                    xp: profile.xp,
                    level: profile.level,
                    streak: profile.streak,
                    badges: profile.badges,
                    trips_count: profile.trips_count,
                }
                : null,
            trips,
        };
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trip_schema_1.Trip.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], CommunityService);
//# sourceMappingURL=community.service.js.map