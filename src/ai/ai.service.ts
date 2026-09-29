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
            apiKey: null as any,
            authToken: cleanKey,
          });
          this.logger.log('Anthropic Claude client initialized with OAuth Token (Bearer auth)');
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

  private getThermalSensitivityNote(sensitivity?: string): string {
    if (sensitivity === 'cold') {
      return 'Frileux / Sensible au froid (privilégier les lieux abrités, cafés chaleureux, intérieurs cosy lors des journées fraîches, et adapter les conseils vestimentaires pour prévoir des couches bien chaudes)';
    }
    if (sensitivity === 'warm') {
      return 'Chaleureux / Craint la chaleur (privilégier les lieux ombragés, espaces climatisés, parcs avec fontaines ou terrasses aérées aux heures chaudes, et vêtements légers / respirants)';
    }
    return 'Équilibré / Tempéré standard (confortable dans les conditions moyennes de saison)';
  }

  private async generateWithGemini(dto: GenerateTripDto): Promise<POI[]> {
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-2.5-flash-lite',
    ];

    const activitiesPerDay = dto.pace === 'tranquille' ? 3 : dto.pace === 'intensif' ? 5 : 4;
    const totalPoisCount = dto.duration_days * activitiesPerDay;

    const prompt = `Tu es Voyago, l'intelligence artificielle experte en voyages haut de gamme et guide local d'élite.
Tu conçois des itinéraires hyper-personnalisés, authentiques et immersifs.

OBJECTIF MAJEUR :
Génère l'itinéraire COMPLET pour ${dto.destination} sur STRICTEMENT ${dto.duration_days} JOUR(S).
Tu dois impérativement couvrir CHAQUE JOUR du voyage (Jour 1, Jour 2, ... jusqu'à Jour ${dto.duration_days}).

PROFIL ET PRÉFÉRENCES DU VOYAGEUR :
- Destination : ${dto.destination}
- Durée exacte : ${dto.duration_days} jour(s)
- Centres d'intérêt prioritaires : ${dto.interests.join(', ')}
- Rythme souhaité : ${dto.pace} (${activitiesPerDay} activités sélectionnées par jour)
- Mode de déplacement : ${dto.transports.join(', ')}
- Budget : ${dto.budget}
- Sensibilité thermique du voyageur : ${this.getThermalSensitivityNote(dto.thermal_sensitivity)}

EXIGENCES D'AUTHENTICITÉ ET DE QUALITÉ :
1. VRAIS LIEUX UNIQUEMENT : Propose de vrais établissements, monuments historiques célèbres, restaurants réputés, musées emblématiques ou pépites secrètes existant réellement à ${dto.destination}. Aucun nom générique ou fictif.
2. COORDONNÉES GPS RÉELLES : Chaque lieu doit comporter sa latitude ('lat') et longitude ('lng') réelles et précises dans la ville de ${dto.destination}.
3. DISTRIBUTION PAR JOUR CHRONOLOGIQUE :
   - Pour chaque jour d = 1..${dto.duration_days}, propose ${activitiesPerDay} lieux ordonnés (order: 1 = Matin, order: 2 = Déjeuner/Midi, order: 3 = Après-midi, order: 4 = Fin d'après-midi / Soirée).
   - Les étapes d'un même jour doivent être géographiquement cohérentes (évite les traversées inutiles de la ville).
4. CENTRES D'INTÉRÊT : Au moins 70% des lieux doivent correspondre directement aux centres d'intérêt choisis (${dto.interests.join(', ')}). Alterne intelligemment entre culture, gastronomie, détente, art et nature.
5. CONSEILS D'INITIÉ ET ADAPTATION MÉTÉO/THERMIQUE : Chaque lieu doit contenir une astuce ('insider_tip') concrète, pratique et exclusive en français (ex: le meilleur plat ou cocktail, astuce vestimentaire adaptée à sa sensibilité thermique ${dto.thermal_sensitivity || 'équilibrée'}, horaire idéal pour éviter la foule).
6. STATS & NOTATION :
   - rating : note réaliste entre 4.4 et 4.9
   - reviews_count : nombre d'avis réels entre 850 et 24000

Format JSON attendu :
{
  "pois": [
    {
      "name": "Nom exact et réel du lieu",
      "description": "2 à 3 phrases immersives décrivant l'histoire et l'expérience sur place.",
      "lat": 48.8566,
      "lng": 2.3522,
      "day": 1,
      "order": 1,
      "duration_minutes": 90,
      "category": "gastronomie",
      "image_query": "English name for photo lookup",
      "rating": 4.8,
      "reviews_count": 3200,
      "insider_tip": "Conseil d'initié concret"
    }
  ]
}
Génère au total exactement ${totalPoisCount} POIs répartis équitablement sur les ${dto.duration_days} jour(s).
Retourne UNIQUEMENT l'objet JSON.`;

    for (const modelName of modelsToTry) {
      try {
        this.logger.log(`Attempting trip generation with Gemini model: ${modelName}`);
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
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
    const activitiesPerDay = dto.pace === 'tranquille' ? 3 : dto.pace === 'intensif' ? 5 : 4;
    const totalPoisCount = dto.duration_days * activitiesPerDay;

    const modelsToTry = [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6',
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-5',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ];

    const prompt = `Tu es Voyago, l'intelligence artificielle experte en voyages haut de gamme et guide local d'élite.
Tu conçois des itinéraires hyper-personnalisés, authentiques et immersifs.

OBJECTIF MAJEUR :
Génère l'itinéraire COMPLET pour ${dto.destination} sur STRICTEMENT ${dto.duration_days} JOUR(S).
Tu dois impérativement couvrir CHAQUE JOUR du voyage (Jour 1, Jour 2, ... jusqu'à Jour ${dto.duration_days}).

PROFIL ET PRÉFÉRENCES DU VOYAGEUR :
- Destination : ${dto.destination}
- Durée exacte : ${dto.duration_days} jour(s)
- Centres d'intérêt prioritaires : ${dto.interests.join(', ')}
- Rythme souhaité : ${dto.pace} (${activitiesPerDay} activités sélectionnées par jour)
- Mode de déplacement : ${dto.transports.join(', ')}
- Budget : ${dto.budget}
- Sensibilité thermique du voyageur : ${this.getThermalSensitivityNote(dto.thermal_sensitivity)}

EXIGENCES D'AUTHENTICITÉ ET DE QUALITÉ :
1. VRAIS LIEUX UNIQUEMENT : Propose de vrais établissements, monuments historiques célèbres, restaurants réputés, musées emblématiques ou pépites secrètes existant réellement à ${dto.destination}. Aucun nom générique ou fictif.
2. COORDONNÉES GPS RÉELLES : Chaque lieu doit comporter sa latitude ('lat') et longitude ('lng') réelles et précises dans la ville de ${dto.destination}.
3. DISTRIBUTION PAR JOUR CHRONOLOGIQUE :
   - Pour chaque jour d = 1..${dto.duration_days}, propose ${activitiesPerDay} lieux ordonnés (order: 1 = Matin, order: 2 = Déjeuner/Midi, order: 3 = Après-midi, order: 4 = Fin d'après-midi / Soirée).
   - Les étapes d'un même jour doivent être géographiquement cohérentes.
4. CENTRES D'INTÉRÊT : Au moins 70% des lieux doivent correspondre directement aux centres d'intérêt choisis (${dto.interests.join(', ')}).
5. CONSEILS D'INITIÉ ET ADAPTATION THERMIQUE : Chaque lieu doit contenir une astuce ('insider_tip') concrète, pratique et exclusive en français (en tenant compte de sa sensibilité ${dto.thermal_sensitivity || 'équilibrée'} pour l'habillement et le confort).
6. STATS & NOTATION :
   - rating : note réaliste entre 4.4 et 4.9
   - reviews_count : nombre d'avis réels entre 850 et 24000

Format JSON attendu :
{
  "pois": [
    {
      "name": "Nom exact et réel du lieu",
      "description": "2 à 3 phrases immersives décrivant l'histoire et l'expérience sur place.",
      "lat": 48.8566,
      "lng": 2.3522,
      "day": 1,
      "order": 1,
      "duration_minutes": 90,
      "category": "gastronomie",
      "image_query": "English name for photo lookup",
      "rating": 4.8,
      "reviews_count": 3200,
      "insider_tip": "Conseil d'initié concret"
    }
  ]
}
Génère au total exactement ${totalPoisCount} POIs répartis équitablement sur les ${dto.duration_days} jour(s).
Retourne UNIQUEMENT l'objet JSON.`;

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
    const perDay = Math.ceil(rawPois.length / dto.duration_days);

    return rawPois.map((p, idx) => {
      const calculatedDay = typeof p.day === 'number' && p.day >= 1 && p.day <= dto.duration_days
        ? p.day
        : Math.min(dto.duration_days, Math.floor(idx / perDay) + 1);

      const calculatedOrder = typeof p.order === 'number' ? p.order : (idx % perDay) + 1;
      const cat = p.category || dto.interests[idx % dto.interests.length] || 'culture';

      return {
        name: p.name || `Étape ${idx + 1}`,
        description: p.description || `Découverte inoubliable à ${dto.destination}.`,
        lat: typeof p.lat === 'number' && p.lat !== 0 ? p.lat : parseFloat(p.lat) || (coords.lat + (idx * 0.004) - 0.008),
        lng: typeof p.lng === 'number' && p.lng !== 0 ? p.lng : parseFloat(p.lng) || (coords.lng - (idx * 0.004) + 0.008),
        day: calculatedDay,
        order: calculatedOrder,
        duration_minutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : 90,
        category: cat,
        image_query: p.image_query || p.name || dto.destination,
        image_url: p.image_url || this.getCuratedPhoto(cat, dto.destination),
        rating: typeof p.rating === 'number' ? p.rating : 4.8,
        reviews_count: typeof p.reviews_count === 'number' ? p.reviews_count : 2400,
        insider_tip: p.insider_tip || `Conseil Voyago : arrivez tôt le matin pour savourer le lieu au calme.`,
      };
    });
  }

  private getCuratedPhoto(category: string, destination: string): string {
    const photosByCategory: Record<string, string> = {
      gastronomie: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
      culture: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
      art: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      nature: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
      nightlife: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
      bien_etre: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
      shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
      architecture: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    };
    return photosByCategory[category] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80';
  }

  private generateMockPois(dto: GenerateTripDto): POI[] {
    const dest = dto.destination.toLowerCase().trim();
    const cityCoords = this.getCityCoordinates(dto.destination);
    const interests = dto.interests && dto.interests.length > 0 ? dto.interests : ['culture', 'gastronomie'];

    // Base de données de vrais lieux réels par ville
    const curatedVenuesByCity: Record<string, Array<{ name: string; cat: string; desc: string; lat: number; lng: number; rating: number; reviews: number; tip: string; img: string }>> = {
      paris: [
        {
          name: 'Café de Flore',
          cat: 'gastronomie',
          desc: 'Café littéraire mythique de Saint-Germain-des-Prés, repaire d\'artistes et intellectuels depuis 1887.',
          lat: 48.8541,
          lng: 2.3328,
          rating: 4.8,
          reviews: 2400,
          tip: 'Dégustez leur fameux chocolat chaud à l\'ancienne servi dans son pot en argent.',
          img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Musée du Louvre & Cour Carrée',
          cat: 'culture',
          desc: 'Le plus grand musée d\'art du monde abritant des chefs-d\'œuvre inestimables dans un palais royal.',
          lat: 48.8606,
          lng: 2.3376,
          rating: 4.9,
          reviews: 14200,
          tip: 'Entrez par le Carrousel du Louvre pour éviter la longue file sous la pyramide principale.',
          img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Jardin des Tuileries & Grand Bassin',
          cat: 'nature',
          desc: 'Magnifique parc à la française conçu par Le Nôtre, parfait pour une balade paisible entre sculptures et fontaines.',
          lat: 48.8634,
          lng: 2.3275,
          rating: 4.7,
          reviews: 5800,
          tip: 'Profitez des célèbres chaises vertes inclinées au bord du grand bassin octogonal.',
          img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sainte-Chapelle & Île de la Cité',
          cat: 'culture',
          desc: 'Joyau de l\'architecture gothique rayonnante avec ses 1113 vitraux s\'élevant vers le ciel.',
          lat: 48.8554,
          lng: 2.3450,
          rating: 4.9,
          reviews: 8900,
          tip: 'Visitez par temps clair en fin de matinée : la lumière à travers les vitraux est magique.',
          img: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Le Comptoir du Relais',
          cat: 'gastronomie',
          desc: 'Bistronomie d\'exception d\'Yves Camdeborde au cœur du quartier de l\'Odéon.',
          lat: 48.8520,
          lng: 2.3385,
          rating: 4.7,
          reviews: 3100,
          tip: 'Arrivez dès 12h00 précises pour vous installer en terrasse sans réservation préalable.',
          img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Musée d\'Orsay & Grande Horloge',
          cat: 'art',
          desc: 'Ancienne gare ferroviaire monumentale transformée en temple mondial de l\'impressionnisme.',
          lat: 48.8599,
          lng: 2.3265,
          rating: 4.9,
          reviews: 11500,
          tip: 'Montez au 5e étage : la verrière de l\'horloge géante offre un panorama exceptionnel sur la Seine.',
          img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Montmartre & Place du Tertre',
          cat: 'art',
          desc: 'Village bohème perché sur la butte, berceau de Picasso, Renoir et des peintres de rue.',
          lat: 48.8867,
          lng: 2.3431,
          rating: 4.8,
          reviews: 9400,
          tip: 'Prenez la rue de l\'Abreuvoir pour admirer la Maison Rose au coucher du soleil.',
          img: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Septime Restaurant & Vins Naturels',
          cat: 'gastronomie',
          desc: 'Table gastronomique étoilée de Bertrand Grébaut, réputée pour sa créativité éco-responsable.',
          lat: 48.8532,
          lng: 2.3811,
          rating: 4.9,
          reviews: 4200,
          tip: 'Accompagnez votre menu dégustation de l\'accord vins naturels sélectionnés par le sommelier.',
          img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Atelier des Lumières',
          cat: 'art',
          desc: 'Centre d\'art numérique immersif projetant les chefs-d\'œuvre des plus grands artistes en musique.',
          lat: 48.8617,
          lng: 2.3789,
          rating: 4.8,
          reviews: 6700,
          tip: 'Installez-vous au milieu du hall principal pour être entièrement enveloppé par les projections.',
          img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Pont Alexandre III & Rives de Seine',
          cat: 'nightlife',
          desc: 'Le pont le plus somptueux de Paris avec ses candélabres dorés et ses terrasses animées au bord de l\'eau.',
          lat: 48.8638,
          lng: 2.3134,
          rating: 4.8,
          reviews: 7300,
          tip: 'Venez en début de soirée pour contempler la Tour Eiffel scintillante sur l\'eau.',
          img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Le Marais & Place des Vosges',
          cat: 'shopping',
          desc: 'Quartier historique bordé d\'hôtels particuliers, de boutiques de créateurs et de galeries branchées.',
          lat: 48.8555,
          lng: 2.3654,
          rating: 4.8,
          reviews: 5100,
          tip: 'Flânez sous les arcades de briques rouges de la plus ancienne place royale de Paris.',
          img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Jardin du Luxembourg & Fontaine Médicis',
          cat: 'bien_etre',
          desc: 'Oasis de quiétude de 25 hectares prisée pour ses allées ombragées et sa fontaine romantique.',
          lat: 48.8462,
          lng: 2.3371,
          rating: 4.8,
          reviews: 6200,
          tip: 'La fontaine Médicis à l\'ombre des platanes est l\'endroit le plus serein pour lire ou se détendre.',
          img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
        },
      ],
      tokyo: [
        {
          name: 'Senso-ji Temple & Asakusa',
          cat: 'culture',
          desc: 'Le plus ancien temple bouddhiste de Tokyo avec sa porte Kaminarimon et sa lanterne rouge géante.',
          lat: 35.7147,
          lng: 139.7967,
          rating: 4.8,
          reviews: 15400,
          tip: 'Tirez un oracle omikuji et goûtez les douceurs traditionnelles dans l\'allée Nakamise.',
          img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Tsukiji Outer Market',
          cat: 'gastronomie',
          desc: 'Marché gourmand historique réputé pour ses sashimis de thon rouge et ses échoppes de street food.',
          lat: 35.6655,
          lng: 139.7708,
          rating: 4.7,
          reviews: 8200,
          tip: 'Dégustez un tamagoyaki chaud préparé à la minute devant vous par les maîtres artisans.',
          img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'teamLab Planets',
          cat: 'art',
          desc: 'Musée immersif multisensoriel où les visiteurs déambulent pieds nus dans des œuvres d\'art numériques vivantes.',
          lat: 35.6491,
          lng: 139.7898,
          rating: 4.9,
          reviews: 18000,
          tip: 'Portez un pantalon qui peut être retroussé jusqu\'aux genoux pour la salle aquatique.',
          img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Shibuya Sky & Croisement de Shibuya',
          cat: 'nightlife',
          desc: 'Observatoire panoramique à ciel ouvert à 229m d\'altitude au-dessus du croisement le plus célèbre du monde.',
          lat: 35.6580,
          lng: 139.7016,
          rating: 4.9,
          reviews: 12500,
          tip: 'Réservez le créneau coucher de soleil : la vue sur Tokyo illuminé avec le mont Fuji en fond est grandiose.',
          img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Meiji Jingu & Forêt Sacrée',
          cat: 'nature',
          desc: 'Sanctuaire shintoïste niché dans une forêt centenaire de 100 000 arbres au cœur de la métropole.',
          lat: 35.6764,
          lng: 139.6993,
          rating: 4.8,
          reviews: 9800,
          tip: 'Écrivez votre vœu sur une tablette votive en bois (ema) sous les grands camphriers.',
          img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Ginza Six & Ruelles Gourmandes',
          cat: 'shopping',
          desc: 'Temple du luxe et de l\'art de vivre tokyoïte avec jardin suspendu sur le toit.',
          lat: 35.6698,
          lng: 139.7640,
          rating: 4.7,
          reviews: 4900,
          tip: 'Visitez l\'étage gastronomique au sous-sol pour des pâtisseries japonaises d\'orfèvre.',
          img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        },
      ],
      abidjan: [
        {
          name: 'Cathédrale Saint-Paul du Plateau',
          cat: 'culture',
          desc: 'Chef-d\'œuvre architectural moderne surplombant la lagune Ébrié avec ses vitraux monumentaux.',
          lat: 5.3283,
          lng: -4.0195,
          rating: 4.7,
          reviews: 3200,
          tip: 'Montez sur l\'esplanade pour une vue panoramique sur les gratte-ciels du Plateau et la lagune.',
          img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Bushman Café & Galerie d\'Art',
          cat: 'gastronomie',
          desc: 'Hôtel-galerie d\'art contemporain africain, réputé pour sa cuisine fusion ivoirienne et ses cocktails d\'exception.',
          lat: 5.3524,
          lng: -3.9765,
          rating: 4.8,
          reviews: 2800,
          tip: 'Installez-vous sur le toit-terrasse arboré pour déguster l\'aloco revisité et écouter du jazz.',
          img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Parc National du Banco',
          cat: 'nature',
          desc: 'Forêt tropicale primaire de 3400 hectares préservée au cœur de la ville avec sentiers sous la canopée.',
          lat: 5.3850,
          lng: -4.0530,
          rating: 4.6,
          reviews: 1900,
          tip: 'Louez un vélo à l\'entrée pour rejoindre l\'étang aux silures et l\'arboretum centenaire.',
          img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Marché d\'Art de Cocody & Saint-Jean',
          cat: 'shopping',
          desc: 'Marché artisanal incontournable pour les masques baoulés, poteries et tissus pagnes traditionnels.',
          lat: 5.3480,
          lng: -4.0020,
          rating: 4.6,
          reviews: 2100,
          tip: 'Prenez le temps d\'échanger avec les sculpteurs sur bois sur la signification des motifs traditionnels.',
          img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        },
        {
          name: 'Grand-Bassam & Quartier France',
          cat: 'culture',
          desc: 'Ancienne capitale coloniale classée UNESCO, bordée par l\'océan Atlantique et ses galeries d\'artistes.',
          lat: 5.2045,
          lng: -3.7380,
          rating: 4.8,
          reviews: 4100,
          tip: 'Dégustez un poisson braisé sauce kédjenou sur la plage face aux vagues de l\'Atlantique.',
          img: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800&auto=format&fit=crop&q=80',
        },
      ],
    };

    // Trouver si on a la ville en base
    let candidateVenues: Array<{ name: string; cat: string; desc: string; lat: number; lng: number; rating: number; reviews: number; tip: string; img: string }> = [];
    for (const [key, list] of Object.entries(curatedVenuesByCity)) {
      if (dest.includes(key)) {
        candidateVenues = list;
        break;
      }
    }

    const pois: POI[] = [];
    const activitiesPerDay = dto.pace === 'tranquille' ? 3 : dto.pace === 'intensif' ? 5 : 4;

    if (candidateVenues.length > 0) {
      // Filtrer et prioriser selon les intérêts de l'utilisateur
      const prioritized = [...candidateVenues].sort((a, b) => {
        const aMatch = interests.includes(a.cat) ? 1 : 0;
        const bMatch = interests.includes(b.cat) ? 1 : 0;
        return bMatch - aMatch;
      });

      let venueIndex = 0;
      for (let day = 1; day <= dto.duration_days; day++) {
        for (let order = 1; order <= activitiesPerDay; order++) {
          const v = prioritized[venueIndex % prioritized.length];
          venueIndex++;

          pois.push({
            name: v.name,
            description: v.desc,
            lat: v.lat + (order * 0.0005) - 0.001,
            lng: v.lng - (order * 0.0005) + 0.001,
            day,
            order,
            duration_minutes: order === 2 ? 60 : 90,
            category: v.cat,
            image_query: v.name,
            image_url: v.img,
            rating: v.rating,
            reviews_count: v.reviews,
            insider_tip: v.tip,
          });
        }
      }
      return pois;
    }

    // Génération procédurale réaliste pour toute autre ville dans le monde
    const templateActivities = [
      { name: 'Centre Historique & Cité Ancienne', cat: 'culture', desc: `Découverte pédestre des ruelles emblématiques, de l'histoire locale et des monuments de ${dto.destination}.`, tip: 'Privilégiez la matinée pour arpenter les ruelles sans la foule.' },
      { name: 'Bistrot du Marché & Saveurs Locales', cat: 'gastronomie', desc: `Immersion culinaire authentique dégustant les spécialités régionales et produits frais de saison de ${dto.destination}.`, tip: 'Demandez le plat du jour et les spécialités artisanales recommandées par le chef.' },
      { name: 'Musée d\'Art & Patrimoine Régional', cat: 'art', desc: `Exploration des chefs-d\'œuvre artistiques et collections remarquables célébrant l\'identité de ${dto.destination}.`, tip: 'Consultez les expositions temporaires au dernier étage.' },
      { name: 'Parc Botanique & Belvédère', cat: 'nature', desc: `Pause nature revigorante offrant un panorama exceptionnel sur toute la ville et ses environs.`, tip: 'Le coucher de soleil depuis le belvédère est le plus photogénique.' },
      { name: 'Quartier des Créateurs & Boutiques Artisanales', cat: 'shopping', desc: `Flânerie dans le quartier bohème entre concept stores, ateliers d'artisans et galeries indépendantes.`, tip: 'Idéal pour dénicher des souvenirs artisanaux uniques introuvables ailleurs.' },
      { name: 'Rooftop Bar & Lounge Panoramique', cat: 'nightlife', desc: `Soirée conviviale et raffinée avec cocktails signatures et ambiance musicale surplombant les lumières de ${dto.destination}.`, tip: 'Réservez une table en bordure de terrasse pour profiter pleinement de la vue nocturne.' },
      { name: 'Bains & Espace Bien-Être Traditionnel', cat: 'bien_etre', desc: `Moment de relaxation profonde et de ressourcement dans un cadre serein inspiré des rituels traditionnels.`, tip: 'Profitez de la tisanerie relaxante après votre séance.' },
    ];

    // Trier les templates pour mettre en avant les intérêts de l'utilisateur
    const sortedTemplates = [...templateActivities].sort((a, b) => {
      const aMatch = interests.includes(a.cat) ? 1 : 0;
      const bMatch = interests.includes(b.cat) ? 1 : 0;
      return bMatch - aMatch;
    });

    for (let day = 1; day <= dto.duration_days; day++) {
      for (let order = 1; order <= activitiesPerDay; order++) {
        const actIndex = ((day - 1) * activitiesPerDay + (order - 1)) % sortedTemplates.length;
        const act = sortedTemplates[actIndex];

        // Décalage GPS réaliste pour créer un véritable parcours sur la carte
        const latOffset = (day * 0.005) + (order * 0.002) - 0.008;
        const lngOffset = (day * 0.004) - (order * 0.003) + 0.005;

        pois.push({
          name: `${act.name} (${dto.destination})`,
          description: act.desc,
          lat: cityCoords.lat + latOffset,
          lng: cityCoords.lng + lngOffset,
          day,
          order,
          duration_minutes: order === 2 ? 60 : 90,
          category: act.cat,
          image_query: `${dto.destination} ${act.name}`,
          image_url: this.getCuratedPhoto(act.cat, dto.destination),
          rating: Number((4.6 + ((day + order) % 4) * 0.1).toFixed(1)),
          reviews_count: 1200 + ((day * 700 + order * 350) % 8000),
          insider_tip: act.tip,
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
        timeout: 3000,
      });

      const titles: string[] = searchResponse.data[1];
      if (!titles || titles.length === 0) {
        return this.getCuratedPhoto('culture', imageQuery);
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
        timeout: 3000,
      });

      const pages = pageResponse.data?.query?.pages;
      if (!pages) return this.getCuratedPhoto('culture', imageQuery);

      const page = Object.values(pages)[0] as any;
      return page?.thumbnail?.source || this.getCuratedPhoto('culture', imageQuery);
    } catch {
      return this.getCuratedPhoto('culture', imageQuery);
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
