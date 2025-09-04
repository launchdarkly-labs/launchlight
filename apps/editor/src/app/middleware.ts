import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  // Only protect editor app routes; adjust as needed
  if (!url.pathname.startsWith('/')) return NextResponse.next();

  const creds = process.env.EDITOR_BASIC_AUTH; // format: username:password
  if (!creds) return NextResponse.next();

  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('basic ')) {
    return new Response('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Editor"' } });
  }

  try {
    const b64 = header.split(' ')[1] || '';
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    if (decoded !== creds) {
      return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Editor"' } });
    }
  } catch {
    return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Editor"' } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/health|favicon.ico|assets|public).*)'],
};
