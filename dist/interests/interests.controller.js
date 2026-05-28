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
exports.InterestsController = void 0;
const common_1 = require("@nestjs/common");
const INTERESTS = [
    { id: 'culture', title: 'Culture & Histoire', emoji: '🏛️', description: 'Musées, monuments, sites historiques', image_url: null },
    { id: 'gastronomie', title: 'Gastronomie', emoji: '🍜', description: 'Restaurants locaux, marchés, street food', image_url: null },
    { id: 'nature', title: 'Nature & Randonnée', emoji: '🏔️', description: 'Parcs naturels, randonnées, paysages', image_url: null },
    { id: 'plage', title: 'Plage & Mer', emoji: '🏖️', description: 'Plages, snorkeling, sports nautiques', image_url: null },
    { id: 'nightlife', title: 'Vie Nocturne', emoji: '🎉', description: 'Bars, clubs, concerts, festivals', image_url: null },
    { id: 'shopping', title: 'Shopping', emoji: '🛍️', description: 'Boutiques locales, souvenirs, marchés', image_url: null },
    { id: 'sport', title: 'Sport & Aventure', emoji: '🧗', description: 'Sports extrêmes, aventure, activités outdoor', image_url: null },
    { id: 'bien_etre', title: 'Bien-être & Spa', emoji: '🧘', description: 'Spas, yoga, relaxation', image_url: null },
    { id: 'art', title: 'Art & Design', emoji: '🎨', description: 'Galeries, street art, architecture moderne', image_url: null },
    { id: 'famille', title: 'Famille', emoji: '👨‍👩‍👧‍👦', description: "Activités pour enfants, parcs d'attraction", image_url: null },
];
let InterestsController = class InterestsController {
    getInterests() {
        return INTERESTS;
    }
    healthCheck() {
        return { status: 'healthy', service: 'Voyago API', version: '2.0.0' };
    }
};
exports.InterestsController = InterestsController;
__decorate([
    (0, common_1.Get)('interests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InterestsController.prototype, "getInterests", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InterestsController.prototype, "healthCheck", null);
exports.InterestsController = InterestsController = __decorate([
    (0, common_1.Controller)()
], InterestsController);
//# sourceMappingURL=interests.controller.js.map