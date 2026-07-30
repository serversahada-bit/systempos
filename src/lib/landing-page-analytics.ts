export const META_PIXEL_EVENT_OPTIONS = [
  'ViewContent',
  'CompleteRegistration',
  'Contact',
  'Download',
  'InitiateCheckout',
  'Lead',
  'PlaceAnOrder',
  'Purchase',
  'Search',
  'SubmitApplication',
] as const;

export type MetaPixelEvent = (typeof META_PIXEL_EVENT_OPTIONS)[number];

export type LandingPageAnalyticsConfig = {
  id: string;
  type: 'meta_pixel';
  name: string;
  pixelId: string;
  conversionApiAccessToken?: string;
  testCode?: string;
  openEvents: MetaPixelEvent[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeEventName(value: string): MetaPixelEvent | null {
  return META_PIXEL_EVENT_OPTIONS.includes(value as MetaPixelEvent)
    ? (value as MetaPixelEvent)
    : null;
}

function safePixelId(value: string) {
  return value.replace(/[^0-9]/g, '');
}

export function parseLandingPageAnalytics(raw: string | null | undefined): LandingPageAnalyticsConfig[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const source = item as Record<string, unknown>;
        const type = source.type === 'meta_pixel' ? 'meta_pixel' : null;
        const pixelId = typeof source.pixelId === 'string' ? safePixelId(source.pixelId) : '';
        const name = typeof source.name === 'string' ? source.name.trim() : '';
        const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim() : `${type || 'analytics'}-${pixelId || 'draft'}`;
        const openEvents = Array.isArray(source.openEvents)
          ? source.openEvents
              .map((eventName) => (typeof eventName === 'string' ? safeEventName(eventName) : null))
              .filter((eventName): eventName is MetaPixelEvent => Boolean(eventName))
          : [];

        if (!type || !pixelId || !name) {
          return null;
        }

        return {
          id,
          type,
          name,
          pixelId,
          conversionApiAccessToken:
            typeof source.conversionApiAccessToken === 'string' ? source.conversionApiAccessToken.trim() : '',
          testCode: typeof source.testCode === 'string' ? source.testCode.trim() : '',
          openEvents: openEvents.length > 0 ? openEvents : ['ViewContent'],
        } satisfies LandingPageAnalyticsConfig;
      })
      .filter((item): item is LandingPageAnalyticsConfig => Boolean(item));
  } catch {
    return [];
  }
}

export function serializeLandingPageAnalytics(configs: LandingPageAnalyticsConfig[]) {
  return JSON.stringify(configs);
}

export function buildAnalyticsSnippets(configs: LandingPageAnalyticsConfig[]) {
  const normalizedConfigs = configs
    .map((config) => ({
      ...config,
      pixelId: safePixelId(config.pixelId),
      openEvents: config.openEvents
        .map((eventName) => safeEventName(eventName))
        .filter((eventName): eventName is MetaPixelEvent => Boolean(eventName)),
    }))
    .filter((config) => config.pixelId);

  if (normalizedConfigs.length === 0) {
    return { headHtml: '', bodyHtml: '' };
  }

  const serializedConfigs = JSON.stringify(
    normalizedConfigs.map((config) => ({
      pixelId: config.pixelId,
      openEvents: config.openEvents.length > 0 ? config.openEvents : ['ViewContent'],
    }))
  );

  const noscriptHtml = normalizedConfigs
    .map(
      (config) =>
        `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapeHtml(
          config.pixelId
        )}&ev=PageView&noscript=1" alt="" /></noscript>`
    )
    .join('');

  const headHtml = `<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
(function() {
  var configs = ${serializedConfigs};

  configs.forEach(function(config) {
    fbq('init', config.pixelId);
    fbq('trackSingle', config.pixelId, 'PageView');
  });

  function runOpenEvents() {
    configs.forEach(function(config) {
      (config.openEvents || []).forEach(function(eventName) {
        if (eventName === 'PageView') return;
        fbq('trackSingle', config.pixelId, eventName);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOpenEvents, { once: true });
  } else {
    runOpenEvents();
  }
})();
</script>`;

  return {
    headHtml,
    bodyHtml: noscriptHtml,
  };
}
