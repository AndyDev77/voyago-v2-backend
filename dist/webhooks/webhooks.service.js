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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const pro_service_1 = require("../pro/pro.service");
let WebhooksService = class WebhooksService {
    constructor(configService, proService) {
        this.configService = configService;
        this.proService = proService;
        const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
        this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET', '');
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey, { apiVersion: '2023-10-16' });
        }
    }
    async handleStripeWebhook(rawBody, signature) {
        if (!this.stripe) {
            throw new common_1.InternalServerErrorException('Stripe not configured');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.payment_status === 'paid') {
                    const userId = session.metadata?.user_id;
                    const tier = session.metadata?.tier;
                    if (userId && tier) {
                        await this.proService.applyProStatus(userId, tier, session.id);
                    }
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                break;
            }
            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
        return { received: true };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        pro_service_1.ProService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map