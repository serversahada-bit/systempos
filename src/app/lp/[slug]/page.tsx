import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { buildAnalyticsSnippets, parseLandingPageAnalytics } from '@/lib/landing-page-analytics';
import { getLandingPageAnalyticsBySlug } from '@/lib/landing-page-analytics-store';

const prisma = new PrismaClient();

export default async function LandingPageViewer({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  
  const landingPage = await prisma.landing_pages.findUnique({
    where: { slug: slug }
  });

  if (!landingPage) {
    notFound();
  }

  const analyticsJson = await getLandingPageAnalyticsBySlug(slug);
  const analyticsSnippets = buildAnalyticsSnippets(parseLandingPageAnalytics(analyticsJson));

  // Bungkus HTML dalam dokumen lengkap agar CSS aplikasi tidak bocor ke halaman LP
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${landingPage.title}</title>
  ${analyticsSnippets.headHtml}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; display: block; }
    p { margin: 0; }
    h1,h2,h3,h4,h5,h6 { margin: 0; }
    ul, ol { list-style: none; padding: 0; margin: 0; }
    button { cursor: pointer; border: none; background: none; }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
      overflow: hidden;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
    }
    .lp-devtools-guard {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.92);
      z-index: 9999;
    }
    .lp-devtools-card {
      max-width: 360px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 20px 24px;
      background: rgba(255,255,255,0.08);
      color: #f8fafc;
      text-align: center;
      font-size: 14px;
      line-height: 1.7;
      box-shadow: 0 24px 60px -32px rgba(0,0,0,0.6);
    }
    html.lp-devtools-locked,
    html.lp-devtools-locked body {
      overflow: hidden;
      background: #0f172a;
    }
    html.lp-devtools-locked .container {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      user-select: none;
    }
    html.lp-devtools-locked .lp-devtools-guard {
      display: flex;
    }
  </style>
</head>
<body>
  ${analyticsSnippets.bodyHtml}
  <div class="container">
    ${landingPage.html_data}
  </div>
  <div class="lp-devtools-guard" aria-hidden="true">
    <div class="lp-devtools-card">Inspect dibatasi di preview internal ini.</div>
  </div>
  <script>
    (function() {
      var root = document.documentElement;
      var guardThreshold = 120;
      var devtoolsOpen = false;
      var pageLocked = false;

      function collectWindows() {
        var targets = [window];

        try {
          if (window.parent && window.parent !== window) {
            targets.push(window.parent);
          }
        } catch {}

        try {
          if (window.top && window.top !== window && targets.indexOf(window.top) === -1) {
            targets.push(window.top);
          }
        } catch {}

        return targets;
      }

      function lockPage() {
        if (pageLocked) return;

        pageLocked = true;
        root.classList.add('lp-devtools-locked');
        document.body.innerHTML = '<div class="lp-devtools-guard" aria-hidden="true"><div class="lp-devtools-card">Inspect terdeteksi. Tampilan halaman disembunyikan.</div></div>';
      }

      function blockShortcut(event) {
        var key = (event.key || '').toLowerCase();
        var isCtrlOrMeta = event.ctrlKey || event.metaKey;
        var isInspectCombo = event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].indexOf(key) >= 0;
        var isSourceCombo = isCtrlOrMeta && key === 'u';
        var isF12 = key === 'f12';

        if (isInspectCombo || isSourceCombo || isF12) {
          event.preventDefault();
          event.stopPropagation();
        }
      }

      function syncDevtoolsState() {
        var shouldLock = collectWindows().some(function(targetWindow) {
          try {
            var widthGap = Math.abs(targetWindow.outerWidth - targetWindow.innerWidth);
            var heightGap = Math.abs(targetWindow.outerHeight - targetWindow.innerHeight);

            return widthGap > guardThreshold || heightGap > guardThreshold;
          } catch {
            return false;
          }
        });

        if (shouldLock === devtoolsOpen) return;

        devtoolsOpen = shouldLock;
        if (shouldLock) {
          lockPage();
        }
      }

      document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
      });

      document.addEventListener('keydown', blockShortcut, true);
      window.addEventListener('resize', syncDevtoolsState);
      syncDevtoolsState();
      window.setInterval(syncDevtoolsState, 1000);
    })();
  </script>
</body>
</html>`;

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <iframe
        srcDoc={fullHtml}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={landingPage.title}
      />
    </div>
  );
}
