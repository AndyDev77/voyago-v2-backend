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
exports.PaymentTransactionSchema = exports.PaymentTransaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PaymentTransaction = class PaymentTransaction {
};
exports.PaymentTransaction = PaymentTransaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "session_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "tier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PaymentTransaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'initiated' }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'unpaid' }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "payment_status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PaymentTransaction.prototype, "applied", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], PaymentTransaction.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PaymentTransaction.prototype, "created_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PaymentTransaction.prototype, "updated_at", void 0);
exports.PaymentTransaction = PaymentTransaction = __decorate([
    (0, mongoose_1.Schema)({ collection: 'payment_transactions' })
], PaymentTransaction);
exports.PaymentTransactionSchema = mongoose_1.SchemaFactory.createForClass(PaymentTransaction);
//# sourceMappingURL=payment-transaction.schema.js.map