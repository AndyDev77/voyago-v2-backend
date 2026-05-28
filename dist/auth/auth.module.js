"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const user_schema_1 = require("./schemas/user.schema");
const user_session_schema_1 = require("./schemas/user-session.schema");
const password_reset_schema_1 = require("./schemas/password-reset.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_session_schema_1.UserSession.name, schema: user_session_schema_1.UserSessionSchema },
                { name: password_reset_schema_1.PasswordReset.name, schema: password_reset_schema_1.PasswordResetSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, session_auth_guard_1.SessionAuthGuard],
        exports: [
            auth_service_1.AuthService,
            session_auth_guard_1.SessionAuthGuard,
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_session_schema_1.UserSession.name, schema: user_session_schema_1.UserSessionSchema },
            ]),
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map