import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  deleteLandingPageAnalyticsBySlug,
  getLandingPageAnalyticsBySlug,
} from '@/lib/landing-page-analytics-store';

// GET single landing page by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const lp = await prisma.landing_pages.findUnique({ where: { slug } });
    if (!lp) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    const analyticsJson = await getLandingPageAnalyticsBySlug(slug);
    return NextResponse.json({ data: { ...lp, analytics_json: analyticsJson } }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE landing page by slug
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await prisma.landing_pages.delete({ where: { slug } });
    await deleteLandingPageAnalyticsBySlug(slug);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
