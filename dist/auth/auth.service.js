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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
const resend_1 = require("resend");
const user_schema_1 = require("./schemas/user.schema");
const user_session_schema_1 = require("./schemas/user-session.schema");
const password_reset_schema_1 = require("./schemas/password-reset.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
let AuthService = class AuthService {
    constructor(userModel, sessionModel, passwordResetModel, profileModel, configService) {
        this.userModel = userModel;
        this.sessionModel = sessionModel;
        this.passwordResetModel = passwordResetModel;
        this.profileModel = profileModel;
        this.configService = configService;
        const resendKey = this.configService.get('RESEND_API_KEY');
        if (resendKey) {
            this.resend = new resend_1.Resend(resendKey);
        }
    }
    generateSessionToken() {
        return crypto.randomBytes(36).toString('base64url');
    }
    async createSession(user_id) {
        const token = this.generateSessionToken();
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.sessionModel.create({
            user_id,
            session_token: token,
            expires_at,
            created_at: new Date(),
        });
        return token;
    }
    async createProfile(user_id) {
        const existing = await this.profileModel.findOne({ user_id }).exec();
        if (!existing) {
            await this.profileModel.create({
                user_id,
                xp: 0,
                level: 1,
                streak: 0,
                badges: [],
                trips_count: 0,
                last_active: new Date(),
            });
        }
    }
    sanitizeUser(user) {
        const obj = user.toObject ? user.toObject() : { ...user };
        delete obj.password_hash;
        delete obj._id;
        delete obj.__v;
        return obj;
    }
    async emailSignup(dto) {
        const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const password_hash = await bcrypt.hash(dto.password, 12);
        const user_id = 'user_' + (0, uuid_1.v4)();
        const user = await this.userModel.create({
            user_id,
            auth_provider: 'email',
            email: dto.email.toLowerCase(),
            name: dto.name,
            pseudo: dto.pseudo || null,
            avatar_emoji: dto.avatar_emoji || null,
            date_of_birth: dto.date_of_birth || null,
            country: dto.country || null,
            city: dto.city || null,
            password_hash,
            is_pro: false,
            pro_tier: null,
            pro_expires_at: null,
            created_at: new Date(),
        });
        await this.createProfile(user_id);
        const session_token = await this.createSession(user_id);
        return { session_token, user_id, user: this.sanitizeUser(user) };
    }
    async emailLogin(dto) {
        const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.auth_provider !== 'email' || !user.password_hash) {
            throw new common_1.UnauthorizedException('This account uses a different login method');
        }
        const valid = await bcrypt.compare(dto.password, user.password_hash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const session_token = await this.createSession(user.user_id);
        return { session_token, user_id: user.user_id, user: this.sanitizeUser(user) };
    }
    async googleSession(dto) {
        let oauthData;
        try {
            const response = await axios_1.default.get(`https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data/${dto.session_id}`, { timeout: 10000 });
            oauthData = response.data;
        }
        catch (err) {
            throw new common_1.BadRequestException('Failed to retrieve Google OAuth session data');
        }
        const email = oauthData?.email || oauthData?.user?.email;
        const name = oauthData?.name || oauthData?.user?.name || 'Google User';
        const picture = oauthData?.picture || oauthData?.user?.picture || null;
        if (!email) {
            throw new common_1.BadRequestException('No email returned from OAuth provider');
        }
        let user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
        if (!user) {
            const user_id = 'user_' + (0, uuid_1.v4)();
            user = await this.userModel.create({
                user_id,
                auth_provider: 'google',
                email: email.toLowerCase(),
                name,
                picture,
                is_pro: false,
                pro_tier: null,
                pro_expires_at: null,
                created_at: new Date(),
            });
            await this.createProfile(user_id);
        }
        else {
            if (picture && user.picture !== picture) {
                await this.userModel.updateOne({ user_id: user.user_id }, { $set: { picture } }).exec();
                user.picture = picture;
            }
        }
        const session_token = await this.createSession(user.user_id);
        return { session_token, user_id: user.user_id, user: this.sanitizeUser(user) };
    }
    async guestLogin(guest_user_id) {
        if (!guest_user_id.startsWith('guest_')) {
            throw new common_1.BadRequestException('Invalid guest user_id format');
        }
        let user = await this.userModel.findOne({ user_id: guest_user_id }).exec();
        if (!user) {
            user = await this.userModel.create({
                user_id: guest_user_id,
                auth_provider: 'guest',
                name: 'Guest',
                is_pro: false,
                pro_tier: null,
                pro_expires_at: null,
                created_at: new Date(),
            });
            await this.createProfile(guest_user_id);
        }
        const session_token = await this.createSession(user.user_id);
        return { session_token, user_id: user.user_id, user: this.sanitizeUser(user) };
    }
    async forgotPassword(dto) {
        const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
        if (!user || user.auth_provider !== 'email') {
            return { message: 'If that email is registered, a reset code has been sent.' };
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const code_hash = await bcrypt.hash(code, 10);
        const expires_at = new Date(Date.now() + 30 * 60 * 1000);
        await this.passwordResetModel.deleteMany({ email: dto.email.toLowerCase() }).exec();
        await this.passwordResetModel.create({
            email: dto.email.toLowerCase(),
            user_id: user.user_id,
            code_hash,
            expires_at,
            attempts: 0,
            created_at: new Date(),
        });
        if (this.resend) {
            try {
                await this.resend.emails.send({
                    from: 'Voyago <noreply@voyago.app>',
                    to: dto.email,
                    subject: 'Votre code de réinitialisation Voyago',
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Réinitialisation de mot de passe</h2>
              <p>Voici votre code de réinitialisation :</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</span>
              </div>
              <p>Ce code expire dans <strong>30 minutes</strong>.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
          `,
                });
            }
            catch (err) {
                console.error('Failed to send reset email:', err);
            }
        }
        else {
            console.log(`[DEV] Password reset code for ${dto.email}: ${code}`);
        }
        return { message: 'If that email is registered, a reset code has been sent.' };
    }
    async resetPassword(dto) {
        const reset = await this.passwordResetModel
            .findOne({ email: dto.email.toLowerCase() })
            .sort({ created_at: -1 })
            .exec();
        if (!reset) {
            throw new common_1.BadRequestException('No reset request found for this email');
        }
        if (new Date() > reset.expires_at) {
            await this.passwordResetModel.deleteOne({ _id: reset._id }).exec();
            throw new common_1.BadRequestException('Reset code has expired');
        }
        if (reset.attempts >= 5) {
            throw new common_1.BadRequestException('Too many failed attempts. Please request a new code.');
        }
        const valid = await bcrypt.compare(dto.code, reset.code_hash);
        if (!valid) {
            await this.passwordResetModel.updateOne({ _id: reset._id }, { $inc: { attempts: 1 } }).exec();
            throw new common_1.BadRequestException('Invalid reset code');
        }
        const password_hash = await bcrypt.hash(dto.new_password, 12);
        await this.userModel.updateOne({ user_id: reset.user_id }, { $set: { password_hash } }).exec();
        await this.sessionModel.deleteMany({ user_id: reset.user_id }).exec();
        await this.passwordResetModel.deleteOne({ _id: reset._id }).exec();
        return { message: 'Password reset successfully' };
    }
    async getMe(user) {
        return this.sanitizeUser(user);
    }
    async updateMe(user, dto) {
        const updateFields = {};
        if (dto.name !== undefined)
            updateFields.name = dto.name;
        if (dto.pseudo !== undefined)
            updateFields.pseudo = dto.pseudo;
        if (dto.avatar_emoji !== undefined)
            updateFields.avatar_emoji = dto.avatar_emoji;
        if (dto.date_of_birth !== undefined)
            updateFields.date_of_birth = dto.date_of_birth;
        if (dto.country !== undefined)
            updateFields.country = dto.country;
        if (dto.city !== undefined)
            updateFields.city = dto.city;
        if (dto.picture !== undefined)
            updateFields.picture = dto.picture;
        const updated = await this.userModel
            .findOneAndUpdate({ user_id: user.user_id }, { $set: updateFields }, { new: true })
            .exec();
        return this.sanitizeUser(updated);
    }
    async logout(sessionToken) {
        await this.sessionModel.deleteOne({ session_token: sessionToken }).exec();
        return { message: 'Logged out successfully' };
    }
    getAuthOptions() {
        const countries = [
            'France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Algérie', 'Tunisie',
            'Sénégal', "Côte d'Ivoire", 'États-Unis', 'Royaume-Uni', 'Espagne', 'Italie',
            'Allemagne', 'Portugal', 'Pays-Bas', 'Brésil', 'Mexique', 'Japon', 'Australie', 'Autre',
        ];
        const avatar_emojis = ['🦜', '🦁', '🐼', '🦊', '🐨', '🦋', '🐬', '🦅', '🐯', '🦄', '🐺', '🦩'];
        return { countries, avatar_emojis };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_session_schema_1.UserSession.name)),
    __param(2, (0, mongoose_1.InjectModel)(password_reset_schema_1.PasswordReset.name)),
    __param(3, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map