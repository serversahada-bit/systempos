import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. .svg, .png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  let baseDomain = '';
  try {
    const baseUrl = `${url.protocol}//${hostname}`;
    const res = await fetch(`${baseUrl}/api/settings/base-domain`, { 
      next: { revalidate: 60 } // cache for 60 seconds to avoid spamming the DB
    });
    if (res.ok) {
      const json = await res.json();
      baseDomain = json.data || '';
    }
  } catch (error) {
    console.error('Middleware fetch error:', error);
  }

  let currentHost = hostname.split(':')[0]; // remove port if exists
  let baseDomainWithoutPort = baseDomain.split(':')[0];

  let isSubdomain = false;
  let subdomain = '';
  
  // 1. Check Custom Domain First
  let matchedSlug = '';
  try {
    const baseUrl = `${url.protocol}//${hostname}`;
    const lpRes = await fetch(`${baseUrl}/api/landing-pages`, { 
      next: { revalidate: 60 } 
    });
    if (lpRes.ok) {
      const json = await lpRes.json();
      const pages = json.data || [];
      const matchedPage = pages.find((p: any) => p.domain === currentHost && p.domain_status === 'active');
      if (matchedPage) {
        matchedSlug = matchedPage.slug;
      }
    }
  } catch (error) {
    console.error('Middleware LP fetch error:', error);
  }

  if (matchedSlug) {
    return NextResponse.rewrite(new URL(`/lp/${matchedSlug}${path === '/' ? '' : path}`, req.url));
  }

  // 2. If base domain is set and matches the host
  if (baseDomainWithoutPort && currentHost !== baseDomainWithoutPort) {
    if (currentHost.endsWith(`.${baseDomainWithoutPort}`)) {
      isSubdomain = true;
      subdomain = currentHost.replace(`.${baseDomainWithoutPort}`, '');
    }
  } else if (!baseDomainWithoutPort) {
    // 3. Fallback for localhost testing with lvh.me
    if (currentHost.endsWith('.lvh.me')) {
      isSubdomain = true;
      subdomain = currentHost.replace('.lvh.me', '');
    }
  }

  // Skip rewrite if it's the root domain, 'www', or no subdomain
  if (isSubdomain && subdomain !== 'www' && subdomain !== '') {
    // Rewrite to the Landing Page route: /lp/[subdomain]
    return NextResponse.rewrite(new URL(`/lp/${subdomain}${path === '/' ? '' : path}`, req.url));
  }

  return NextResponse.next();
}
