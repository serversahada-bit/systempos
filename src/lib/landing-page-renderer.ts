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
  | 'footer';

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
}: {
  title: string;
  bodyHtml: string;
}) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="lp-shell">
    <div class="lp-container">
${bodyHtml}
    </div>
  </main>
  <script src="./script.js" defer></script>
</body>
</html>`;
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
  return `document.addEventListener("click", function(event) {
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
