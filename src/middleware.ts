import { NextRequest, NextResponse } from 'next/server';

// ENK-007 / ENK-013 / T-001: test, debug and sandbox endpoints must not be reachable in a release build.
// Set ENABLE_DEBUG_ROUTES=true only on an isolated test environment.
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/test/:path*',
    '/api/wallet/add-funds-bypass/:path*',
    '/api/wallet/add-funds-supabase/:path*',
    '/api/wallet/supabase-test/:path*',
    '/api/wallet/wonyapay/test/:path*',
    '/api/wallet/wonyapay/production-test/:path*',
    '/api/wallet/wonyapay/debug-reftransa/:path*',
  ],
};
