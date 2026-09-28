import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { POI, DayWeather } from '../trips/schemas/trip.schema';
import { GenerateTripDto } from '../trips/dto/generate-trip.dto';

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
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.logger.log('Gemini AI client initialized successfully');
    }

    const anthropicKey =
      this.configService.get<string>('ANTHROPIC_API_KEY') ||
      this.configService.get<string>('CLAUDE_CODE_OAUTH_TOKEN');

    if (anthropicKey && anthropicKey.trim().length > 0) {
      const cleanKey = anthropicKey.trim();
      try {
        if (cleanKey.startsWith('sk-ant-oat')) {
          this.anthropic = new Anthropic({
            authToken: cleanKey,
          });
          this.logger.log('Anthropic Claude client initialized with OAuth Token');
        } else {
          this.anthropic = new Anthropic({
            apiKey: cleanKey,
          });
          this.logger.log('Anthropic Claude client initialized with API Key');
        }
      } catch (err) {
        this.logger.warn(`Failed to initialize Anthropic client: ${err.message}`);
      }
    }
  }

  async generatePois(dto: GenerateTripDto): Promise<POI[]> {
    // 1. Try Claude first if configured (Voyago Core AI Engine)
    if (this.anthropic) {
      try {
        return await this.generateWithClaude(dto);
      } catch (err) {
        this.logger.warn(`Claude generation error: ${err.message}. Falling back to Gemini AI...`);
      }
    }

    // 2. Try Gemini AI (Gemini 2.0 / 1.5 Flash)
    if (this.genAI) {
      try {
        return await this.generateWithGemini(dto);
      } catch (err) {
        this.logger.warn(`Gemini generation error: ${err.message}. Using intelligent mock fallback...`);
      }
    }

    // 3. Fallback to high quality mock data
    return this.generateMockPois(dto);
  }

  private getCityCoordinates(destination: string): { lat: number; lng: number } {
    const dest = destination.toLowerCase().trim();
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      abidjan: { lat: 5.3600, lng: -4.0083 },
      paris: { lat: 48.8566, lng: 2.3522 },
      tokyo: { lat: 35.6762, lng: 139.6503 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      londres: { lat: 51.5074, lng: -0.1278 },
      london: { lat: 51.5074, lng: -0.1278 },
      dakar: { lat: 14.7167, lng: -17.4677 },
      marrakech: { lat: 31.6295, lng: -7.9811 },
      rome: { lat: 41.9028, lng: 12.4964 },
      barcelone: { lat: 41.3879, lng: 2.1699 },
      barcelona: { lat: 41.3879, lng: 2.1699 },
      montreal: { lat: 45.5017, lng: -73.5673 },
      bangkok: { lat: 13.7563, lng: 100.5018 },
      dubai: { lat: 25.2048, lng: 55.2708 },
      rio: { lat: -22.9068, lng: -43.1729 },
      sydney: { lat: -33.8688, lng: 151.2093 },
      berlin: { lat: 52.5200, lng: 13.4050 },
      amsterdam: { lat: 52.3676, lng: 4.9041 },
      lisbonne: { lat: 38.7223, lng: -9.1393 },
      lisbon: { lat: 38.7223, lng: -9.1393 },
    };

    for (const [key, coords] of Object.entries(cityCoords)) {
      if (dest.includes(key)) return coords;
    }
    return { lat: 5.3600, lng: -4.0083 };
  }

  private async generateWithGemini(dto: GenerateTripDto): Promise<POI[]> {
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.0-flash-lite',
    ];
    const minPois = dto.duration_days * 3;
    const maxPois = dto.duration_days * 5;

    const prompt = `Tu es Voyago, un expert passionné de voyages et guide local virtuel. Tu crées des itinéraires immersifs et personnalisés.

MISSION : Génère un itinéraire de voyage exceptionnel et réaliste pour ${dto.destination} sur ${dto.duration_days} jour(s).

PROFIL DU VOYAGEUR :
- Rythme : ${dto.pace} (${dto.pace === 'tranquille' ? '3 activités/jour max, longues pauses' : dto.pace === 'intensif' ? '5+ activités/jour, rythme soutenu' : '3-4 activités/jour, pauses modérées'})
- Transports : ${dto.transports.join(', ')}
- Budget : ${dto.budget} (${dto.budget === 'economique' ? 'privilégier gratuit et bon marché' : dto.budget === 'luxe' ? 'expériences premium et exclusives' : 'bon rapport qualité-prix'})
- Centres d'intérêt : ${dto.interests.join(', ')}

RÈGLES ABSOLUES :
1. Utilise des VRAIS noms de lieux, restaurants, musées, parcs (ex: "Musée du Louvre", pas "Musée des Beaux-Arts")
2. Les coordonnées GPS (lat/lng) doivent être EXACTES et correspondre au lieu réel
3. Répartis les POIs logiquement par proximité géographique dans chaque journée
4. Alterne les types d'activités (pas 3 musées d'affilée)
5. Chaque description doit contenir un conseil d'initié unique et personnel
6. L'image_query doit être le nom anglais exact du lieu pour trouver son article Wikipedia

Retourne UNIQUEMENT un objet JSON valide avec une clé "pois" contenant un tableau de ${minPois} à ${maxPois} points d'intérêt.

Chaque POI doit respecter exactement ce schéma JSON :
{
  "name": "string (nom RÉEL et précis du lieu, ex: Café de Flore, Tour Eiffel)",
  "description": "string (2-3 phrases immersives en français avec un conseil d'initié, ex: 'Arrivez avant 10h pour éviter la foule et admirer la vue sans attente.')",
  "lat": number (latitude GPS EXACTE du lieu réel),
  "lng": number (longitude GPS EXACTE du lieu réel),
  "day": number (de 1 à ${dto.duration_days}),
  "order": number (ordre chronologique dans la journée, commence à 1),
  "duration_minutes": number (durée réaliste : 45 pour un café, 120 pour un musée, 90 pour un parc),
  "category": "string (parmi: ${dto.interests.join(', ')}, gastronomie, culture, nature, art, nightlife, bien_etre, shopping)",
  "image_query": "string (nom anglais du lieu pour Wikipedia, ex: 'Eiffel Tower', 'Louvre Museum')",
  "rating": number (note entre 4.3 et 4.9),
  "reviews_count": number (nombre d'avis entre 500 et 15000),
  "insider_tip": "string (conseil secret ou spécialité locale à ne pas manquer, ex: 'Commandez le chocolat chaud à l\\'ancienne au fond du salon')"
}

IMPORTANT : Pas de markdown, pas de balise \`\`\`json, UNIQUEMENT le texte brut JSON valide.`;


    for (const modelName of modelsToTry) {
      try {
        this.logger.log(`Attempting trip generation with Gemini model: ${modelName}`);
        const model = this.genAI!.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonText = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(jsonText);
        if (parsed.pois && Array.isArray(parsed.pois) && parsed.pois.length > 0) {
          return this.sanitizePois(parsed.pois, dto);
        }
      } catch (err) {
        this.logger.warn(`Model ${modelName} error: ${err.message}`);
      }
    }

    throw new Error('All Gemini models failed to produce valid POIs');
  }

  private async generateWithClaude(dto: GenerateTripDto): Promise<POI[]> {
    const minPois = dto.duration_days * 3;
    const maxPois = dto.duration_days * 5;
    const modelsToTry = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
      'claude-sonnet-4-5',
    ];

    const prompt = `Tu es Voyago, un expert passionné de voyages et guide local virtuel. Tu crées des itinéraires immersifs et personnalisés.

MISSION : Génère un itinéraire de voyage exceptionnel et réaliste pour ${dto.destination} sur ${dto.duration_days} jour(s).

PROFIL DU VOYAGEUR :
- Rythme : ${dto.pace}
- Transports : ${dto.transports.join(', ')}
- Budget : ${dto.budget}
- Centres d'intérêt : ${dto.interests.join(', ')}

RÈGLES :
1. Utilise des VRAIS noms de lieux (ex: "Café de Flore", pas "Café Historique")
2. Coordonnées GPS EXACTES des lieux réels
3. Répartis par proximité géographique dans chaque journée
4. Alterne les types d'activités
5. Chaque description = conseil d'initié unique

Retourne UNIQUEMENT un JSON valide : {"pois": [...]} avec ${minPois} à ${maxPois} POIs.
Chaque POI : { name, description, lat, lng, day, order, duration_minutes, category, image_query, rating, reviews_count, insider_tip }
- image_query = nom anglais du lieu pour Wikipedia (ex: "Eiffel Tower")
- category parmi: ${dto.interests.join(', ')}, gastronomie, culture, nature, art, nightlife, bien_etre, shopping
- rating = nombre entre 4.3 et 4.9
- reviews_count = nombre entre 500 et 15000
- insider_tip = astuce secrète d'initié`;

    for (const model of modelsToTry) {
      try {
        this.logger.log(`Attempting trip generation with Claude model: ${model}`);
        const message = await this.anthropic!.messages.create({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });

        const content = message.content[0];
        if (content.type !== 'text') continue;

        let jsonText = content.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonText);
        if (parsed.pois && Array.isArray(parsed.pois) && parsed.pois.length > 0) {
          return this.sanitizePois(parsed.pois, dto);
        }
      } catch (err) {
        this.logger.warn(`Claude model ${model} error: ${err.message}`);
      }
    }

    throw new Error('All Claude models failed to generate valid POIs');
  }

  private sanitizePois(rawPois: any[], dto: GenerateTripDto): POI[] {
    const coords = this.getCityCoordinates(dto.destination);
    return rawPois.map((p, idx) => ({
      name: p.name || `Étape ${idx + 1}`,
      description: p.description || `Découverte inoubliable à ${dto.destination}.`,
      lat: typeof p.lat === 'number' && p.lat !== 0 ? p.lat : parseFloat(p.lat) || (coords.lat + (idx * 0.005)),
      lng: typeof p.lng === 'number' && p.lng !== 0 ? p.lng : parseFloat(p.lng) || (coords.lng - (idx * 0.005)),
      day: typeof p.day === 'number' ? p.day : parseInt(p.day) || Math.floor(idx / 3) + 1,
      order: typeof p.order === 'number' ? p.order : (idx % 3) + 1,
      duration_minutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : 90,
      category: p.category || dto.interests[0] || 'culture',
      image_query: p.image_query || p.name || dto.destination,
      image_url: null,
      rating: typeof p.rating === 'number' ? p.rating : 4.7,
      reviews_count: typeof p.reviews_count === 'number' ? p.reviews_count : 1250,
      insider_tip: p.insider_tip || null,
    }));
  }

  private generateMockPois(dto: GenerateTripDto): POI[] {
    const pois: POI[] = [];
    const coords = this.getCityCoordinates(dto.destination);
    const activities = [
      { name: 'Centre Historique & Rues Anciennes', cat: 'culture', desc: `Balade au cœur de ${dto.destination} et découverte du patrimoine.` },
      { name: 'Marché Local & Spécialités', cat: 'gastronomie', desc: `Dégustation des produits régionaux et de la cuisine typique de ${dto.destination}.` },
      { name: 'Parc & Belvédère Panoramique', cat: 'nature', desc: `Superbe vue panoramique et moment de détente en plein air.` },
      { name: 'Musée des Beaux-Arts & Galerie', cat: 'art', desc: `Exploration des trésors culturels et expositions remarquables.` },
      { name: 'Bord de l\'eau & Promenade', cat: 'bien_etre', desc: `Promenade relaxante le long des quais et coucher de soleil.` },
      { name: 'Soirée Gourmande & Ambiance', cat: 'nightlife', desc: `Dîner convivial dans l'un des quartiers les plus animés.` },
    ];

    for (let day = 1; day <= dto.duration_days; day++) {
      for (let order = 1; order <= 3; order++) {
        const actIndex = (day * 3 + order) % activities.length;
        const act = activities[actIndex];
        pois.push({
          name: `${act.name} (${dto.destination})`,
          description: act.desc,
          lat: coords.lat + (day * 0.006) + (order * 0.003),
          lng: coords.lng + (day * 0.006) - (order * 0.003),
          day,
          order,
          duration_minutes: 90,
          category: act.cat,
          image_query: `${dto.destination} travel`,
          image_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(dto.destination + ' ' + act.name + ' travel 4k')}`,
        });
      }
    }

    return pois;
  }

  async fetchWikipediaImage(imageQuery: string): Promise<string | null> {
    try {
      const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'opensearch',
          search: imageQuery,
          limit: 1,
          format: 'json',
        },
        timeout: 4000,
      });

      const titles: string[] = searchResponse.data[1];
      if (!titles || titles.length === 0) {
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(imageQuery + ' travel photo')}`;
      }

      const title = titles[0];
      const pageResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          titles: title,
          prop: 'pageimages',
          format: 'json',
          pithumbsize: 600,
        },
        timeout: 4000,
      });

      const pages = pageResponse.data?.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages)[0] as any;
      return page?.thumbnail?.source || `https://image.pollinations.ai/prompt/${encodeURIComponent(imageQuery + ' travel landscape')}`;
    } catch {
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(imageQuery + ' travel photo')}`;
    }
  }

  async fetchWeather(lat: number, lng: number, durationDays: number): Promise<DayWeather[]> {
    try {
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'weathercode,temperature_2m_max,temperature_2m_min',
          timezone: 'auto',
          forecast_days: 16,
        },
        timeout: 5000,
      });

      const daily = response.data?.daily;
      if (!daily) return this.generateFallbackWeather(durationDays);

      const days = Math.min(durationDays, daily.time?.length || 0);
      const weather: DayWeather[] = [];

      for (let i = 0; i < days; i++) {
        const code = daily.weathercode[i] ?? 0;
        const info = getWeatherInfo(code);
        weather.push({
          date: daily.time[i],
          weather_code: code,
          temp_max: Math.round(daily.temperature_2m_max[i] ?? 22),
          temp_min: Math.round(daily.temperature_2m_min[i] ?? 16),
          icon: info.icon,
          summary: info.summary,
        });
      }

      return weather;
    } catch {
      return this.generateFallbackWeather(durationDays);
    }
  }

  private generateFallbackWeather(durationDays: number): DayWeather[] {
    const weather: DayWeather[] = [];
    const now = new Date();

    for (let i = 0; i < durationDays; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      weather.push({
        date: date.toISOString().split('T')[0],
        weather_code: 0,
        temp_max: 23,
        temp_min: 17,
        icon: '☀️',
        summary: 'Ensoleillé',
      });
    }

    return weather;
  }
}
