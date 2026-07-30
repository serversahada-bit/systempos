export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'list'
  | 'testimonial'
  | 'pricing'
  | 'hero'
  | 'video'
  | 'faq'
  | 'footer'
  | 'gallery'
  | 'form'
  | 'stats'
  | 'countdown'
  | 'spacer';

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, string>;
  styles: Record<string, string>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

export function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function renderBlocksToHtml(blocks: Block[]) {
  return blocks
    .map((block) => {
      const s = block.styles;

      switch (block.type) {
        case 'heading':
          return `<h2 style="font-size:${s.fontSize};font-weight:${s.fontWeight};color:${s.color};text-align:${s.textAlign};padding:${s.padding}">${nl2br(
            block.content.text || ''
          )}</h2>`;
        case 'text':
          return `<p style="font-size:${s.fontSize};color:${s.color};text-align:${s.textAlign};line-height:${s.lineHeight};padding:${s.padding};white-space:pre-wrap">${nl2br(
            block.content.text || ''
          )}</p>`;
        case 'image':
          return block.content.src
            ? `<img src="${escapeHtml(block.content.src)}" alt="${escapeHtml(
                block.content.alt || ''
              )}" style="width:${s.width};border-radius:${s.borderRadius};padding:${s.padding}" />`
            : '';
        case 'button':
          return `<div style="margin:8px 16px"><a href="${escapeHtml(
            block.content.href || '#'
          )}" style="background-color:${s.backgroundColor};color:${s.color};font-size:${s.fontSize};font-weight:${s.fontWeight};padding:${s.padding};border-radius:${s.borderRadius};display:block;text-align:${s.textAlign};text-decoration:none;box-sizing:border-box">${nl2br(
            block.content.text || ''
          )}</a></div>`;
        case 'divider':
          return `<hr style="border-color:${s.borderColor};margin:${s.margin}" />`;
        case 'list':
          return `<div style="font-size:${s.fontSize};color:${s.color};padding:${s.padding};line-height:${s.lineHeight};white-space:pre-wrap">${nl2br(
            block.content.items || ''
          )}</div>`;
        case 'testimonial':
          return `<div style="background-color:${s.backgroundColor};border-radius:${s.borderRadius};padding:${s.padding};margin:${s.margin}"><div style="color:#fbbf24;font-size:18px;margin-bottom:8px">${'★'.repeat(
            Number(block.content.rating || '0')
          )}</div><p style="font-size:13px;font-style:italic;color:#374151">${nl2br(
            block.content.quote || ''
          )}</p><div style="font-size:12px;font-weight:700;margin-top:8px">${nl2br(
            block.content.name || ''
          )}</div></div>`;
        case 'pricing':
          return `<div style="text-align:${s.textAlign};padding:${s.padding};background-color:${s.backgroundColor};border-radius:${s.borderRadius};margin:${s.margin}"><div style="font-size:13px;color:#9ca3af;text-decoration:line-through;margin-bottom:4px">${nl2br(
            block.content.originalPrice || ''
          )}</div><div style="font-size:28px;font-weight:900;color:#dc2626;margin-bottom:4px">${nl2br(
            block.content.salePrice || ''
          )}</div><span style="background:#fef9c3;color:#92400e;font-size:11px;font-weight:700;padding:2px 10px;border-radius:50px">${nl2br(
            block.content.label || ''
          )}</span></div>`;
        case 'hero':
          return `<div style="text-align:${s.textAlign};padding:${s.padding};background-color:${s.backgroundColor};color:${s.color};border-radius:${s.borderRadius};margin:${s.margin}">
            <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;line-height:1.2">${nl2br(block.content.title || '')}</h1>
            <p style="font-size:16px;margin-bottom:24px;opacity:0.9;line-height:1.5">${nl2br(block.content.subtitle || '')}</p>
            ${block.content.buttonText ? `<a href="${escapeHtml(block.content.buttonLink || '#')}" style="display:inline-block;background-color:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(block.content.buttonText)}</a>` : ''}
          </div>`;
        case 'video':
          let videoUrl = block.content.url || '';
          if (videoUrl.includes('youtube.com/watch?v=')) {
            videoUrl = videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
          } else if (videoUrl.includes('youtu.be/')) {
            videoUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/');
          }
          return `<div style="padding:${s.padding};margin:${s.margin};border-radius:${s.borderRadius};overflow:hidden;background:#000">
            <iframe width="100%" height="315" src="${escapeHtml(videoUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display:block;width:100%;border:none;"></iframe>
          </div>`;
        case 'faq':
          return `<div style="padding:${s.padding};margin:${s.margin};border-radius:${s.borderRadius};background-color:${s.backgroundColor}">
            <details style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px">
              <summary style="font-weight:600;cursor:pointer;color:#111827">${escapeHtml(block.content.question1 || '')}</summary>
              <div style="margin-top:8px;font-size:14px;color:#4b5563;line-height:1.5">${nl2br(block.content.answer1 || '')}</div>
            </details>
            <details style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
              <summary style="font-weight:600;cursor:pointer;color:#111827">${escapeHtml(block.content.question2 || '')}</summary>
              <div style="margin-top:8px;font-size:14px;color:#4b5563;line-height:1.5">${nl2br(block.content.answer2 || '')}</div>
            </details>
          </div>`;
        case 'footer':
          return `<div style="text-align:center;padding:${s.padding};margin:${s.margin};background-color:${s.backgroundColor};color:${s.color};font-size:12px;border-radius:${s.borderRadius}">
            <div style="margin-bottom:8px;font-weight:bold">${escapeHtml(block.content.brandName || '')}</div>
            <div style="opacity:0.8">${nl2br(block.content.contactInfo || '')}</div>
            <div style="margin-top:16px;opacity:0.6">&copy; ${new Date().getFullYear()} Hak Cipta Dilindungi.</div>
          </div>`;
        case 'gallery': {
          const images = ['image1', 'image2', 'image3', 'image4']
            .map((key, index) => {
              const src = block.content[key] || '';
              const alt = block.content[`alt${index + 1}`] || `Gallery ${index + 1}`;

              if (!src) {
                return `<div style="aspect-ratio:1/1;border:1px dashed #d8b4fe;border-radius:${s.borderRadius || '16px'};background:#faf5ff"></div>`;
              }

              return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:${s.borderRadius || '16px'}" />`;
            })
            .join('');

          return `<div style="padding:${s.padding};margin:${s.margin}">
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${s.gap || '12px'}">
              ${images}
            </div>
          </div>`;
        }
        case 'form': {
          const formIdentifier = `lp-form-${block.id}`;
          const successMessage = block.content.successMessage || 'Terima kasih, data Anda sudah kami terima.';

          return `<div style="padding:${s.padding};margin:${s.margin};background-color:${s.backgroundColor};border-radius:${s.borderRadius};color:${s.color}">
            ${block.content.title ? `<div style="font-size:24px;font-weight:800;line-height:1.2;margin-bottom:8px">${nl2br(block.content.title)}</div>` : ''}
            ${block.content.subtitle ? `<div style="font-size:14px;line-height:1.7;opacity:0.82;margin-bottom:18px">${nl2br(block.content.subtitle)}</div>` : ''}
            <?php if (($lpRequestMethod ?? 'GET') === 'POST' && (($_POST['lp_form_id'] ?? '') === '${escapeHtml(formIdentifier)}')): ?>
            <div style="margin-bottom:16px;padding:12px 14px;border-radius:14px;background:#dcfce7;color:#166534;font-size:13px;line-height:1.6">${nl2br(successMessage)}</div>
            <?php endif; ?>
            <form method="${escapeHtml(block.content.method || 'post')}" action="${escapeHtml(block.content.action || '')}" style="display:grid;gap:${s.gap || '12px'}">
              <input type="hidden" name="lp_form_id" value="${escapeHtml(formIdentifier)}" />
              <input type="text" name="full_name" placeholder="${escapeHtml(block.content.namePlaceholder || 'Nama lengkap')}" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #d1d5db;background:#fff;color:#111827;box-sizing:border-box" />
              <input type="tel" name="phone" placeholder="${escapeHtml(block.content.phonePlaceholder || 'No. WhatsApp')}" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #d1d5db;background:#fff;color:#111827;box-sizing:border-box" />
              <input type="email" name="email" placeholder="${escapeHtml(block.content.emailPlaceholder || 'Email')}" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #d1d5db;background:#fff;color:#111827;box-sizing:border-box" />
              <textarea name="message" placeholder="${escapeHtml(block.content.messagePlaceholder || 'Tulis kebutuhan Anda')}" rows="4" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #d1d5db;background:#fff;color:#111827;box-sizing:border-box;resize:vertical"></textarea>
              <button type="submit" style="border:none;background:${s.buttonBackgroundColor || '#7c3aed'};color:${s.buttonTextColor || '#ffffff'};padding:14px 18px;border-radius:${s.buttonBorderRadius || '999px'};font-size:15px;font-weight:700;cursor:pointer">
                ${escapeHtml(block.content.buttonText || 'Kirim Sekarang')}
              </button>
            </form>
          </div>`;
        }
        case 'stats': {
          const items = [
            { value: block.content.value1 || '1K+', label: block.content.label1 || 'Pelanggan' },
            { value: block.content.value2 || '4.9/5', label: block.content.label2 || 'Rating' },
            { value: block.content.value3 || '24/7', label: block.content.label3 || 'Support' },
          ];

          return `<div style="padding:${s.padding};margin:${s.margin};background-color:${s.backgroundColor};border-radius:${s.borderRadius};color:${s.color}">
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${s.gap || '12px'}">
              ${items
                .map(
                  (item) => `<div style="text-align:center">
                    <div style="font-size:${s.fontSize || '26px'};font-weight:900;line-height:1">${nl2br(item.value)}</div>
                    <div style="margin-top:6px;font-size:12px;opacity:.78;line-height:1.6">${nl2br(item.label)}</div>
                  </div>`
                )
                .join('')}
            </div>
          </div>`;
        }
        case 'countdown':
          return `<div style="padding:${s.padding};margin:${s.margin};background-color:${s.backgroundColor};border-radius:${s.borderRadius};color:${s.color};text-align:${s.textAlign}">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.72;margin-bottom:12px">${nl2br(
              block.content.label || 'Promo berakhir dalam'
            )}</div>
            <div class="lp-countdown-grid" data-countdown-end="${escapeHtml(block.content.endDate || '')}" data-countdown-expired="${escapeHtml(
              block.content.expiredText || 'Promo sudah berakhir'
            )}">
              <div class="lp-countdown-item"><strong data-unit="days">00</strong><span>Hari</span></div>
              <div class="lp-countdown-item"><strong data-unit="hours">00</strong><span>Jam</span></div>
              <div class="lp-countdown-item"><strong data-unit="minutes">00</strong><span>Menit</span></div>
              <div class="lp-countdown-item"><strong data-unit="seconds">00</strong><span>Detik</span></div>
            </div>
            <div class="lp-countdown-expired"></div>
          </div>`;
        case 'spacer':
          return `<div style="height:${s.height || '36px'};margin:${s.margin};background:${s.backgroundColor || 'transparent'};border-radius:${s.borderRadius || '0px'}"></div>`;
        default:
          return '';
      }
    })
    .join('\n');
}

