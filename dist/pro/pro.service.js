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
exports.ProService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const stripe_1 = require("stripe");
const payment_transaction_schema_1 = require("./schemas/payment-transaction.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
const TIERS = [
    {
        id: 'monthly',
        name: 'Mensuel',
        price: 4.99,
        currency: 'eur',
        duration: 'month',
        benefits: [
            'Voyages illimités',
            'Météo étendue 16 jours',
            'Badge Pro 💎',
            "Accès anticipé aux nouvelles fonctionnalités",
        ],
        stripe_price_id: 'price_monthly',
    },
    {
        id: 'annual',
        name: 'Annuel',
        price: 39.99,
        currency: 'eur',
        duration: 'year',
        benefits: [
            'Voyages illimités',
            'Météo étendue 16 jours',
            'Badge Pro 💎',
            'Accès anticipé',
            '2 mois offerts',
        ],
        stripe_price_id: 'price_annual',
        best_offer: true,
    },
    {
        id: 'lifetime',
        name: 'À vie',
        price: 79.99,
        currency: 'eur',
        duration: 'lifetime',
        benefits: [
            'Voyages illimités',
            'Météo étendue 16 jours',
            'Badge Pro 💎',
            'Accès anticipé',
            'Toutes les futures fonctionnalités',
        ],
        stripe_price_id: 'price_lifetime',
    },
];
let ProService = class ProService {
    constructor(transactionModel, userModel, profileModel, configService) {
        this.transactionModel = transactionModel;
        this.userModel = userModel;
        this.profileModel = profileModel;
        this.configService = configService;
        const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey, { apiVersion: '2023-10-16' });
        }
    }
    getTiers() {
        return TIERS;
    }
    async createCheckout(user, tier) {
        if (!this.stripe) {
            throw new common_1.InternalServerErrorException('Stripe not configured');
        }
        const tierConfig = TIERS.find((t) => t.id === tier);
        if (!tierConfig) {
            throw new common_1.BadRequestException(`Unknown tier: ${tier}`);
        }
        const appBaseUrl = this.configService.get('APP_BASE_URL', 'http://localhost:8001');
        const isSubscription = tier !== 'lifetime';
        const sessionParams = {
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: `${appBaseUrl}/pricing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appBaseUrl}/pricing?cancelled=true`,
            metadata: {
                user_id: user.user_id,
                tier,
                email: user.email || '',
            },
            line_items: [
                {
                    price_data: {
                        currency: tierConfig.currency,
                        product_data: {
                            name: `Voyago ${tierConfig.name}`,
                            description: tierConfig.benefits.join(', '),
                        },
                        unit_amount: Math.round(tierConfig.price * 100),
                        ...(isSubscription && {
                            recurring: {
                                interval: tier === 'annual' ? 'year' : 'month',
                            },
                        }),
                    },
                    quantity: 1,
                },
            ],
        };
        if (user.email) {
            sessionParams.customer_email = user.email;
        }
        const session = await this.stripe.checkout.sessions.create(sessionParams);
        await this.transactionModel.create({
            session_id: session.id,
            user_id: user.user_id,
            tier,
            amount: Math.round(tierConfig.price * 100),
            currency: tierConfig.currency,
            status: 'initiated',
            payment_status: 'unpaid',
            applied: false,
            metadata: { user_id: user.user_id, tier, email: user.email || '' },
            created_at: new Date(),
            updated_at: new Date(),
        });
        return { checkout_url: session.url, session_id: session.id };
    }
    async pollPaymentStatus(session_id) {
        if (!this.stripe) {
            throw new common_1.InternalServerErrorException('Stripe not configured');
        }
        const transaction = await this.transactionModel.findOne({ session_id }).exec();
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction ${session_id} not found`);
        }
        const stripeSession = await this.stripe.checkout.sessions.retrieve(session_id);
        const paymentStatus = stripeSession.payment_status;
        const status = stripeSession.status;
        await this.transactionModel.updateOne({ session_id }, {
            $set: {
                status: status || 'unknown',
                payment_status: paymentStatus || 'unpaid',
                updated_at: new Date(),
            },
        }).exec();
        if (paymentStatus === 'paid' && !transaction.applied) {
            await this.applyProStatus(transaction.user_id, transaction.tier, session_id);
        }
        const updated = await this.transactionModel.findOne({ session_id }).lean().exec();
        return {
            status: updated.status,
            payment_status: updated.payment_status,
            applied: updated.applied,
        };
    }
    async applyProStatus(user_id, tier, session_id) {
        let pro_expires_at = null;
        if (tier === 'monthly') {
            pro_expires_at = new Date();
            pro_expires_at.setMonth(pro_expires_at.getMonth() + 1);
        }
        else if (tier === 'annual') {
            pro_expires_at = new Date();
            pro_expires_at.setFullYear(pro_expires_at.getFullYear() + 1);
        }
        else if (tier === 'lifetime') {
            pro_expires_at = null;
        }
        await this.userModel.updateOne({ user_id }, {
            $set: {
                is_pro: true,
                pro_tier: tier,
                pro_expires_at,
            },
        }).exec();
        await this.profileModel.updateOne({ user_id }, { $addToSet: { badges: 'voyago_pro' } }).exec();
        if (session_id) {
            await this.transactionModel.updateOne({ session_id }, {
                $set: {
                    applied: true,
                    status: 'complete',
                    payment_status: 'paid',
                    updated_at: new Date(),
                },
            }).exec();
        }
    }
    async getProStatus(user) {
        return {
            is_pro: user.is_pro,
            tier: user.pro_tier || null,
            expires_at: user.pro_expires_at || null,
        };
    }
};
exports.ProService = ProService;
exports.ProService = ProService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_transaction_schema_1.PaymentTransaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], ProService);
//# sourceMappingURL=pro.service.js.map