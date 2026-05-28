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
exports.ProController = void 0;
const common_1 = require("@nestjs/common");
const pro_service_1 = require("./pro.service");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const class_validator_1 = require("class-validator");
class CreateCheckoutDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "tier", void 0);
let ProController = class ProController {
    constructor(proService) {
        this.proService = proService;
    }
    getTiers() {
        return this.proService.getTiers();
    }
    async createCheckout(user, body) {
        return this.proService.createCheckout(user, body.tier);
    }
    async pollStatus(session_id) {
        return this.proService.pollPaymentStatus(session_id);
    }
    async getProStatus(user) {
        return this.proService.getProStatus(user);
    }
};
exports.ProController = ProController;
__decorate([
    (0, common_1.Get)('tiers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProController.prototype, "getTiers", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateCheckoutDto]),
    __metadata("design:returntype", Promise)
], ProController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Get)('status/:session_id'),
    __param(0, (0, common_1.Param)('session_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProController.prototype, "pollStatus", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProController.prototype, "getProStatus", null);
exports.ProController = ProController = __decorate([
    (0, common_1.Controller)('pro'),
    __metadata("design:paramtypes", [pro_service_1.ProService])
], ProController);
//# sourceMappingURL=pro.controller.js.map