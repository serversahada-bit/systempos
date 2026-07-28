'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  X, Monitor, Tablet, Smartphone, Save, Rocket,
  MessageCircle, ChevronsLeft, ChevronsRight,
  Type, Image as ImageIcon, Minus, List, Square,
  Star, ShoppingCart, AlignLeft, Trash2, GripVertical,
  ChevronUp, ChevronDown, Settings2, Palette, Upload, Loader
} from 'lucide-react';
import Swal from 'sweetalert2';

// ─── Block Types ────────────────────────────────────────────────────────────
type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'list' | 'testimonial' | 'pricing';

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, string>;
  styles: Record<string, string>;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── Default content per block type ─────────────────────────────────────────
function defaultBlock(type: BlockType): Block {
  const id = generateId();
  switch (type) {
    case 'heading':
      return { id, type, content: { text: 'Judul Baru Anda Di Sini' }, styles: { fontSize: '28px', fontWeight: '800', color: '#1a1a1a', textAlign: 'center', padding: '16px' } };
    case 'text':
      return { id, type, content: { text: 'Tulis deskripsi produk Anda di sini. Klik untuk mengedit.' }, styles: { fontSize: '14px', color: '#4b5563', textAlign: 'left', lineHeight: '1.7', padding: '12px 16px' } };
    case 'image':
      return { id, type, content: { src: '', alt: 'Gambar Produk' }, styles: { width: '100%', borderRadius: '12px', padding: '12px' } };
    case 'button':
      return { id, type, content: { text: '🛒 Pesan Sekarang (COD)', href: '#' }, styles: { backgroundColor: '#16a34a', color: '#ffffff', fontSize: '16px', fontWeight: '700', padding: '16px 24px', borderRadius: '50px', width: '100%', textAlign: 'center', display: 'block' } };
    case 'divider':
      return { id, type, content: {}, styles: { borderColor: '#e5e7eb', margin: '8px 16px' } };
    case 'list':
      return { id, type, content: { items: '✅ Manfaat pertama produk Anda\n✅ Manfaat kedua yang menarik\n✅ Manfaat ketiga yang penting' }, styles: { fontSize: '14px', color: '#374151', padding: '12px 16px', lineHeight: '2' } };
    case 'testimonial':
      return { id, type, content: { quote: '"Produk ini luar biasa! Nyeri sendi saya berkurang setelah 2 minggu pemakaian."', name: 'Budi, 52 Tahun', rating: '5' }, styles: { backgroundColor: '#fffbeb', borderRadius: '16px', padding: '16px', margin: '8px 16px' } };
    case 'pricing':
      return { id, type, content: { originalPrice: 'Rp 250.000', salePrice: 'Rp 125.000', label: 'Hemat 50%!' }, styles: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', margin: '8px 16px' } };
    default:
      return { id, type: 'text', content: { text: 'Block' }, styles: {} };
  }
}

// ─── Sidebar component palette ───────────────────────────────────────────────
const PALETTE: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading',     label: 'Judul',      icon: <Type size={16} /> },
  { type: 'text',        label: 'Teks',       icon: <AlignLeft size={16} /> },
  { type: 'image',       label: 'Gambar',     icon: <ImageIcon size={16} /> },
  { type: 'button',      label: 'Tombol CTA', icon: <ShoppingCart size={16} /> },
  { type: 'divider',     label: 'Pemisah',    icon: <Minus size={16} /> },
  { type: 'list',        label: 'Daftar',     icon: <List size={16} /> },
  { type: 'testimonial', label: 'Testimoni',  icon: <Star size={16} /> },
  { type: 'pricing',     label: 'Harga',      icon: <Square size={16} /> },
];

