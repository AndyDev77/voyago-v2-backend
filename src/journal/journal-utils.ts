/** Règles du journal : quand un voyage est passé, et ce qu'il a représenté. */

const DAY_MS = 86400000;

function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Dernier jour du voyage : end_date, sinon start_date + durée. Null si non daté. */
export function tripEndDate(trip: any): Date | null {
  const end = parseDate(trip.end_date);
  if (end) return end;
  const start = parseDate(trip.start_date);
  if (!start) return null;
  return new Date(start.getTime() + Math.max((trip.duration_days || 1) - 1, 0) * DAY_MS);
}

/**
 * Un voyage rejoint le journal quand il a été terminé manuellement,
 * ou quand son dernier jour est passé. Un voyage non daté reste sur la carte.
 */
export function isTripPast(trip: any, now = new Date()): boolean {
  if (trip.completed_at) return true;
  const end = tripEndDate(trip);
  if (!end) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return end.getTime() < startOfToday.getTime();
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Distance parcourue : étapes consécutives de chaque jour, majorée pour le tracé réel des rues. */
export function tripDistanceKm(pois: any[]): number {
  const byDay = new Map<number, any[]>();
  for (const p of pois || []) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
    byDay.set(p.day, [...(byDay.get(p.day) || []), p]);
  }
  let km = 0;
  for (const dayPois of byDay.values()) {
    dayPois.sort((a, b) => (a.order || 0) - (b.order || 0));
    for (let i = 0; i < dayPois.length - 1; i++) km += haversineKm(dayPois[i], dayPois[i + 1]);
  }
  return Math.round(km * 1.3 * 10) / 10;
}

const CATEGORY_BADGES: Array<{ match: RegExp; title: string; icon: string }> = [
  { match: /gastro|food|cuisine|restau/, title: 'Fin Gourmet', icon: 'restaurant' },
  { match: /cultur|histoire|patrimoine|musee|musée/, title: 'Gardien du Patrimoine', icon: 'account_balance' },
  { match: /art|design|street/, title: 'Âme d\'Artiste', icon: 'palette' },
  { match: /nature|rando|parc|montagne/, title: 'Esprit Sauvage', icon: 'forest' },
  { match: /plage|mer|beach|soleil/, title: 'Chasseur de Soleil', icon: 'beach_access' },
  { match: /nuit|night|soir|fete|fête/, title: 'Oiseau de Nuit', icon: 'nightlife' },
  { match: /shop|mode|march/, title: 'Chineur Averti', icon: 'shopping_bag' },
  { match: /aventure|sport|adrenaline/, title: 'Aventurier Intrépide', icon: 'hiking' },
];

/** Titre débloqué par le voyage, selon ce que le voyageur a vraiment fait. */
export function tripBadge(trip: any, stats: { favorites_count: number; hidden_gems: number; distance_km: number }) {
  if (stats.favorites_count >= 3) return { title: 'Collectionneur de Coups de cœur', icon: 'favorite' };
  if (stats.hidden_gems >= 3) return { title: 'Maître des Ruelles', icon: 'diamond' };
  if (stats.distance_km >= 40) return { title: 'Marcheur Infatigable', icon: 'directions_walk' };

  const counts = new Map<string, number>();
  for (const p of trip.pois || []) {
    const c = (p.category || '').toString().toLowerCase();
    if (c) counts.set(c, (counts.get(c) || 0) + 1);
  }
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const badge = CATEGORY_BADGES.find((b) => b.match.test(dominant));
  return badge ? { title: badge.title, icon: badge.icon } : { title: 'Explorateur Voyago', icon: 'explore' };
}
