"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const gamification_controller_1 = require("./gamification.controller");
const gamification_service_1 = require("./gamification.service");
const profile_schema_1 = require("./schemas/profile.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const user_session_schema_1 = require("../auth/schemas/user-session.schema");
const session_auth_guard_1 = require("../common/guards/session-auth.guard");
let GamificationModule = class GamificationModule {
};
exports.GamificationModule = GamificationModule;
exports.GamificationModule = GamificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_session_schema_1.UserSession.name, schema: user_session_schema_1.UserSessionSchema },
            ]),
        ],
        controllers: [gamification_controller_1.GamificationController],
        providers: [gamification_service_1.GamificationService, session_auth_guard_1.SessionAuthGuard],
        exports: [
            gamification_service_1.GamificationService,
            mongoose_1.MongooseModule.forFeature([{ name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema }]),
        ],
    })
], GamificationModule);
//# sourceMappingURL=gamification.module.js.map