/**
 * Identifiant stable d'un lieu réel, partagé entre tous les itinéraires.
 * Nom normalisé (sans accents ni ponctuation) + coordonnées arrondies à ~1 km :
 * deux voyageurs qui visitent « Musée du Louvre » à Paris notent le même lieu,
 * même si l'IA a donné des coordonnées légèrement différentes.
 */
export function placeKey(name: string, lat: number, lng: number): string {
  const normalized = (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized}@${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;
}
