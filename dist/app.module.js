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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("./auth/auth.module");
const trips_module_1 = require("./trips/trips.module");
const community_module_1 = require("./community/community.module");
const gamification_module_1 = require("./gamification/gamification.module");
const pro_module_1 = require("./pro/pro.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const interests_module_1 = require("./interests/interests.module");
let AppModule = class AppModule {
    constructor() {
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGO_URL', 'mongodb://localhost:27017'),
                    dbName: configService.get('DB_NAME', 'voyago_db'),
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            trips_module_1.TripsModule,
            community_module_1.CommunityModule,
            gamification_module_1.GamificationModule,
            pro_module_1.ProModule,
            webhooks_module_1.WebhooksModule,
            interests_module_1.InterestsModule,
        ],
    }),
    __metadata("design:paramtypes", [])
], AppModule);
//# sourceMappingURL=app.module.js.map