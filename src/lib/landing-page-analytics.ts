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
  rawPixelCode?: string;
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

function safeRawPixelCode(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function splitRawPixelCode(rawCode: string) {
  const noscriptPattern = /<noscript[\s\S]*?<\/noscript>/gi;
  const bodyMatches = rawCode.match(noscriptPattern) || [];

  return {
    headHtml: rawCode.replace(noscriptPattern, '').trim(),
    bodyHtml: bodyMatches.join('\n').trim(),
  };
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

    return parsed.reduce<LandingPageAnalyticsConfig[]>((acc, item) => {
        if (!item || typeof item !== 'object') {
          return acc;
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
          return acc;
        }

        acc.push({
          id,
          type,
          name,
          pixelId,
          rawPixelCode: safeRawPixelCode(source.rawPixelCode),
          conversionApiAccessToken:
            typeof source.conversionApiAccessToken === 'string' ? source.conversionApiAccessToken.trim() : '',
          testCode: typeof source.testCode === 'string' ? source.testCode.trim() : '',
          openEvents: openEvents.length > 0 ? openEvents : ['ViewContent'],
        });

        return acc;
      }, []);
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
      rawPixelCode: safeRawPixelCode(config.rawPixelCode),
      openEvents: config.openEvents
        .map((eventName) => safeEventName(eventName))
        .filter((eventName): eventName is MetaPixelEvent => Boolean(eventName)),
    }))
    .filter((config) => config.pixelId);

  if (normalizedConfigs.length === 0) {
    return { headHtml: '', bodyHtml: '' };
  }

  const generatedConfigs = normalizedConfigs.filter((config) => !config.rawPixelCode);
  const rawConfigs = normalizedConfigs
    .filter((config) => config.rawPixelCode)
    .map((config) => ({
      ...config,
      splitCode: splitRawPixelCode(config.rawPixelCode || ''),
    }));

  const serializedGeneratedConfigs = JSON.stringify(
    generatedConfigs.map((config) => ({
      pixelId: config.pixelId,
    }))
  );

  const serializedEventConfigs = JSON.stringify(
    normalizedConfigs.map((config) => ({
      pixelId: config.pixelId,
      openEvents: config.openEvents.length > 0 ? config.openEvents : ['ViewContent'],
    }))
  );

  const generatedNoscriptHtml = normalizedConfigs
    .map(
      (config) =>
        config.rawPixelCode && splitRawPixelCode(config.rawPixelCode).bodyHtml
          ? ''
          : `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapeHtml(
              config.pixelId
            )}&ev=PageView&noscript=1" alt="" /></noscript>`
    )
    .join('');

  const rawBodyHtml = rawConfigs
    .map((config) => config.splitCode.bodyHtml)
    .filter(Boolean)
    .join('\n');

  const generatedHeadHtml = generatedConfigs.length
    ? `<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
(function() {
  var configs = ${serializedGeneratedConfigs};

  configs.forEach(function(config) {
    fbq('init', config.pixelId);
    fbq('trackSingle', config.pixelId, 'PageView');
  });
})();
</script>`
    : '';

  const rawHeadHtml = rawConfigs
    .map((config) => config.splitCode.headHtml)
    .filter(Boolean)
    .join('\n');

  const openEventsHtml = `<script>
(function() {
  var configs = ${serializedEventConfigs};

  function runOpenEvents() {
    if (typeof window.fbq !== 'function') {
      return false;
    }

    configs.forEach(function(config) {
      (config.openEvents || []).forEach(function(eventName) {
        if (eventName === 'PageView') return;
        fbq('trackSingle', config.pixelId, eventName);
      });
    });

    return true;
  }

  function boot() {
    if (runOpenEvents()) return;

    var attempts = 0;
    var timer = window.setInterval(function() {
      attempts += 1;
      if (runOpenEvents() || attempts >= 40) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
</script>`;

  const headHtml = [rawHeadHtml, generatedHeadHtml, openEventsHtml]
    .filter(Boolean)
    .join('\n');

  return {
    headHtml,
    bodyHtml: [rawBodyHtml, generatedNoscriptHtml].filter(Boolean).join('\n'),
  };
}
