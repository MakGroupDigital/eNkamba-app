import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL_MS = 1000 * 60 * 30;
const cache = new Map<string, { expiresAt: number; payload: ReverseLocationPayload }>();

type ReverseLocationPayload = {
  quartier: string;
  ville: string;
  region: string;
  pays: string;
  label: string;
  latitude: number;
  longitude: number;
};

function pickFirst(...values: Array<unknown>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;
}

function normalizeCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const lat = normalizeCoordinate(request.nextUrl.searchParams.get('lat'));
  const lon = normalizeCoordinate(request.nextUrl.searchParams.get('lon'));

  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Coordonnees invalides' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('zoom', '18');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'fr',
        'User-Agent': 'Kenz location reverse geocoder contact@enkamba.app',
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Service de localisation indisponible' }, { status: 502 });
    }

    const data = await response.json();
    const address = data?.address || {};
    const quartier = pickFirst(
      address.neighbourhood,
      address.suburb,
      address.quarter,
      address.city_district,
      address.district,
      address.county
    ) || '';
    const ville = pickFirst(address.city, address.town, address.municipality, address.village, address.county) || '';
    const region = pickFirst(address.state, address.region, address.province, address.state_district) || '';
    const pays = pickFirst(address.country) || '';
    const labelParts = [quartier, ville, region, pays].filter(Boolean);

    const payload: ReverseLocationPayload = {
      quartier,
      ville,
      region,
      pays,
      label: labelParts.length ? labelParts.join(', ') : data?.display_name || 'Position detectee',
      latitude: lat,
      longitude: lon,
    };

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Erreur geocodage inverse:', error);
    return NextResponse.json({ error: 'Impossible de recuperer votre localisation' }, { status: 500 });
  }
}
