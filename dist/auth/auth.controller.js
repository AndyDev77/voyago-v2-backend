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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const signup_dto_1 = require("./dto/signup.dto");
const login_dto_1 = require("./dto/login.dto");
const google_session_dto_1 = require("./dto/google-session.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const guest_login_dto_1 = require("./dto/guest-login.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    getOptions() {
        return this.authService.getAuthOptions();
    }
    async emailSignup(dto) {
        return this.authService.emailSignup(dto);
    }
    async emailLogin(dto) {
        return this.authService.emailLogin(dto);
    }
    async googleSession(dto) {
        return this.authService.googleSession(dto);
    }
    async guestLogin(dto) {
        return this.authService.guestLogin(dto.user_id);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    async getMe(user) {
        return this.authService.getMe(user);
    }
    async updateMe(user, dto) {
        return this.authService.updateMe(user, dto);
    }
    async logout(req) {
        return this.authService.logout(req.session_token);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Post)('email/signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.SignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "emailSignup", null);
__decorate([
    (0, common_1.Post)('email/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "emailLogin", null);
__decorate([
    (0, common_1.Post)('google/session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_session_dto_1.GoogleSessionDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleSession", null);
__decorate([
    (0, common_1.Post)('guest'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [guest_login_dto_1.GuestLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "guestLogin", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map