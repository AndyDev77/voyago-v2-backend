import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

import { Trip, TripDocument, POI, DayWeather } from './schemas/trip.schema';
import { Profile, ProfileDocument } from '../gamification/schemas/profile.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { GenerateTripDto } from './dto/generate-trip.dto';

const WEATHER_CODE_MAP: Record<number, { icon: string; summary: string }> = {
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

function getWeatherInfo(code: number): { icon: string; summary: string } {
  if (WEATHER_CODE_MAP[code]) return WEATHER_CODE_MAP[code];
  if (code >= 1 && code <= 3) return { icon: '⛅', summary: 'Nuageux' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', summary: 'Brouillard' };
  if (code >= 51 && code <= 67) return { icon: '🌧️', summary: 'Pluvieux' };
  if (code >= 71 && code <= 77) return { icon: '❄️', summary: 'Neigeux' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', summary: 'Averses' };
  if (code >= 95 && code <= 99) return { icon: '⛈️', summary: 'Orageux' };
  return { icon: '🌡️', summary: 'Variable' };
}

@Injectable()
export class TripsService {
  private anthropic: Anthropic;

  constructor(
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async getUserTrips(user_id: string): Promise<Trip[]> {
    return this.tripModel.find({ user_id }).sort({ created_at: -1 }).exec();
  }

  async getTripById(trip_id: string): Promise<Trip> {
    const trip = await this.tripModel.findOne({ id: trip_id }).exec();
    if (!trip) {
      throw new NotFoundException(`Trip ${trip_id} not found`);
    }
    return trip;
  }

  private async fetchWikipediaImage(imageQuery: string): Promise<string | null> {
    try {
      const searchResponse = await axios.get(
        'https://en.wikipedia.org/w/api.php',
        {
          params: {
            action: 'opensearch',
            search: imageQuery,
            limit: 1,
            format: 'json',
          },
          timeout: 5000,
        },
      );

      const titles: string[] = searchResponse.data[1];
      if (!titles || titles.length === 0) return null;

      const title = titles[0];

      const pageResponse = await axios.get(
        'https://en.wikipedia.org/w/api.php',
        {
          params: {
            action: 'query',
            titles: title,
            prop: 'pageimages',
            format: 'json',
            pithumbsize: 400,
          },
          timeout: 5000,
        },
      );

      const pages = pageResponse.data?.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages)[0] as any;
      return page?.thumbnail?.source || null;
    } catch (err) {
      return null;
    }
  }

  private async fetchWeather(lat: number, lng: number, durationDays: number): Promise<DayWeather[]> {
    try {
      const response = await axios.get(
        'https://api.open-meteo.com/v1/forecast',
        {
          params: {
            latitude: lat,
            longitude: lng,
            daily: 'weathercode,temperature_2m_max,temperature_2m_min',
            timezone: 'auto',
            forecast_days: 16,
          },
          timeout: 8000,
        },
      );

      const daily = response.data?.daily;
      if (!daily) return [];

      const days = Math.min(durationDays, daily.time?.length || 0);
      const weather: DayWeather[] = [];

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
    } catch (err) {
      return [];
    }
  }

  private async generatePoisWithClaude(dto: GenerateTripDto): Promise<POI[]> {
    if (!this.anthropic) {
      throw new HttpException('AI service not configured', HttpStatus.SERVICE_UNAVAILABLE);
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
      throw new HttpException('Unexpected AI response format', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let jsonText = content.text.trim();

    // Strip markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      // Try to extract JSON object from the text
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          throw new HttpException('Failed to parse AI response as JSON', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      } else {
        throw new HttpException('Failed to parse AI response as JSON', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    const pois: POI[] = (parsed.pois || []).map((p: any) => ({
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

  private async awardBadges(profile: ProfileDocument): Promise<void> {
    const badgesToAward: string[] = [];

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
      await this.profileModel.updateOne(
        { user_id: profile.user_id },
        { $addToSet: { badges: { $each: badgesToAward } } },
      ).exec();
    }
  }

  async generateTrip(user: UserDocument, dto: GenerateTripDto): Promise<Trip> {
    // Check freemium limit: 3 trips per month for non-pro users
    if (!user.is_pro) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const tripsThisMonth = await this.tripModel.countDocuments({
        user_id: user.user_id,
        created_at: { $gte: startOfMonth },
      }).exec();

      if (tripsThisMonth >= 3) {
        throw new HttpException(
          {
            statusCode: 402,
            message: 'Free plan limit reached. Upgrade to Pro for unlimited trips.',
            error: 'Payment Required',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    // Generate POIs with Claude
    const pois = await this.generatePoisWithClaude(dto);

    // Fetch Wikipedia images in parallel
    const poisWithImages = await Promise.all(
      pois.map(async (poi) => {
        const imageUrl = await this.fetchWikipediaImage(poi.image_query);
        return { ...poi, image_url: imageUrl };
      }),
    );

    // Use first POI coordinates for weather (or fallback to 0,0)
    const firstPoi = poisWithImages.find((p) => p.lat !== 0 && p.lng !== 0);
    const lat = firstPoi?.lat ?? 48.8566;
    const lng = firstPoi?.lng ?? 2.3522;

    // Fetch weather
    const weather = await this.fetchWeather(lat, lng, dto.duration_days);

    // Create trip document
    const tripId = uuidv4();
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

    // Update profile: award XP, increment trips_count, check badges
    const profile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
    if (profile) {
      const newXp = profile.xp + 50;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newTripsCount = profile.trips_count + 1;

      await this.profileModel.updateOne(
        { user_id: user.user_id },
        {
          $set: {
            xp: newXp,
            level: newLevel,
            trips_count: newTripsCount,
            last_active: new Date(),
          },
        },
      ).exec();

      // Reload profile for badge check
      const updatedProfile = await this.profileModel.findOne({ user_id: user.user_id }).exec();
      if (updatedProfile) {
        await this.awardBadges(updatedProfile);
      }
    }

    return trip;
  }
}
