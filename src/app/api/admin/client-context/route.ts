import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const rawIp =
    forwardedFor?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown';
  const ip = rawIp === '::1'
    ? '127.0.0.1'
    : rawIp.startsWith('::ffff:')
      ? rawIp.replace('::ffff:', '')
      : rawIp;

  return NextResponse.json({
    ip,
    ipType: ip === '127.0.0.1' || ip === 'localhost' ? 'local' : ip === 'unknown' ? 'unknown' : 'public',
    country: headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || null,
    region: headers.get('x-vercel-ip-country-region') || null,
    city: headers.get('x-vercel-ip-city') || null,
    latitude: headers.get('x-vercel-ip-latitude') || null,
    longitude: headers.get('x-vercel-ip-longitude') || null,
    userAgent: headers.get('user-agent') || null,
  });
}
