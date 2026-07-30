import prisma from '@/lib/db';

function analyticsKey(slug: string) {
  return `landing_page_analytics:${slug}`;
}

export async function getLandingPageAnalyticsBySlug(slug: string) {
  const setting = await prisma.global_settings.findUnique({
    where: { key: analyticsKey(slug) },
  });

  return setting?.value || null;
}

export async function saveLandingPageAnalyticsBySlug(slug: string, analyticsJson: string | null) {
  const key = analyticsKey(slug);

  if (!analyticsJson || analyticsJson === '[]') {
    await prisma.global_settings.deleteMany({
      where: { key },
    });
    return;
  }

  await prisma.global_settings.upsert({
    where: { key },
    update: { value: analyticsJson },
    create: { key, value: analyticsJson },
  });
}

export async function deleteLandingPageAnalyticsBySlug(slug: string) {
  await prisma.global_settings.deleteMany({
    where: { key: analyticsKey(slug) },
  });
}
