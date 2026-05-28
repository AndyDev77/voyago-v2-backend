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
exports.GamificationController = void 0;
const common_1 = require("@nestjs/common");
const gamification_service_1 = require("./gamification.service");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
const class_validator_1 = require("class-validator");
class AwardXpDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AwardXpDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AwardXpDto.prototype, "action", void 0);
let GamificationController = class GamificationController {
    constructor(gamificationService) {
        this.gamificationService = gamificationService;
    }
    async getProfile(user_id) {
        return this.gamificationService.getProfile(user_id);
    }
    async awardXP(body) {
        return this.gamificationService.awardXP(body.user_id, body.action);
    }
    getXpRewards() {
        return this.gamificationService.getXpRewards();
    }
    getBadges() {
        return this.gamificationService.getBadges();
    }
};
exports.GamificationController = GamificationController;
__decorate([
    (0, common_1.Get)('profile/:user_id'),
    __param(0, (0, common_1.Param)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamificationController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('profile/xp'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AwardXpDto]),
    __metadata("design:returntype", Promise)
], GamificationController.prototype, "awardXP", null);
__decorate([
    (0, common_1.Get)('xp/rewards'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "getXpRewards", null);
__decorate([
    (0, common_1.Get)('badges'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "getBadges", null);
exports.GamificationController = GamificationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [gamification_service_1.GamificationService])
], GamificationController);
//# sourceMappingURL=gamification.controller.js.map