// ─── Block Renderer ───────────────────────────────────────────────────────────
function BlockRenderer({
  block,
  isSelected,
  onClick,
  onContentChange,
}: {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
  onContentChange: (key: string, value: string) => void;
}) {
  const s = block.styles;

  const editableProps = (key: string) => ({
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => onContentChange(key, e.currentTarget.innerText),
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onClick(); },
  });

  switch (block.type) {
    case 'heading':
      return (
        <h2
          style={{ fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, textAlign: s.textAlign as any, padding: s.padding, outline: 'none', cursor: 'text' }}
          {...editableProps('text')}
        >
          {block.content.text}
        </h2>
      );
    case 'text':
      return (
        <p
          style={{ fontSize: s.fontSize, color: s.color, textAlign: s.textAlign as any, lineHeight: s.lineHeight, padding: s.padding, outline: 'none', cursor: 'text', whiteSpace: 'pre-wrap' }}
          {...editableProps('text')}
        >
          {block.content.text}
        </p>
      );
    case 'image':
      return (
        <div style={{ padding: s.padding }}>
          {block.content.src ? (
            <div className="relative group/img">
              <img src={block.content.src} alt={block.content.alt} style={{ width: s.width, borderRadius: s.borderRadius }} onClick={onClick} className="block" />
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 cursor-pointer rounded-xl transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-white">
                  <Upload size={24} className="mb-1" />
                  <span className="text-xs font-semibold">Ganti Gambar</span>
                </div>
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.url) onContentChange('src', data.url);
                  }}
                />
              </label>
            </div>
          ) : (
            <label
              className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 py-10 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
              onClick={e => e.stopPropagation()}
            >
              <ImageIcon size={36} className="mb-2" />
              <span className="text-xs font-semibold text-gray-500">Klik untuk Upload Gambar</span>
              <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP — maks 5MB</span>
              <input
                type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch('/api/upload', { method: 'POST', body: fd });
                  const data = await res.json();
                  if (data.url) onContentChange('src', data.url);
                }}
              />
            </label>
          )}
        </div>
      );
    case 'button':
      return (
        <div style={{ margin: '8px 16px' }}>
          <span
            style={{ backgroundColor: s.backgroundColor, color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight, padding: s.padding, borderRadius: s.borderRadius, textAlign: s.textAlign as any, display: 'block', outline: 'none', cursor: 'text', boxSizing: 'border-box' }}
            {...editableProps('text')}
          >
            {block.content.text}
          </span>
        </div>
      );
    case 'divider':
      return <hr style={{ borderColor: s.borderColor, margin: s.margin }} onClick={onClick} className="cursor-pointer" />;
    case 'list':
      return (
        <div
          style={{ fontSize: s.fontSize, color: s.color, padding: s.padding, lineHeight: s.lineHeight, outline: 'none', cursor: 'text', whiteSpace: 'pre-wrap' }}
          {...editableProps('items')}
        >
          {block.content.items}
        </div>
      );
    case 'testimonial':
      return (
        <div style={{ backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, padding: s.padding, margin: s.margin }} onClick={onClick} className="cursor-pointer">
          <div className="text-yellow-400 text-lg mb-2">{'★'.repeat(Number(block.content.rating))}</div>
          <p
            style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', outline: 'none', cursor: 'text' }}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onContentChange('quote', e.currentTarget.innerText)}
          >
            {block.content.quote}
          </p>
          <div
            style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginTop: '8px', outline: 'none', cursor: 'text' }}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onContentChange('name', e.currentTarget.innerText)}
          >
            {block.content.name}
          </div>
        </div>
      );
    case 'pricing':
      return (
        <div style={{ textAlign: s.textAlign as any, padding: s.padding, backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, margin: s.margin }} onClick={onClick} className="cursor-pointer">
          <div style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through', marginBottom: '4px' }}>{block.content.originalPrice}</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626', marginBottom: '4px' }}>{block.content.salePrice}</div>
          <span style={{ backgroundColor: '#fef9c3', color: '#92400e', fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '50px' }}>{block.content.label}</span>
        </div>
      );
    default:
      return null;
  }
}