export function buildStoredHtml(blocks: Block[]) {
  return `<div style="max-width:480px;margin:0 auto;font-family:sans-serif;background:#fff;overflow:hidden">
${renderBlocksToHtml(blocks)}
</div>`;
}

export function buildStaticPageDocument({
  title,
  bodyHtml,
  headExtras = '',
  bodyEndExtras = '',
}: {
  title: string;
  bodyHtml: string;
  headExtras?: string;
  bodyEndExtras?: string;
}) {
  return `<?php
$lpRequestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$lpPostData = $_POST ?? [];
$lpQueryData = $_GET ?? [];
$lpRawInput = file_get_contents('php://input');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./style.css" />
  ${headExtras}
</head>
<body>
  <main class="lp-shell">
    <div class="lp-container">
${bodyHtml}
    </div>
  </main>
  ${bodyEndExtras}
  <script>
    window.__LP_REQUEST__ = <?php echo json_encode([
      'method' => $lpRequestMethod,
      'post' => $lpPostData,
      'query' => $lpQueryData,
      'raw' => $lpRawInput,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
  </script>
  <script src="./script.js" defer></script>
</body>
</html>`;
}

export function buildStaticPageHtaccess() {
  return `DirectoryIndex index.php
Options -Indexes

<IfModule mod_rewrite.c>
RewriteEngine On

RewriteCond %{THE_REQUEST} \s/+(.+?)\.php(?:[\s?]|$) [NC]
RewriteRule ^ /%1 [R=301,L]

RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.php -f
RewriteRule ^(.+?)/?$ $1.php [L]
</IfModule>`;
}

