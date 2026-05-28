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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
const sdk_1 = require("@anthropic-ai/sdk");
const trip_schema_1 = require("./schemas/trip.schema");
const profile_schema_1 = require("../gamification/schemas/profile.schema");
const user_schema_1 = require("../auth/schemas/user.schema");
const WEATHER_CODE_MAP = {
    0: { icon: '☀️', summary: 'Ensoleillé' },
    1: { icon: '⛅', summary: 'Nuageux' },
    2: { icon: '⛅', summary: 'Nuageux' },
    3: { icon: '⛅', summary: 'Nuageux' },
    45: { icon: '🌫️', summary: 'Brouillard' },
    48: { icon: '🌫️', summary: 'Brouillard' },
    51: { icon: '🌧️', summary: 'Pluvieux' },
    53: { icon: '🌧️', summary: 'Pluvieux' },
    55: { icon: '🌧️', summary: 'Pluvieux' },
    56: { icon: '🌧️', summary: 'Pluvieux' },
    57: { icon: '🌧️', summary: 'Pluvieux' },
    61: { icon: '🌧️', summary: 'Pluvieux' },
    63: { icon: '🌧️', summary: 'Pluvieux' },
    65: { icon: '🌧️', summary: 'Pluvieux' },
    66: { icon: '🌧️', summary: 'Pluvieux' },
    67: { icon: '🌧️', summary: 'Pluvieux' },
    71: { icon: '❄️', summary: 'Neigeux' },
    73: { icon: '❄️', summary: 'Neigeux' },
    75: { icon: '❄️', summary: 'Neigeux' },
    77: { icon: '❄️', summary: 'Neigeux' },
    80: { icon: '🌦️', summary: 'Averses' },
    81: { icon: '🌦️', summary: 'Averses' },
    82: { icon: '🌦️', summary: 'Averses' },
    95: { icon: '⛈️', summary: 'Orageux' },
    96: { icon: '⛈️', summary: 'Orageux' },
    99: { icon: '⛈️', summary: 'Orageux' },
};
function getWeatherInfo(code) {
    if (WEATHER_CODE_MAP[code])
        return WEATHER_CODE_MAP[code];
    if (code >= 1 && code <= 3)
        return { icon: '⛅', summary: 'Nuageux' };
    if (code >= 45 && code <= 48)
        return { icon: '🌫️', summary: 'Brouillard' };
    if (code >= 51 && code <= 67)
        return { icon: '🌧️', summary: 'Pluvieux' };
    if (code >= 71 && code <= 77)
        return { icon: '❄️', summary: 'Neigeux' };
    if (code >= 80 && code <= 82)
        return { icon: '🌦️', summary: 'Averses' };
    if (code >= 95 && code <= 99)
        return { icon: '⛈️', summary: 'Orageux' };
    return { icon: '🌡️', summary: 'Variable' };
}
let TripsService = class TripsService {
    constructor(tripModel, profileModel, userModel, configService) {
        this.tripModel = tripModel;
        this.profileModel = profileModel;
        this.userModel = userModel;
        this.configService = configService;
        const apiKey = this.configService.get('ANTHROPIC_API_KEY');
        if (apiKey) {
            this.anthropic = new sdk_1.default({ apiKey });
        }
    }
    async getUserTrips(user_id) {
        return this.tripModel.find({ user_id }).sort({ created_at: -1 }).exec();
    }
    async getTripById(trip_id) {
        const trip = await this.tripModel.findOne({ id: trip_id }).exec();
        if (!trip) {
            throw new common_1.NotFoundException(`Trip ${trip_id} not found`);
        }
        return trip;
    }
    async fetchWikipediaImage(imageQuery) {
        try {
            const searchResponse = await axios_1.default.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'opensearch',
                    search: imageQuery,
                    limit: 1,
                    format: 'json',
                },
                timeout: 5000,
            });
            const titles = searchResponse.data[1];
            if (!titles || titles.length === 0)
                return null;
            const title = titles[0];
            const pageResponse = await axios_1.default.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    titles: title,
                    prop: 'pageimages',
                    format: 'json',
                    pithumbsize: 400,
                },
                timeout: 5000,
            });
            const pages = pageResponse.data?.query?.pages;
            if (!pages)
                return null;
            const page = Object.values(pages)[0];
            return page?.thumbnail?.source || null;
        }
        catch (err) {
            return null;
        }
    }
    async fetchWeather(lat, lng, durationDays) {
        try {
            const response = await axios_1.default.get('https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude: lat,
                    longitude: lng,
                    daily: 'weathercode,temperature_2m_max,temperature_2m_min',
                    timezone: 'auto',
                    forecast_days: 16,
                },
                timeout: 8000,
            });
            const daily = response.data?.daily;
            if (!daily)
                return [];
            const days = Math.min(durationDays, daily.time?.length || 0);
            const weather = [];
            for (let i = 0; i < days; i++) {
                const code = daily.weathercode[i] ?? 0;
                const info = getWeatherInfo(code);
                weather.push({
                    date: daily.time[i],
                    weather_code: code,
                    temp_max: Math.round(daily.temperature_2m_max[i] ?? 20),
                    temp_min: Math.round(daily.temperature_2m_min[i] ?? 15),
                    icon: info.icon,
                    summary: info.summary,
                });
            }
            return weather;
        }
        catch (err) {
            return [];
        }
    }
    async generatePoisWithClaude(dto) {
        if (!this.anthropic) {
            throw new common_1.HttpException('AI service not configured', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        const minPois = dto.duration_days * 3;
        const maxPois = dto.duration_days * 5;
        const prompt = `Tu es un expert en voyages. Génère un itinéraire JSON pour un voyage à ${dto.destination} pour ${dto.duration_days} jour(s).
Rythme: ${dto.pace}. Transports: ${dto.transports.join(', ')}. Budget: ${dto.budget}. Centres d'intérêt: ${dto.interests.join(', ')}.

Retourne UNIQUEMENT un objet JSON valide avec une clé "pois" contenant un tableau de points d'intérêt.
Génère entre ${minPois} et ${maxPois} POIs au total, répartis sur ${dto.duration_days} jour(s).

Chaque POI doit avoir exactement ces champs:
- name: string (nom du lieu)
- description: string (2-3 phrases en français)
- lat: number (coordonnées GPS réelles et précises)
- lng: number (coordonnées GPS réelles et précises)
- day: number (de 1 à ${dto.duration_days})
- order: number (ordre dans la journée, commence à 1)
- duration_minutes: number (durée de visite estimée)
- category: string (une des catégories: ${dto.interests.join(', ')})
- image_query: string (nom en anglais pour recherche Wikipedia)

IMPORTANT: Les coordonnées GPS doivent être réelles et précises pour ${dto.destination}.
Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
        const message = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = message.content[0];
        if (content.type !== 'text') {
            throw new common_1.HttpException('Unexpected AI response format', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        let jsonText = content.text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        }
        catch (err) {
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                }
                catch {
                    throw new common_1.HttpException('Failed to parse AI response as JSON', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
            else {
                throw new common_1.HttpException('Failed to parse AI response as JSON', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        const pois = (parsed.pois || []).map((p) => ({
            name: p.name || 'Unknown',
            description: p.description || '',
            lat: typeof p.lat === 'number' ? p.lat : parseFloat(p.lat) || 0,
            lng: typeof p.lng === 'number' ? p.lng : parseFloat(p.lng) || 0,
            day: typeof p.day === 'number' ? p.day : parseInt(p.day) || 1,
            order: typeof p.order === 'number' ? p.order : parseInt(p.order) || 1,
            duration_minutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : parseInt(p.duration_minutes) || 60,
            category: p.category || dto.interests[0] || 'culture',
            image_query: p.image_query || p.name || 'travel',
            image_url: null,
        }));
        return pois;
    }
    async awardBadges(profile) {
        const badgesToAward = [];
        if (!profile.badges.includes('first_swipe')) {
            badgesToAward.push('first_swipe');
        }
        if (profile.trips_count >= 1 && !profile.badges.includes('first_trip')) {
            badgesToAward.push('first_trip');
        }
        if (profile.trips_count >= 5 && !profile.badges.includes('globe_trotter')) {
            badgesToAward.push('globe_trotter');
        }
        if (profile.trips_count >= 10 && !profile.badges.includes('explorateur')) {
            badgesToAward.push('explorateur');
        }
        if (profile.streak >= 3 && !profile.badges.includes('en_feu')) {
            badgesToAward.push('en_feu');
        }
        if (badgesToAward.length > 0) {
            await this.profileModel.updateOne({ user_id: profile.user_id }, { $addToSet: { badges: { $each: badgesToAward } } }).exec();
        }
    }
    async generateTrip(user, dto) {
        if (!user.is_pro) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const tripsThisMonth = await this.tripModel.countDocuments({
                user_id: user.user_id,
                created_at: { $gte: startOfMonth },
            }).exec();
            if (tripsThisMonth >= 3) {
                throw new common_1.HttpException({
                    statusCode: 402,
                    message: 'Free plan limit reached. Upgrade to Pro for unlimited trips.',
                    error: 'Payment Required',
                }, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
        }
        const pois = await this.generatePoisWithClaude(dto);
        const poisWithImages = await Promise.all(pois.map(async (poi) => {
            const imageUrl = await this.fetchWikipediaImage(poi.image_query);
            return { ...poi, image_url: imageUrl };
        }));
        const firstPoi = poisWithImages.find((p) => p.lat !== 0 && p.lng !== 0);
        const lat = firstPoi?.lat ?? 48.8566;
        const lng = firstPoi?.lng ?? 2.3522;
        const weather = await this.fetchWeather(lat, lng, dto.duration_days);
        const tripId = (0, uuid_1.v4)();
        const trip = await this.tripModel.create({
            id: tripId,
            user_id: user.user_id,
            destination: dto.destination,
            duration_days: dto.duration_days,
            pace: dto.pace,
            transports: dto.transports,
            budget: dto.budget,
            interests: dto.interests,
            pois: poisWithImages,
            weather,
            is_public: true,
            likes: 0,
            created_at: new Date(),
        });
        const profile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
        if (profile) {
            const newXp = profile.xp + 50;
            const newLevel = Math.floor(newXp / 100) + 1;
            const newTripsCount = profile.trips_count + 1;
            await this.profileModel.updateOne({ user_id: user.user_id }, {
                $set: {
                    xp: newXp,
                    level: newLevel,
                    trips_count: newTripsCount,
                    last_active: new Date(),
                },
            }).exec();
            const updatedProfile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
            if (updatedProfile) {
                await this.awardBadges(updatedProfile);
            }
        }
        return trip;
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trip_schema_1.Trip.name)),
    __param(1, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], TripsService);
//# sourceMappingURL=trips.service.js.map