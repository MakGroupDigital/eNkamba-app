import { NextRequest, NextResponse } from 'next/server';

type KinshasaSuggestion = {
  id: string;
  label: string;
  secondary: string;
  lat: number;
  lon: number;
  source: 'local' | 'photon';
};

const KINSHASA_CENTER = { lat: -4.325, lon: 15.3222 };
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const cache = new Map<string, { expiresAt: number; items: KinshasaSuggestion[] }>();

const LOCAL_PLACES: KinshasaSuggestion[] = [
  { id: 'commune-gombe', label: 'Gombe', secondary: 'Commune, Kinshasa', lat: -4.316, lon: 15.306, source: 'local' },
  { id: 'commune-lingwala', label: 'Lingwala', secondary: 'Commune, Kinshasa', lat: -4.327, lon: 15.301, source: 'local' },
  { id: 'commune-kinshasa', label: 'Kinshasa', secondary: 'Commune, Kinshasa', lat: -4.331, lon: 15.313, source: 'local' },
  { id: 'commune-barumbu', label: 'Barumbu', secondary: 'Commune, Kinshasa', lat: -4.316, lon: 15.329, source: 'local' },
  { id: 'commune-kintambo', label: 'Kintambo', secondary: 'Commune, Kinshasa', lat: -4.333, lon: 15.270, source: 'local' },
  { id: 'commune-ngaliema', label: 'Ngaliema', secondary: 'Commune, Kinshasa', lat: -4.373, lon: 15.253, source: 'local' },
  { id: 'commune-bandalungwa', label: 'Bandalungwa', secondary: 'Commune, Kinshasa', lat: -4.345, lon: 15.287, source: 'local' },
  { id: 'commune-kasa-vubu', label: 'Kasa-Vubu', secondary: 'Commune, Kinshasa', lat: -4.339, lon: 15.304, source: 'local' },
  { id: 'commune-kalamu', label: 'Kalamu', secondary: 'Commune, Kinshasa', lat: -4.354, lon: 15.315, source: 'local' },
  { id: 'commune-makala', label: 'Makala', secondary: 'Commune, Kinshasa', lat: -4.383, lon: 15.307, source: 'local' },
  { id: 'commune-ngiri-ngiri', label: 'Ngiri-Ngiri', secondary: 'Commune, Kinshasa', lat: -4.355, lon: 15.296, source: 'local' },
  { id: 'commune-bumbu', label: 'Bumbu', secondary: 'Commune, Kinshasa', lat: -4.371, lon: 15.308, source: 'local' },
  { id: 'commune-limete', label: 'Limete', secondary: 'Commune, Kinshasa', lat: -4.344, lon: 15.345, source: 'local' },
  { id: 'commune-matete', label: 'Matete', secondary: 'Commune, Kinshasa', lat: -4.384, lon: 15.342, source: 'local' },
  { id: 'commune-lemba', label: 'Lemba', secondary: 'Commune, Kinshasa', lat: -4.404, lon: 15.316, source: 'local' },
  { id: 'commune-ngaba', label: 'Ngaba', secondary: 'Commune, Kinshasa', lat: -4.379, lon: 15.323, source: 'local' },
  { id: 'commune-kisenso', label: 'Kisenso', secondary: 'Commune, Kinshasa', lat: -4.421, lon: 15.342, source: 'local' },
  { id: 'commune-masina', label: 'Masina', secondary: 'Commune, Kinshasa', lat: -4.383, lon: 15.392, source: 'local' },
  { id: 'commune-ndjili', label: "N'djili", secondary: 'Commune, Kinshasa', lat: -4.389, lon: 15.381, source: 'local' },
  { id: 'commune-kimbanseke', label: 'Kimbanseke', secondary: 'Commune, Kinshasa', lat: -4.425, lon: 15.405, source: 'local' },
  { id: 'commune-maluku', label: 'Maluku', secondary: 'Commune, Kinshasa', lat: -4.055, lon: 15.586, source: 'local' },
  { id: 'commune-nsele', label: "N'sele", secondary: 'Commune, Kinshasa', lat: -4.319, lon: 15.513, source: 'local' },
  { id: 'commune-mont-ngafula', label: 'Mont-Ngafula', secondary: 'Commune, Kinshasa', lat: -4.455, lon: 15.281, source: 'local' },
  { id: 'commune-selembao', label: 'Selembao', secondary: 'Commune, Kinshasa', lat: -4.381, lon: 15.285, source: 'local' },
  { id: 'axe-boulevard-30-juin', label: 'Boulevard du 30 Juin', secondary: 'Avenue, Gombe', lat: -4.318, lon: 15.307, source: 'local' },
  { id: 'axe-liberation', label: 'Avenue de la Liberation', secondary: 'Avenue, Kinshasa', lat: -4.336, lon: 15.298, source: 'local' },
  { id: 'axe-universite', label: "Avenue de l'Universite", secondary: 'Avenue, Lemba', lat: -4.397, lon: 15.318, source: 'local' },
  { id: 'axe-lumumba', label: 'Boulevard Lumumba', secondary: 'Avenue, Limete - Masina', lat: -4.365, lon: 15.374, source: 'local' },
  { id: 'axe-poids-lourds', label: 'Avenue Poids Lourds', secondary: 'Avenue, Limete', lat: -4.331, lon: 15.342, source: 'local' },
  { id: 'axe-colonel-mondjiba', label: 'Avenue Colonel Mondjiba', secondary: 'Avenue, Ngaliema', lat: -4.322, lon: 15.274, source: 'local' },
  { id: 'place-victoire', label: 'Place Victoire', secondary: 'Arret, Kalamu', lat: -4.353, lon: 15.315, source: 'local' },
  { id: 'place-royal', label: 'Place Royal', secondary: 'Arret, Gombe', lat: -4.313, lon: 15.303, source: 'local' },
  { id: 'rond-point-ngaba', label: 'Rond-point Ngaba', secondary: 'Arret, Ngaba', lat: -4.378, lon: 15.323, source: 'local' },
  { id: 'rond-point-huileries', label: 'Rond-point Huileries', secondary: 'Arret, Kinshasa', lat: -4.329, lon: 15.318, source: 'local' },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function localSearch(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return LOCAL_PLACES.filter((place) => {
    const haystack = normalize(`${place.label} ${place.secondary}`);
    return haystack.includes(normalizedQuery);
  }).slice(0, 8);
}

function buildLabel(properties: Record<string, string | undefined>) {
  const primary = properties.name || properties.street || properties.district || properties.city || 'Adresse Kinshasa';
  const details = [
    properties.housenumber && properties.street ? `${properties.housenumber} ${properties.street}` : properties.street,
    properties.district,
    properties.city || properties.county || properties.state,
  ].filter(Boolean);

  return {
    label: primary,
    secondary: details.length ? details.join(', ') : 'Kinshasa, RDC',
  };
}

function isKinshasaFeature(properties: Record<string, string | undefined>) {
  const countryCode = (properties.countrycode || '').toLowerCase();
  const text = normalize([
    properties.city,
    properties.county,
    properties.state,
    properties.district,
    properties.name,
  ].filter(Boolean).join(' '));

  return countryCode === 'cd' && text.includes('kinshasa');
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const cacheKey = normalize(query);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ items: cached.items });
  }

  const localItems = localSearch(query);
  let photonItems: KinshasaSuggestion[] = [];

  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', `${query} Kinshasa`);
    url.searchParams.set('lat', String(KINSHASA_CENTER.lat));
    url.searchParams.set('lon', String(KINSHASA_CENTER.lon));
    url.searchParams.set('limit', '8');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'eNkamba Ugavi geocoder contact@enkamba.app',
      },
      next: { revalidate: 86400 },
    });

    if (response.ok) {
      const payload = await response.json();
      photonItems = (payload.features || [])
        .filter((feature: any) => Array.isArray(feature.geometry?.coordinates))
        .filter((feature: any) => isKinshasaFeature(feature.properties || {}))
        .map((feature: any) => {
          const [lon, lat] = feature.geometry.coordinates;
          const label = buildLabel(feature.properties || {});
          return {
            id: `photon-${feature.properties?.osm_type || 'place'}-${feature.properties?.osm_id || `${lat}-${lon}`}`,
            label: label.label,
            secondary: label.secondary,
            lat,
            lon,
            source: 'photon' as const,
          };
        });
    }
  } catch (error) {
    console.error('Erreur recherche adresse Kinshasa:', error);
  }

  const unique = new Map<string, KinshasaSuggestion>();
  [...localItems, ...photonItems].forEach((item) => {
    unique.set(`${normalize(item.label)}-${item.lat.toFixed(4)}-${item.lon.toFixed(4)}`, item);
  });

  const items = Array.from(unique.values()).slice(0, 8);
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, items });

  return NextResponse.json({ items });
}
