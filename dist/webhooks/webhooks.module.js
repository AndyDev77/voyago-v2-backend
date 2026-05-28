"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const pro_module_1 = require("../pro/pro.module");
const payment_transaction_schema_1 = require("../pro/schemas/payment-transaction.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            pro_module_1.ProModule,
            mongoose_1.MongooseModule.forFeature([
                { name: payment_transaction_schema_1.PaymentTransaction.name, schema: payment_transaction_schema_1.PaymentTransactionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: profile_schema_1.Profile.name, schema: profile_schema_1.ProfileSchema },
            ]),
        ],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map