// ─── Properties Panel ────────────────────────────────────────────────────────
function PropertiesPanel({ block, onChange, onChangeStyle }: { block: Block; onChange: (key: string, val: string) => void; onChangeStyle: (key: string, val: string) => void }) {
  const input = (label: string, key: string, val: string, isStyle = false, type = 'text') => (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input
        type={type}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
        value={val}
        onChange={(e) => isStyle ? onChangeStyle(key, e.target.value) : onChange(key, e.target.value)}
      />
    </div>
  );

  const s = block.styles;
  const c = block.content;

  return (
    <div className="p-3">
      <div className="text-[10px] font-bold text-purple-600 uppercase mb-3 flex items-center gap-1">
        <Settings2 size={11} /> Konten
      </div>

      {(block.type === 'heading' || block.type === 'text' || block.type === 'button' || block.type === 'list') && input('Teks', 'text', c.text || c.items || '')}
      {block.type === 'image' && (
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Gambar</label>
          <label className="flex items-center justify-center gap-2 w-full border border-dashed border-purple-300 rounded px-2 py-2.5 text-xs text-purple-600 font-semibold cursor-pointer hover:bg-purple-50 transition-colors">
            <Upload size={13} /> Upload Gambar
            <input
              type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.url) onChange('src', data.url);
              }}
            />
          </label>
          {c.src && <div className="mt-1.5 rounded overflow-hidden"><img src={c.src} className="w-full rounded" /></div>}
          {input('Teks Alt', 'alt', c.alt || '')}
        </div>
      )}
      {block.type === 'button' && input('Link Tombol', 'href', c.href || '')}
      {block.type === 'testimonial' && (<>
        {input('Kutipan', 'quote', c.quote || '')}
        {input('Nama', 'name', c.name || '')}
        {input('Rating (1-5)', 'rating', c.rating || '5')}
      </>)}
      {block.type === 'pricing' && (<>
        {input('Harga Normal', 'originalPrice', c.originalPrice || '')}
        {input('Harga Promo', 'salePrice', c.salePrice || '')}
        {input('Label', 'label', c.label || '')}
      </>)}

      <div className="text-[10px] font-bold text-purple-600 uppercase mb-3 mt-4 flex items-center gap-1">
        <Palette size={11} /> Tampilan
      </div>
      {s.fontSize !== undefined && input('Ukuran Font', 'fontSize', s.fontSize, true)}
      {s.color !== undefined && input('Warna Teks', 'color', s.color, true, 'color')}
      {s.backgroundColor !== undefined && input('Warna Background', 'backgroundColor', s.backgroundColor, true, 'color')}
      {s.textAlign !== undefined && (
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Rata Teks</label>
          <select
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none"
            value={s.textAlign}
            onChange={(e) => onChangeStyle('textAlign', e.target.value)}
          >
            <option value="left">Kiri</option>
            <option value="center">Tengah</option>
            <option value="right">Kanan</option>
          </select>
        </div>
      )}
      {s.borderRadius !== undefined && input('Border Radius', 'borderRadius', s.borderRadius, true)}
      {s.padding !== undefined && input('Padding', 'padding', s.padding, true)}
    </div>
  );
}

