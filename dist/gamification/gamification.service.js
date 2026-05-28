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
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const profile_schema_1 = require("./schemas/profile.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const XP_ACTIONS = {
    generate_trip: 50,
    first_swipe: 10,
    share_trip: 20,
};
const ONE_TIME_ACTIONS = ['first_swipe'];
let GamificationService = class GamificationService {
    constructor(profileModel, userModel) {
        this.profileModel = profileModel;
        this.userModel = userModel;
    }
    async getProfile(user_id) {
        const profile = await this.profileModel.findOne({ user_id }).lean().exec();
        const user = await this.userModel.findOne({ user_id }).lean().exec();
        if (!profile) {
            throw new common_1.NotFoundException(`Profile for user ${user_id} not found`);
        }
        return {
            user_id,
            xp: profile.xp,
            level: profile.level,
            streak: profile.streak,
            badges: profile.badges,
            trips_count: profile.trips_count,
            last_active: profile.last_active,
            user: user
                ? {
                    name: user.name,
                    pseudo: user.pseudo || null,
                    avatar_emoji: user.avatar_emoji || null,
                    picture: user.picture || null,
                    is_pro: user.is_pro || false,
                }
                : null,
        };
    }
    async awardXP(user_id, action) {
        const xpAmount = XP_ACTIONS[action];
        if (xpAmount === undefined) {
            throw new common_1.BadRequestException(`Unknown XP action: ${action}`);
        }
        let profile = await this.profileModel.findOne({ user_id }).exec();
        if (!profile) {
            profile = await this.profileModel.create({
                user_id,
                xp: 0,
                level: 1,
                streak: 0,
                badges: [],
                trips_count: 0,
                last_active: new Date(),
            });
        }
        if (ONE_TIME_ACTIONS.includes(action) && profile.badges.includes(action)) {
            return {
                user_id,
                xp: profile.xp,
                level: profile.level,
                streak: profile.streak,
                badges: profile.badges,
                trips_count: profile.trips_count,
                message: 'XP already awarded for this one-time action',
            };
        }
        const newXp = profile.xp + xpAmount;
        const newLevel = Math.floor(newXp / 100) + 1;
        const updateFields = {
            xp: newXp,
            level: newLevel,
            last_active: new Date(),
        };
        if (action === 'first_swipe' && !profile.badges.includes('first_swipe')) {
            await this.profileModel.updateOne({ user_id }, {
                $set: updateFields,
                $addToSet: { badges: 'first_swipe' },
            }).exec();
        }
        else {
            await this.profileModel.updateOne({ user_id }, { $set: updateFields }).exec();
        }
        const updated = await this.profileModel.findOne({ user_id }).lean().exec();
        return {
            user_id,
            xp: updated.xp,
            level: updated.level,
            streak: updated.streak,
            badges: updated.badges,
            trips_count: updated.trips_count,
            xp_awarded: xpAmount,
        };
    }
    getXpRewards() {
        return {
            actions: [
                { action: 'generate_trip', xp: 50, description: 'Générer un itinéraire' },
                { action: 'first_swipe', xp: 10, description: 'Premier swipe' },
                { action: 'share_trip', xp: 20, description: 'Partager un voyage' },
            ],
            levels: [
                { level: 1, title: 'Voyageur Débutant', min_xp: 0, reward: null },
                { level: 5, title: 'Aventurier', min_xp: 400, reward: 'Badge Globe-trotter' },
                { level: 10, title: 'Explorateur', min_xp: 900, reward: '1 mois Pro offert' },
                { level: 20, title: 'Globe-trotter', min_xp: 1900, reward: '3 mois Pro offerts' },
                { level: 30, title: 'Voyageur Élite', min_xp: 2900, reward: '6 mois Pro offerts' },
                { level: 50, title: 'Légende Voyago', min_xp: 4900, reward: '1 an Pro offert' },
            ],
        };
    }
    getBadges() {
        return [
            { id: 'first_swipe', title: 'Premier Swipe', description: "Tu as sélectionné tes premières envies de voyage", emoji: '👆', xp_reward: 10 },
            { id: 'first_trip', title: 'Premier Voyage', description: "Tu as généré ton premier itinéraire", emoji: '✈️', xp_reward: 25 },
            { id: 'globe_trotter', title: 'Globe-trotter', description: '5 voyages générés', emoji: '🌍', xp_reward: 50 },
            { id: 'explorateur', title: 'Explorateur', description: '10 voyages générés', emoji: '🗺️', xp_reward: 100 },
            { id: 'en_feu', title: 'En Feu', description: '3 jours de streak', emoji: '🔥', xp_reward: 30 },
            { id: 'voyago_pro', title: 'Voyago Pro', description: 'Membre Pro Voyago', emoji: '💎', xp_reward: 0 },
        ];
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map