export function buildStaticPageCss() {
  return `*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top, #fdf4ff 0%, #eff6ff 45%, #f8fafc 100%);
  color: #111827;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}

img {
  display: block;
  max-width: 100%;
}

.lp-shell {
  min-height: 100vh;
  padding: 24px 16px;
}

.lp-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 30px 60px -30px rgba(15, 23, 42, 0.35);
}

.lp-countdown-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.lp-countdown-item {
  padding: 12px 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.14);
  text-align: center;
}

.lp-countdown-item strong {
  display: block;
  font-size: 24px;
  line-height: 1;
}

.lp-countdown-item span {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.lp-countdown-expired {
  margin-top: 12px;
  font-size: 12px;
  opacity: 0.82;
}

@media (max-width: 640px) {
  .lp-shell {
    padding: 0;
  }

  .lp-container {
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }
}`;
}

export function buildStaticPageScript() {
  return `(function() {
  function updateCountdowns() {
    var countdowns = document.querySelectorAll("[data-countdown-end]");

    countdowns.forEach(function(node) {
      if (!(node instanceof HTMLElement)) return;

      var endValue = node.getAttribute("data-countdown-end") || "";
      if (!endValue) return;

      var target = new Date(endValue);
      if (Number.isNaN(target.getTime())) return;

      var diff = target.getTime() - Date.now();
      var expiredLabel = node.getAttribute("data-countdown-expired") || "Promo sudah berakhir";
      var expiredNode = node.parentElement ? node.parentElement.querySelector(".lp-countdown-expired") : null;

      if (diff <= 0) {
        ["days", "hours", "minutes", "seconds"].forEach(function(unit) {
          var targetNode = node.querySelector('[data-unit="' + unit + '"]');
          if (targetNode) targetNode.textContent = "00";
        });

        if (expiredNode) {
          expiredNode.textContent = expiredLabel;
        }

        return;
      }

      var seconds = Math.floor(diff / 1000);
      var days = Math.floor(seconds / 86400);
      seconds -= days * 86400;
      var hours = Math.floor(seconds / 3600);
      seconds -= hours * 3600;
      var minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;

      var values = {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0")
      };

      Object.entries(values).forEach(function(entry) {
        var targetNode = node.querySelector('[data-unit="' + entry[0] + '"]');
        if (targetNode) targetNode.textContent = entry[1];
      });

      if (expiredNode) {
        expiredNode.textContent = "";
      }
    });
  }

  updateCountdowns();
  window.setInterval(updateCountdowns, 1000);
})();

document.addEventListener("click", function(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const anchor = target.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href") || "";
  if (href.startsWith("#")) {
    event.preventDefault();
  }
});`;
}