// ─── Main Builder ─────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [title, setTitle] = useState('Landing Page Baru');
  const [slug, setSlug] = useState('my-landing-page-' + generateId().slice(0, 4));
  const [domain, setDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'inactive'|'pending'|'active'>('inactive');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');
  const dragItem = useRef<number | null>(null);
  const dragPaletteType = useRef<BlockType | null>(null);

  // Load from localStorage or from DB if editing
  useEffect(() => {
    if (editSlug) {
      // Load from DB
      setIsLoadingEdit(true);
      fetch(`/api/landing-pages/${editSlug}`)
        .then(r => r.json())
        .then(res => {
          if (res.data) {
            const lp = res.data;
            setTitle(lp.title || 'Landing Page Baru');
            setSlug(lp.slug);
            setDomain(lp.domain || '');
            setDomainStatus(lp.domain_status || 'inactive');
            if (lp.blocks_json) {
              try { setBlocks(JSON.parse(lp.blocks_json)); } catch {}
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingEdit(false));
    } else {
      const saved = localStorage.getItem('lp_builder_blocks');
      if (saved) {
        try { setBlocks(JSON.parse(saved)); } catch {}
      } else {
        // Default starter blocks
        setBlocks([
          defaultBlock('heading'),
          defaultBlock('text'),
          defaultBlock('image'),
          defaultBlock('button'),
          defaultBlock('divider'),
          defaultBlock('testimonial'),
          defaultBlock('pricing'),
        ]);
      }
    }
  }, [editSlug]);

  const selectedBlock = blocks.find(b => b.id === selectedId) || null;

  const updateBlock = useCallback((id: string, key: string, val: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: val } } : b));
  }, []);

  const updateStyle = useCallback((id: string, key: string, val: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, styles: { ...b.styles, [key]: val } } : b));
  }, []);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    setBlocks(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Convert blocks to HTML for saving
  const blocksToHtml = () => {
    return `<div style="max-width:480px;margin:0 auto;font-family:sans-serif;background:#fff;overflow:hidden">
${blocks.map(b => {
  const s = b.styles;
  switch (b.type) {
    case 'heading': return `<h2 style="font-size:${s.fontSize};font-weight:${s.fontWeight};color:${s.color};text-align:${s.textAlign};padding:${s.padding}">${b.content.text}</h2>`;
    case 'text':    return `<p style="font-size:${s.fontSize};color:${s.color};text-align:${s.textAlign};line-height:${s.lineHeight};padding:${s.padding};white-space:pre-wrap">${b.content.text}</p>`;
    case 'image':   return b.content.src ? `<img src="${b.content.src}" alt="${b.content.alt}" style="width:${s.width};border-radius:${s.borderRadius};padding:${s.padding}" />` : '';
    case 'button':  return `<div style="margin:8px 16px"><a href="${b.content.href}" style="background-color:${s.backgroundColor};color:${s.color};font-size:${s.fontSize};font-weight:${s.fontWeight};padding:${s.padding};border-radius:${s.borderRadius};display:block;text-align:${s.textAlign};text-decoration:none;box-sizing:border-box">${b.content.text}</a></div>`;
    case 'divider': return `<hr style="border-color:${s.borderColor};margin:${s.margin}" />`;
    case 'list':    return `<div style="font-size:${s.fontSize};color:${s.color};padding:${s.padding};line-height:${s.lineHeight};white-space:pre-wrap">${b.content.items}</div>`;
    case 'testimonial': return `<div style="background-color:${s.backgroundColor};border-radius:${s.borderRadius};padding:${s.padding};margin:${s.margin}"><div style="color:#fbbf24;font-size:18px;margin-bottom:8px">${'★'.repeat(Number(b.content.rating))}</div><p style="font-size:13px;font-style:italic;color:#374151">${b.content.quote}</p><div style="font-size:12px;font-weight:700;margin-top:8px">${b.content.name}</div></div>`;
    case 'pricing': return `<div style="text-align:${s.textAlign};padding:${s.padding};background-color:${s.backgroundColor};border-radius:${s.borderRadius};margin:${s.margin}"><div style="font-size:13px;color:#9ca3af;text-decoration:line-through;margin-bottom:4px">${b.content.originalPrice}</div><div style="font-size:28px;font-weight:900;color:#dc2626;margin-bottom:4px">${b.content.salePrice}</div><span style="background:#fef9c3;color:#92400e;font-size:11px;font-weight:700;padding:2px 10px;border-radius:50px">${b.content.label}</span></div>`;
    default: return '';
  }
}).join('\n')}
</div>`;
  };

  const handleSave = async () => {
    const html = blocksToHtml();
    localStorage.setItem('lp_builder_blocks', JSON.stringify(blocks));
    try {
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, html_data: html, blocks_json: JSON.stringify(blocks), status: 'Draft', domain: domain || null })
      });
      if (!res.ok) throw new Error();
      Swal.fire({
        icon: 'success', title: 'Disimpan!',
        html: `Draft berhasil disimpan.<br><br><div class="p-3 bg-gray-50 border rounded text-sm text-left"><span class="text-gray-500 font-semibold block mb-1">Preview Link:</span><a href="/lp/${slug}" target="_blank" class="text-purple-600 hover:underline">http://localhost:3000/lp/${slug}</a></div>`,
        confirmButtonText: 'Tutup', confirmButtonColor: '#7e22ce',
      });
    } catch { Swal.fire('Error', 'Gagal menyimpan.', 'error'); }
  };

  const handlePublish = async () => {
    const html = blocksToHtml();
    localStorage.setItem('lp_builder_blocks', JSON.stringify(blocks));
    try {
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, html_data: html, blocks_json: JSON.stringify(blocks), status: 'Published', domain: domain || null })
      });
      if (!res.ok) throw new Error();
      Swal.fire({
        icon: 'success', title: 'Diterbitkan!',
        html: `Landing page berhasil live!<br><br><div class="p-3 bg-green-50 border border-green-200 rounded text-sm text-left"><span class="text-green-700 font-semibold block mb-1">Live Link:</span><a href="/lp/${slug}" target="_blank" class="text-green-600 hover:underline font-medium">http://localhost:3000/lp/${slug}</a></div>`,
        confirmButtonText: 'Tutup', confirmButtonColor: '#4c1d95',
      });
    } catch { Swal.fire('Error', 'Gagal menerbitkan.', 'error'); }
  };

  // Drag from palette
  const onPaletteDragStart = (type: BlockType) => { dragPaletteType.current = type; dragItem.current = null; };
  // Drag existing block
  const onBlockDragStart = (idx: number) => { dragItem.current = idx; dragPaletteType.current = null; };
  const onBlockDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const onBlockDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragPaletteType.current) {
      // Insert new block at position
      const nb = defaultBlock(dragPaletteType.current);
      setBlocks(prev => { const arr = [...prev]; arr.splice(idx, 0, nb); return arr; });
      setSelectedId(nb.id);
    } else if (dragItem.current !== null && dragItem.current !== idx) {
      setBlocks(prev => {
        const arr = [...prev];
        const [removed] = arr.splice(dragItem.current!, 1);
        arr.splice(idx, 0, removed);
        return arr;
      });
    }
    dragItem.current = null;
    dragPaletteType.current = null;
    setDragOverIdx(null);
  };
  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragPaletteType.current) {
      const nb = defaultBlock(dragPaletteType.current);
      setBlocks(prev => [...prev, nb]);
      setSelectedId(nb.id);
    }
    dragPaletteType.current = null;
    setDragOverIdx(null);
  };

  const canvasWidth = device === 'desktop' ? 'max-w-4xl' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[390px]';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f7f9] text-sm">
      {/* ── Top Navbar ── */}
      <header className="h-14 bg-[#7e22ce] text-white flex items-center justify-between px-4 shrink-0 shadow z-20">
        <div className="flex items-center gap-3">
          <Link href="/landing-page" className="text-white hover:bg-white/10 p-1 rounded transition-colors">
            <X size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white text-[#7e22ce] flex items-center justify-center font-bold rounded shadow-sm text-xs">S</div>
            <div className="hidden sm:flex flex-col leading-tight">
              <input
                className="bg-transparent font-semibold text-xs outline-none border-b border-white/30 focus:border-white w-40"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <div className="flex items-center gap-1 border-b border-white/20 pb-0.5">
                <span className="text-[10px] text-purple-200 select-none">/lp/</span>
                <input
                  className="bg-transparent text-[10px] text-white/90 outline-none w-40"
                  value={slug}
                  placeholder="nama-produk-anda"
                  onChange={e => setSlug(sanitizeSlug(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Device Switcher */}
          <div className="hidden sm:flex bg-white/20 rounded p-0.5 gap-0.5">
            {([['desktop', <Monitor size={14} />], ['tablet', <Tablet size={14} />], ['mobile', <Smartphone size={14} />]] as any[]).map(([d, icon]) => (
              <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded transition-colors ${device === d ? 'bg-white text-[#7e22ce]' : 'hover:bg-white/10'}`}>{icon}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="bg-white/10 border border-white/30 text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-medium hover:bg-white/20 transition-colors text-xs">
              <Save size={13} /> <span className="hidden sm:inline">Simpan</span>
            </button>
            <button onClick={handlePublish} className="bg-white text-[#7e22ce] px-3 py-1.5 rounded flex items-center gap-1.5 font-bold hover:bg-purple-50 transition-colors text-xs">
              <Rocket size={13} /> <span className="hidden sm:inline">Terbitkan</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Component Palette ── */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 transition-all duration-300 ${sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Komponen</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 p-1"><ChevronsLeft size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
            {PALETTE.map(p => (
              <div
                key={p.type}
                draggable
                onDragStart={() => onPaletteDragStart(p.type)}
                onClick={() => { const nb = defaultBlock(p.type); setBlocks(prev => [...prev, nb]); setSelectedId(nb.id); }}
                className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 rounded-lg text-gray-600 text-[10px] font-semibold cursor-grab hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all select-none bg-white shadow-sm"
              >
                <div className="text-gray-400">{p.icon}</div>
                {p.label}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 rounded px-3 py-2 text-xs font-semibold transition-colors"
            >
              <Settings2 size={14} /> Pengaturan Halaman
            </button>
          </div>
        </aside>

        {/* Re-open left sidebar */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 border-l-0 shadow p-1.5 rounded-r-md text-gray-500 hover:text-purple-600 z-20">
            <ChevronsRight size={16} />
          </button>
        )}

        {/* ── Canvas ── */}
        <section
          className="flex-1 overflow-y-auto bg-[#e8edf2] flex flex-col items-center py-8 px-4 pb-32"
          onDragOver={e => e.preventDefault()}
          onDrop={onCanvasDrop}
          onClick={() => setSelectedId(null)}
        >
          <div className={`w-full ${canvasWidth} bg-white shadow-2xl rounded-sm relative`}>
            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-80 text-gray-400 gap-2 select-none">
                <div className="text-5xl">📦</div>
                <p className="text-sm font-medium">Seret komponen ke sini</p>
                <p className="text-xs">atau klik komponen di sidebar kiri</p>
              </div>
            )}
            {blocks.map((block, idx) => {
              const sel = block.id === selectedId;
              return (
                <div
                  key={block.id}
                  className={`relative group transition-all ${sel ? 'ring-2 ring-purple-500 ring-offset-0' : 'hover:ring-2 hover:ring-purple-300'} ${dragOverIdx === idx ? 'border-t-4 border-purple-400' : ''}`}
                  draggable
                  onDragStart={() => onBlockDragStart(idx)}
                  onDragOver={e => onBlockDragOver(e, idx)}
                  onDrop={e => onBlockDrop(e, idx)}
                  onClick={e => { e.stopPropagation(); setSelectedId(block.id); setRightPanelOpen(true); }}
                >
                  {/* Block Controls Overlay */}
                  <div className={`absolute top-1 right-1 z-20 flex gap-1 ${sel ? 'flex' : 'hidden group-hover:flex'}`}>
                    <button onClick={e => { e.stopPropagation(); moveBlock(idx, -1); }} className="bg-white border border-gray-200 rounded p-0.5 shadow text-gray-500 hover:text-purple-600"><ChevronUp size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(idx, 1); }} className="bg-white border border-gray-200 rounded p-0.5 shadow text-gray-500 hover:text-purple-600"><ChevronDown size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="bg-white border border-red-200 rounded p-0.5 shadow text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                  </div>
                  {/* Drag handle */}
                  <div className={`absolute top-1 left-1 z-20 cursor-grab ${sel ? 'flex' : 'hidden group-hover:flex'} text-gray-400`}>
                    <GripVertical size={13} />
                  </div>
                  {/* Block type label */}
                  {sel && (
                    <div className="absolute top-0 left-0 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 font-bold uppercase z-20 rounded-br">
                      {block.type}
                    </div>
                  )}
                  <BlockRenderer
                    block={block}
                    isSelected={sel}
                    onClick={() => { setSelectedId(block.id); setRightPanelOpen(true); }}
                    onContentChange={(key, val) => updateBlock(block.id, key, val)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Right Panel: Properties ── */}
        <aside className={`bg-white border-l border-gray-200 flex flex-col shrink-0 transition-all duration-300 ${rightPanelOpen && selectedBlock ? 'w-[240px]' : 'w-0 overflow-hidden'}`}>
          {selectedBlock && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Edit Elemen</span>
                <button onClick={() => setRightPanelOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><ChevronsRight size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PropertiesPanel
                  block={selectedBlock}
                  onChange={(key, val) => updateBlock(selectedBlock.id, key, val)}
                  onChangeStyle={(key, val) => updateStyle(selectedBlock.id, key, val)}
                />
              </div>
            </>
          )}
        </aside>
      </main>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings2 size={18} className="text-purple-600" />
                Pengaturan Halaman
              </h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Slug URL</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 rounded-lg px-3 py-2 transition-all">
                  <span className="text-sm text-gray-500 font-medium select-none">/lp/</span>
                  <input
                    className="flex-1 bg-transparent text-sm text-gray-800 font-medium focus:outline-none"
                    value={slug}
                    placeholder="nama-produk-anda"
                    onChange={e => setSlug(sanitizeSlug(e.target.value))}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">URL ini akan digunakan sebagai link utama landing page Anda.</p>
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Custom Domain</label>
                <input
                  type="text"
                  placeholder="contoh: promo.gamamilk.co.id"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white transition-all"
                  value={domain}
                  onChange={e => setDomain(e.target.value.trim())}
                />
                
                {domain && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-md inline-flex ${
                      domainStatus === 'active' ? 'bg-green-100 text-green-700' :
                      domainStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        domainStatus === 'active' ? 'bg-green-500' :
                        domainStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      {domainStatus === 'active' ? 'Domain Terhubung ✓' : domainStatus === 'pending' ? 'Menunggu Propagasi DNS...' : 'Belum diatur'}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      Untuk menghubungkan domain ini, Anda perlu membuat <strong>CNAME record</strong> pada pengaturan DNS domain Anda yang mengarah ke server ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
