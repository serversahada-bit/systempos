'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  AlignLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  CopyPlus,
  GripVertical,
  Image as ImageIcon,
  List,
  Minus,
  Monitor,
  Palette,
  Rocket,
  Save,
  Settings2,
  ShoppingCart,
  Smartphone,
  Square,
  Star,
  Tablet,
  Trash2,
  Type,
  Upload,
  X,
  LayoutTemplate,
  Video,
  MessageCircleQuestion,
  PanelBottom,
  Pencil,
} from 'lucide-react';
import { Block, BlockType, buildStoredHtml, sanitizeSlug } from '@/lib/landing-page-renderer';
import {
  LandingPageAnalyticsConfig,
  META_PIXEL_EVENT_OPTIONS,
  MetaPixelEvent,
  parseLandingPageAnalytics,
  serializeLandingPageAnalytics,
} from '@/lib/landing-page-analytics';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function buildDefaultFutureDate() {
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const timezoneOffset = future.getTimezoneOffset() * 60000;
  return new Date(future.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getCountdownPreview(endDate: string) {
  const target = new Date(endDate);
  if (Number.isNaN(target.getTime())) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', expired: true };
  }

  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', expired: true };
  }

  let totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds -= days * 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    expired: false,
  };
}

function createEmptyAnalyticsConfig(): LandingPageAnalyticsConfig {
  return {
    id: `analytics-${generateId()}`,
    type: 'meta_pixel',
    name: '',
    pixelId: '',
    conversionApiAccessToken: '',
    testCode: '',
    openEvents: ['ViewContent'],
  };
}

function defaultBlock(type: BlockType): Block {
  const id = generateId();

  switch (type) {
    case 'heading':
      return {
        id,
        type,
        content: { text: 'Judul utama landing page Anda' },
        styles: {
          fontSize: '28px',
          fontWeight: '800',
          color: '#111827',
          textAlign: 'center',
          padding: '16px',
        },
      };
    case 'text':
      return {
        id,
        type,
        content: { text: 'Tulis penjelasan singkat, manfaat, atau penawaran utama di sini.' },
        styles: {
          fontSize: '14px',
          color: '#4b5563',
          textAlign: 'left',
          lineHeight: '1.7',
          padding: '12px 16px',
        },
      };
    case 'image':
      return {
        id,
        type,
        content: { src: '', alt: 'Gambar Produk' },
        styles: {
          width: '100%',
          borderRadius: '12px',
          padding: '12px',
        },
      };
    case 'button':
      return {
        id,
        type,
        content: { text: 'Pesan Sekarang', href: '#' },
        styles: {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '700',
          padding: '16px 24px',
          borderRadius: '999px',
          textAlign: 'center',
        },
      };
    case 'divider':
      return {
        id,
        type,
        content: {},
        styles: {
          borderColor: '#e5e7eb',
          margin: '8px 16px',
        },
      };
    case 'list':
      return {
        id,
        type,
        content: {
          items: '✅ Manfaat pertama\n✅ Manfaat kedua\n✅ Manfaat ketiga',
        },
        styles: {
          fontSize: '14px',
          color: '#374151',
          padding: '12px 16px',
          lineHeight: '2',
        },
      };
    case 'testimonial':
      return {
        id,
        type,
        content: {
          quote: '"Produknya bagus dan hasilnya terasa cepat."',
          name: 'Siti, 34 Tahun',
          rating: '5',
        },
        styles: {
          backgroundColor: '#fffbeb',
          borderRadius: '16px',
          padding: '16px',
          margin: '8px 16px',
        },
      };
    case 'pricing':
      return {
        id,
        type,
        content: {
          originalPrice: 'Rp 250.000',
          salePrice: 'Rp 125.000',
          label: 'Hemat 50%',
        },
        styles: {
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          margin: '8px 16px',
        },
      };
    case 'hero':
      return {
        id,
        type,
        content: {
          title: 'Judul Hero Luar Biasa',
          subtitle: 'Deskripsi singkat mengenai produk atau layanan Anda.',
          buttonText: 'Beli Sekarang',
          buttonLink: '#',
        },
        styles: {
          textAlign: 'center',
          padding: '48px 16px',
          backgroundColor: '#f3f4f6',
          color: '#111827',
          borderRadius: '16px',
          margin: '16px',
        },
      };
    case 'video':
      return {
        id,
        type,
        content: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        styles: { padding: '0px', margin: '16px', borderRadius: '16px' },
      };
    case 'faq':
      return {
        id,
        type,
        content: {
          question1: 'Apakah produk ini bergaransi?',
          answer1: 'Ya, kami memberikan garansi uang kembali.',
          question2: 'Berapa lama pengirimannya?',
          answer2: 'Pengiriman memakan waktu 2-3 hari kerja.',
        },
        styles: { padding: '16px', margin: '16px', backgroundColor: '#f9fafb', borderRadius: '16px' },
      };
    case 'footer':
      return {
        id,
        type,
        content: { brandName: 'Toko Saya', contactInfo: 'Hubungi: 0812-3456-7890' },
        styles: { textAlign: 'center', padding: '24px 16px', margin: '16px 0 0 0', backgroundColor: '#111827', color: '#f3f4f6', borderRadius: '0px' },
      };
    case 'gallery':
      return {
        id,
        type,
        content: {
          image1: '',
          image2: '',
          image3: '',
          image4: '',
        },
        styles: {
          padding: '16px',
          margin: '16px',
          gap: '12px',
          borderRadius: '18px',
        },
      };
    case 'form':
      return {
        id,
        type,
        content: {
          title: 'Form Pemesanan Cepat',
          subtitle: 'Isi data Anda, tim kami akan segera menghubungi untuk follow up.',
          namePlaceholder: 'Nama lengkap',
          phonePlaceholder: 'No. WhatsApp aktif',
          emailPlaceholder: 'Email',
          messagePlaceholder: 'Tulis kebutuhan Anda',
          buttonText: 'Kirim Sekarang',
          method: 'post',
          action: '',
          successMessage: 'Terima kasih, data Anda sudah kami terima.',
        },
        styles: {
          padding: '20px',
          margin: '16px',
          gap: '12px',
          borderRadius: '20px',
          backgroundColor: '#f8fafc',
          color: '#111827',
          buttonBackgroundColor: '#7c3aed',
          buttonTextColor: '#ffffff',
          buttonBorderRadius: '999px',
        },
      };
    case 'stats':
      return {
        id,
        type,
        content: {
          value1: '1.2K+',
          label1: 'Pelanggan',
          value2: '4.9/5',
          label2: 'Rating',
          value3: '24/7',
          label3: 'Support',
        },
        styles: {
          padding: '20px',
          margin: '16px',
          gap: '12px',
          borderRadius: '20px',
          backgroundColor: '#111827',
          color: '#ffffff',
          fontSize: '28px',
        },
      };
    case 'countdown':
      return {
        id,
        type,
        content: {
          label: 'Promo berakhir dalam',
          endDate: buildDefaultFutureDate(),
          expiredText: 'Promo sudah berakhir',
        },
        styles: {
          padding: '20px',
          margin: '16px',
          borderRadius: '20px',
          backgroundColor: '#7c3aed',
          color: '#ffffff',
          textAlign: 'center',
        },
      };
    case 'spacer':
      return {
        id,
        type,
        content: {},
        styles: {
          height: '40px',
          margin: '0px',
          backgroundColor: 'transparent',
          borderRadius: '0px',
        },
      };
    default:
      return {
        id,
        type: 'text',
        content: { text: 'Block baru' },
        styles: {},
      };
  }
}

const PALETTE: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Judul', icon: <Type size={16} /> },
  { type: 'text', label: 'Teks', icon: <AlignLeft size={16} /> },
  { type: 'image', label: 'Gambar', icon: <ImageIcon size={16} /> },
  { type: 'button', label: 'Tombol', icon: <ShoppingCart size={16} /> },
  { type: 'divider', label: 'Pemisah', icon: <Minus size={16} /> },
  { type: 'list', label: 'Daftar', icon: <List size={16} /> },
  { type: 'testimonial', label: 'Testimoni', icon: <Star size={16} /> },
  { type: 'pricing', label: 'Harga', icon: <Square size={16} /> },
  { type: 'hero', label: 'Hero', icon: <LayoutTemplate size={16} /> },
  { type: 'video', label: 'Video', icon: <Video size={16} /> },
  { type: 'faq', label: 'FAQ', icon: <MessageCircleQuestion size={16} /> },
  { type: 'footer', label: 'Footer', icon: <PanelBottom size={16} /> },
  { type: 'gallery', label: 'Gallery', icon: <ImageIcon size={16} /> },
  { type: 'form', label: 'Form', icon: <AlignLeft size={16} /> },
  { type: 'stats', label: 'Stats', icon: <Square size={16} /> },
  { type: 'countdown', label: 'Countdown', icon: <ChevronsRight size={16} /> },
  { type: 'spacer', label: 'Spacer', icon: <Minus size={16} /> },
];

function uploadImage(onSuccess: (url: string) => void) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.url) {
      onSuccess(result.url);
    } else {
      Swal.fire('Upload gagal', result.error || 'Gagal upload gambar.', 'error');
    }
  };
}

function BlockRenderer({
  block,
  onClick,
  onContentChange,
}: {
  block: Block;
  onClick: () => void;
  onContentChange: (key: string, value: string) => void;
}) {
  const s = block.styles;

  const editableProps = (key: string) => ({
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: (event: React.FocusEvent<HTMLElement>) => onContentChange(key, event.currentTarget.innerText),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      onClick();
    },
  });

  switch (block.type) {
    case 'heading':
      return (
        <h2
          style={{
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            color: s.color,
            textAlign: s.textAlign as React.CSSProperties['textAlign'],
            padding: s.padding,
            outline: 'none',
            cursor: 'text',
          }}
          {...editableProps('text')}
        >
          {block.content.text}
        </h2>
      );
    case 'text':
      return (
        <p
          style={{
            fontSize: s.fontSize,
            color: s.color,
            textAlign: s.textAlign as React.CSSProperties['textAlign'],
            lineHeight: s.lineHeight,
            padding: s.padding,
            outline: 'none',
            cursor: 'text',
            whiteSpace: 'pre-wrap',
          }}
          {...editableProps('text')}
        >
          {block.content.text}
        </p>
      );
    case 'image':
      return (
        <div style={{ padding: s.padding }} onClick={onClick}>
          {block.content.src ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.content.src}
                alt={block.content.alt}
                style={{ width: s.width, borderRadius: s.borderRadius }}
                className="block"
              />
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/45 opacity-0 transition group-hover:opacity-100">
                <div className="flex flex-col items-center text-white">
                  <Upload size={22} className="mb-1" />
                  <span className="text-xs font-semibold">Ganti gambar</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadImage((url) => onContentChange('src', url))}
                />
              </label>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 text-gray-400 transition hover:border-purple-400 hover:bg-purple-50">
              <ImageIcon size={36} className="mb-2" />
              <span className="text-xs font-semibold text-gray-500">Klik untuk upload gambar</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadImage((url) => onContentChange('src', url))}
              />
            </label>
          )}
        </div>
      );
    case 'button':
      return (
        <div style={{ margin: '8px 16px' }}>
          <span
            style={{
              backgroundColor: s.backgroundColor,
              color: s.color,
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
              padding: s.padding,
              borderRadius: s.borderRadius,
              display: 'block',
              textAlign: s.textAlign as React.CSSProperties['textAlign'],
              cursor: 'text',
              outline: 'none',
            }}
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
          style={{
            fontSize: s.fontSize,
            color: s.color,
            padding: s.padding,
            lineHeight: s.lineHeight,
            outline: 'none',
            cursor: 'text',
            whiteSpace: 'pre-wrap',
          }}
          {...editableProps('items')}
        >
          {block.content.items}
        </div>
      );
    case 'testimonial':
      return (
        <div
          style={{
            backgroundColor: s.backgroundColor,
            borderRadius: s.borderRadius,
            padding: s.padding,
            margin: s.margin,
          }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <div className="mb-2 text-lg text-yellow-400">{'★'.repeat(Number(block.content.rating || '0'))}</div>
          <p
            style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', outline: 'none', cursor: 'text' }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => onContentChange('quote', event.currentTarget.innerText)}
          >
            {block.content.quote}
          </p>
          <div
            style={{ fontSize: '12px', fontWeight: '700', marginTop: '8px', outline: 'none', cursor: 'text' }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => onContentChange('name', event.currentTarget.innerText)}
          >
            {block.content.name}
          </div>
        </div>
      );
    case 'pricing':
      return (
        <div
          style={{
            textAlign: s.textAlign as React.CSSProperties['textAlign'],
            padding: s.padding,
            backgroundColor: s.backgroundColor,
            borderRadius: s.borderRadius,
            margin: s.margin,
          }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <div style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through', marginBottom: '4px' }}>
            {block.content.originalPrice}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#dc2626', marginBottom: '4px' }}>
            {block.content.salePrice}
          </div>
          <span style={{ background: '#fef9c3', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px' }}>
            {block.content.label}
          </span>
        </div>
      );
    case 'hero':
      return (
        <div style={{ textAlign: s.textAlign as React.CSSProperties['textAlign'], padding: s.padding, backgroundColor: s.backgroundColor, color: s.color, borderRadius: s.borderRadius, margin: s.margin }} onClick={onClick} className="cursor-pointer">
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2, outline: 'none' }} contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('title', e.currentTarget.innerText)}>{block.content.title}</h1>
          <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.9, lineHeight: 1.5, outline: 'none' }} contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('subtitle', e.currentTarget.innerText)}>{block.content.subtitle}</p>
          {block.content.buttonText && (
            <div style={{ display: 'inline-block', backgroundColor: '#111827', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold' }}>
              {block.content.buttonText}
            </div>
          )}
        </div>
      );
    case 'video':
      let videoUrl = block.content.url || '';
      if (videoUrl.includes('youtube.com/watch?v=')) videoUrl = videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
      else if (videoUrl.includes('youtu.be/')) videoUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/');
      return (
        <div style={{ padding: s.padding, margin: s.margin, borderRadius: s.borderRadius, overflow: 'hidden', backgroundColor: '#000' }} onClick={onClick} className="cursor-pointer">
          <iframe width="100%" height="315" src={videoUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="pointer-events-none block w-full border-none"></iframe>
        </div>
      );
    case 'faq':
      return (
        <div style={{ padding: s.padding, margin: s.margin, borderRadius: s.borderRadius, backgroundColor: s.backgroundColor }} onClick={onClick} className="cursor-pointer">
          <details className="mb-2 rounded-lg border border-gray-200 bg-white p-3" open>
            <summary className="cursor-pointer font-semibold text-gray-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('question1', e.currentTarget.innerText)}>{block.content.question1}</summary>
            <div className="mt-2 text-sm text-gray-600 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('answer1', e.currentTarget.innerText)}>{block.content.answer1}</div>
          </details>
          <details className="rounded-lg border border-gray-200 bg-white p-3">
            <summary className="cursor-pointer font-semibold text-gray-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('question2', e.currentTarget.innerText)}>{block.content.question2}</summary>
            <div className="mt-2 text-sm text-gray-600 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('answer2', e.currentTarget.innerText)}>{block.content.answer2}</div>
          </details>
        </div>
      );
    case 'footer':
      return (
        <div style={{ textAlign: 'center', padding: s.padding, margin: s.margin, backgroundColor: s.backgroundColor, color: s.color, fontSize: '12px', borderRadius: s.borderRadius }} onClick={onClick} className="cursor-pointer">
          <div style={{ marginBottom: '8px', fontWeight: 'bold', outline: 'none' }} contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('brandName', e.currentTarget.innerText)}>{block.content.brandName}</div>
          <div style={{ opacity: 0.8, outline: 'none' }} contentEditable suppressContentEditableWarning onBlur={(e) => onContentChange('contactInfo', e.currentTarget.innerText)}>{block.content.contactInfo}</div>
          <div style={{ marginTop: '16px', opacity: 0.6 }}>&copy; {new Date().getFullYear()} Hak Cipta Dilindungi.</div>
        </div>
      );
    case 'gallery': {
      const galleryImages = ['image1', 'image2', 'image3', 'image4'].map((key, index) => {
        const src = block.content[key];
        const alt = block.content[`alt${index + 1}`] || `Gallery ${index + 1}`;

        return (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border border-dashed border-purple-200 bg-purple-50/60"
            style={{ borderRadius: s.borderRadius, aspectRatio: '1 / 1' }}
          >
            {src ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="h-full w-full object-cover" />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                  <span className="text-xs font-semibold text-white">Ganti gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadImage((url) => onContentChange(key, url))}
                  />
                </label>
              </>
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-purple-500">
                <ImageIcon size={26} />
                <span className="text-[11px] font-semibold">Upload gambar {index + 1}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadImage((url) => onContentChange(key, url))}
                />
              </label>
            )}
          </div>
        );
      });

      return (
        <div style={{ padding: s.padding, margin: s.margin }} onClick={onClick} className="cursor-pointer">
          <div className="grid grid-cols-2" style={{ gap: s.gap }}>
            {galleryImages}
          </div>
        </div>
      );
    }
    case 'form':
      return (
        <div
          style={{
            padding: s.padding,
            margin: s.margin,
            backgroundColor: s.backgroundColor,
            color: s.color,
            borderRadius: s.borderRadius,
          }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <div className="mb-2 text-2xl font-extrabold leading-tight">{block.content.title}</div>
          <div className="mb-4 text-sm leading-6 opacity-80">{block.content.subtitle}</div>
          <div className="grid" style={{ gap: s.gap || '12px' }}>
            <input
              readOnly
              value={block.content.namePlaceholder || ''}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 outline-none"
            />
            <input
              readOnly
              value={block.content.phonePlaceholder || ''}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 outline-none"
            />
            <input
              readOnly
              value={block.content.emailPlaceholder || ''}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 outline-none"
            />
            <textarea
              readOnly
              value={block.content.messagePlaceholder || ''}
              className="min-h-28 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 outline-none"
            />
            <button
              type="button"
              className="rounded-full px-4 py-3 text-sm font-bold"
              style={{
                backgroundColor: s.buttonBackgroundColor,
                color: s.buttonTextColor,
                borderRadius: s.buttonBorderRadius,
              }}
            >
              {block.content.buttonText}
            </button>
          </div>
        </div>
      );
    case 'stats': {
      const statItems = [
        { value: block.content.value1, label: block.content.label1 },
        { value: block.content.value2, label: block.content.label2 },
        { value: block.content.value3, label: block.content.label3 },
      ];

      return (
        <div
          style={{
            padding: s.padding,
            margin: s.margin,
            backgroundColor: s.backgroundColor,
            color: s.color,
            borderRadius: s.borderRadius,
          }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <div className="grid grid-cols-3" style={{ gap: s.gap || '12px' }}>
            {statItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="text-center">
                <div style={{ fontSize: s.fontSize }} className="font-black leading-none">
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] leading-5 opacity-75">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'countdown': {
      const countdownPreview = getCountdownPreview(block.content.endDate || '');
      const countdownItems = [
        { label: 'Hari', value: countdownPreview.days },
        { label: 'Jam', value: countdownPreview.hours },
        { label: 'Menit', value: countdownPreview.minutes },
        { label: 'Detik', value: countdownPreview.seconds },
      ];

      return (
        <div
          style={{
            padding: s.padding,
            margin: s.margin,
            backgroundColor: s.backgroundColor,
            color: s.color,
            borderRadius: s.borderRadius,
            textAlign: s.textAlign as React.CSSProperties['textAlign'],
          }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">{block.content.label}</div>
          <div className="grid grid-cols-4 gap-2">
            {countdownItems.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm">
                <div className="text-xl font-black leading-none">{item.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-75">{item.label}</div>
              </div>
            ))}
          </div>
          {countdownPreview.expired ? (
            <div className="mt-3 text-xs opacity-80">{block.content.expiredText || 'Promo sudah berakhir'}</div>
          ) : null}
        </div>
      );
    }
    case 'spacer':
      return (
        <div
          style={{
            height: s.height,
            margin: s.margin,
            backgroundColor: s.backgroundColor,
            borderRadius: s.borderRadius,
          }}
          onClick={onClick}
          className="flex cursor-pointer items-center justify-center border border-dashed border-gray-300 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400"
        >
          Spacer {s.height}
        </div>
      );
    default:
      return null;
  }
}

function PropertiesPanel({
  block,
  onChange,
  onChangeStyle,
}: {
  block: Block;
  onChange: (key: string, value: string) => void;
  onChangeStyle: (key: string, value: string) => void;
}) {
  const input = (label: string, key: string, value: string, isStyle = false, type = 'text') => (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
        onChange={(event) => (isStyle ? onChangeStyle(key, event.target.value) : onChange(key, event.target.value))}
      />
    </div>
  );

  const textarea = (label: string, key: string, value: string, isStyle = false, rows = 3) => (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">{label}</label>
      <textarea
        rows={rows}
        value={value}
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
        onChange={(event) => (isStyle ? onChangeStyle(key, event.target.value) : onChange(key, event.target.value))}
      />
    </div>
  );

  const imageField = (label: string, key: string, preview?: string) => (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">{label}</label>
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-purple-300 px-2 py-2.5 text-xs font-semibold text-purple-600 transition hover:bg-purple-50">
        <Upload size={13} />
        Upload Gambar
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadImage((url) => onChange(key, url))}
        />
      </label>
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="mt-2 rounded" />
        </>
      ) : null}
    </div>
  );

  const s = block.styles;
  const c = block.content;

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase text-purple-600">
        <Settings2 size={11} />
        Konten
      </div>

      {(block.type === 'heading' || block.type === 'text' || block.type === 'button') && input('Teks', 'text', c.text || '')}
      {block.type === 'list' && input('Daftar', 'items', c.items || '')}
      {block.type === 'image' && (
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Gambar</label>
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-purple-300 px-2 py-2.5 text-xs font-semibold text-purple-600 transition hover:bg-purple-50">
            <Upload size={13} />
            Upload Gambar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadImage((url) => onChange('src', url))}
            />
          </label>
          {c.src ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt={c.alt || ''} className="mt-2 rounded" />
            </>
          ) : null}
          {input('Alt Text', 'alt', c.alt || '')}
        </div>
      )}
      {block.type === 'button' && input('Link Tombol', 'href', c.href || '')}
      {block.type === 'testimonial' && (
        <>
          {input('Kutipan', 'quote', c.quote || '')}
          {input('Nama', 'name', c.name || '')}
          {input('Rating', 'rating', c.rating || '5')}
        </>
      )}
      {block.type === 'pricing' && (
        <>
          {input('Harga Normal', 'originalPrice', c.originalPrice || '')}
          {input('Harga Promo', 'salePrice', c.salePrice || '')}
          {input('Label', 'label', c.label || '')}
        </>
      )}
      {block.type === 'hero' && (
        <>
          {input('Judul', 'title', c.title || '')}
          {input('Subjudul', 'subtitle', c.subtitle || '')}
          {input('Teks Tombol', 'buttonText', c.buttonText || '')}
          {input('Link Tombol', 'buttonLink', c.buttonLink || '')}
        </>
      )}
      {block.type === 'video' && input('URL Video YouTube', 'url', c.url || '')}
      {block.type === 'faq' && (
        <>
          {input('Pertanyaan 1', 'question1', c.question1 || '')}
          {input('Jawaban 1', 'answer1', c.answer1 || '')}
          {input('Pertanyaan 2', 'question2', c.question2 || '')}
          {input('Jawaban 2', 'answer2', c.answer2 || '')}
        </>
      )}
      {block.type === 'footer' && (
        <>
          {input('Nama Brand', 'brandName', c.brandName || '')}
          {input('Info Kontak', 'contactInfo', c.contactInfo || '')}
        </>
      )}
      {block.type === 'gallery' && (
        <>
          {imageField('Gambar 1', 'image1', c.image1)}
          {imageField('Gambar 2', 'image2', c.image2)}
          {imageField('Gambar 3', 'image3', c.image3)}
          {imageField('Gambar 4', 'image4', c.image4)}
        </>
      )}
      {block.type === 'form' && (
        <>
          {input('Judul Form', 'title', c.title || '')}
          {textarea('Subjudul', 'subtitle', c.subtitle || '', false, 4)}
          {input('Placeholder Nama', 'namePlaceholder', c.namePlaceholder || '')}
          {input('Placeholder WhatsApp', 'phonePlaceholder', c.phonePlaceholder || '')}
          {input('Placeholder Email', 'emailPlaceholder', c.emailPlaceholder || '')}
          {textarea('Placeholder Pesan', 'messagePlaceholder', c.messagePlaceholder || '', false, 3)}
          {input('Teks Tombol', 'buttonText', c.buttonText || '')}
          {input('Form Action URL', 'action', c.action || '')}
          {textarea('Pesan Sukses', 'successMessage', c.successMessage || '', false, 3)}
        </>
      )}
      {block.type === 'stats' && (
        <>
          {input('Value 1', 'value1', c.value1 || '')}
          {input('Label 1', 'label1', c.label1 || '')}
          {input('Value 2', 'value2', c.value2 || '')}
          {input('Label 2', 'label2', c.label2 || '')}
          {input('Value 3', 'value3', c.value3 || '')}
          {input('Label 3', 'label3', c.label3 || '')}
        </>
      )}
      {block.type === 'countdown' && (
        <>
          {input('Label', 'label', c.label || '')}
          {input('Tanggal Berakhir', 'endDate', c.endDate || '', false, 'datetime-local')}
          {input('Pesan Saat Habis', 'expiredText', c.expiredText || '')}
        </>
      )}
      {block.type === 'spacer' && (
        <div className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] leading-5 text-gray-500">
          Gunakan spacer untuk memberi jarak antar section seperti di builder page modern.
        </div>
      )}

      <div className="mb-3 mt-5 flex items-center gap-1 text-[10px] font-bold uppercase text-purple-600">
        <Palette size={11} />
        Tampilan
      </div>

      {s.fontSize !== undefined && input('Ukuran Font', 'fontSize', s.fontSize, true)}
      {s.lineHeight !== undefined && input('Line Height', 'lineHeight', s.lineHeight, true)}
      {s.color !== undefined && input('Warna Teks', 'color', s.color, true, 'color')}
      {s.backgroundColor !== undefined && input('Warna Background', 'backgroundColor', s.backgroundColor, true, 'color')}
      {s.borderRadius !== undefined && input('Border Radius', 'borderRadius', s.borderRadius, true)}
      {s.padding !== undefined && input('Padding', 'padding', s.padding, true)}
      {s.margin !== undefined && input('Margin', 'margin', s.margin, true)}
      {s.width !== undefined && input('Lebar', 'width', s.width, true)}
      {s.height !== undefined && input('Tinggi', 'height', s.height, true)}
      {s.gap !== undefined && input('Gap', 'gap', s.gap, true)}
      {s.buttonBackgroundColor !== undefined && input('Warna Tombol', 'buttonBackgroundColor', s.buttonBackgroundColor, true, 'color')}
      {s.buttonTextColor !== undefined && input('Warna Teks Tombol', 'buttonTextColor', s.buttonTextColor, true, 'color')}
      {s.buttonBorderRadius !== undefined && input('Radius Tombol', 'buttonBorderRadius', s.buttonBorderRadius, true)}
      {s.textAlign !== undefined && (
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Rata Teks</label>
          <select
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none"
            value={s.textAlign}
            onChange={(event) => onChangeStyle('textAlign', event.target.value)}
          >
            <option value="left">Kiri</option>
            <option value="center">Tengah</option>
            <option value="right">Kanan</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');

  const initialBlocks = (): Block[] => {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = localStorage.getItem('lp_builder_blocks');
    if (saved) {
      try {
        return JSON.parse(saved) as Block[];
      } catch {
        localStorage.removeItem('lp_builder_blocks');
      }
    }

    return [
      defaultBlock('heading'),
      defaultBlock('text'),
      defaultBlock('image'),
      defaultBlock('button'),
      defaultBlock('divider'),
      defaultBlock('testimonial'),
      defaultBlock('pricing'),
    ];
  };

  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [title, setTitle] = useState('Landing Page Baru');
  const [slug, setSlug] = useState(`my-landing-page-${generateId().slice(0, 4)}`);
  const [domain, setDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'inactive' | 'pending' | 'active'>('inactive');
  const [analyticsConfigs, setAnalyticsConfigs] = useState<LandingPageAnalyticsConfig[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState<LandingPageAnalyticsConfig>(createEmptyAnalyticsConfig);
  const [isLoadingEdit, setIsLoadingEdit] = useState(() => Boolean(editSlug));
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragPaletteType = useRef<BlockType | null>(null);

  useEffect(() => {
    if (!editSlug) {
      return;
    }

    fetch(`/api/landing-pages/${editSlug}`)
      .then((response) => response.json())
      .then((result) => {
        if (!result.data) return;
        const page = result.data;
        setTitle(page.title || 'Landing Page Baru');
        setSlug(page.slug || '');
        setDomain(page.domain || '');
        setDomainStatus(page.domain_status || 'inactive');
        setAnalyticsConfigs(parseLandingPageAnalytics(page.analytics_json));

        if (page.blocks_json) {
          try {
            setBlocks(JSON.parse(page.blocks_json));
          } catch {
            setBlocks([]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingEdit(false));
  }, [editSlug]);

  const selectedBlock = blocks.find((block) => block.id === selectedId) || null;

  const updateBlock = useCallback((id: string, key: string, value: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, content: { ...block.content, [key]: value } } : block)));
  }, []);

  const updateStyle = useCallback((id: string, key: string, value: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, styles: { ...block.styles, [key]: value } } : block)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const moveBlock = useCallback((index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;

    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }, [blocks.length]);

  const handleSave = async () => {
    const html = buildStoredHtml(blocks);
    const analyticsJson = serializeLandingPageAnalytics(analyticsConfigs);
    localStorage.setItem('lp_builder_blocks', JSON.stringify(blocks));
    setIsSavingDraft(true);

    try {
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          html_data: html,
          blocks_json: JSON.stringify(blocks),
          analytics_json: analyticsJson,
          status: 'Draft',
          domain: domain || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan draft.');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Draft disimpan',
        html: `Draft berhasil disimpan.<br><br><div class="p-3 bg-gray-50 border rounded text-sm text-left"><span class="text-gray-500 font-semibold block mb-1">Preview Link:</span><a href="/lp/${slug}" target="_blank" class="text-purple-600 hover:underline">${window.location.origin}/lp/${slug}</a></div>`,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#7e22ce',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan draft.';
      Swal.fire('Error', message, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    const analyticsJson = serializeLandingPageAnalytics(analyticsConfigs);
    localStorage.setItem('lp_builder_blocks', JSON.stringify(blocks));
    setIsPublishing(true);

    try {
      const response = await fetch('/api/landing-pages/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          blocks_json: JSON.stringify(blocks),
          analytics_json: analyticsJson,
          domain: domain || null,
          domain_status: domain ? domainStatus : 'inactive',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal publish landing page.');
      }

      const publishInfo = result.publish;
      const deployTone =
        publishInfo?.deploy_status === 'deployed'
          ? 'green'
          : publishInfo?.deploy_status === 'failed'
            ? 'red'
            : 'yellow';
      const isRemoteDeployFailed = publishInfo?.deploy_status === 'failed';

      await Swal.fire({
        icon: isRemoteDeployFailed ? 'warning' : 'success',
        title: isRemoteDeployFailed ? 'Publish lokal berhasil, deploy gagal' : 'Publish berhasil',
        html: `Landing page berhasil dipublish.<br><br><div class="p-3 bg-green-50 border border-green-200 rounded text-sm text-left"><span class="text-green-700 font-semibold block mb-1">Preview Link:</span><a href="/lp/${slug}" target="_blank" class="text-green-600 hover:underline font-medium">${window.location.origin}/lp/${slug}</a></div><div class="mt-3 p-3 bg-${deployTone}-50 border border-${deployTone}-200 rounded text-sm text-left"><span class="text-${deployTone}-700 font-semibold block mb-1">Status Deploy:</span><div class="text-${deployTone}-700">${publishInfo?.deploy_message || 'Bundle static berhasil dibuat.'}</div>${publishInfo?.remote_path ? `<div class="mt-2 text-xs text-${deployTone}-700"><strong>Remote Path:</strong> ${publishInfo.remote_path}</div>` : ''}${publishInfo?.output_dir ? `<div class="mt-2 text-xs text-${deployTone}-700"><strong>Output Lokal:</strong> ${publishInfo.output_dir}</div>` : ''}</div>`,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#4c1d95',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal publish landing page.';
      Swal.fire('Error', message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const onPaletteDragStart = (type: BlockType) => {
    dragPaletteType.current = type;
    dragItem.current = null;
  };

  const onBlockDragStart = (index: number) => {
    dragItem.current = index;
    dragPaletteType.current = null;
  };

  const onBlockDrop = (event: React.DragEvent, index: number) => {
    event.preventDefault();

    if (dragPaletteType.current) {
      const newBlock = defaultBlock(dragPaletteType.current);
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(index, 0, newBlock);
        return next;
      });
      setSelectedId(newBlock.id);
    } else if (dragItem.current !== null && dragItem.current !== index) {
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragItem.current!, 1);
        next.splice(index, 0, moved);
        return next;
      });
    }

    dragItem.current = null;
    dragPaletteType.current = null;
    setDragOverIdx(null);
  };

  const onCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault();

    if (dragPaletteType.current) {
      const newBlock = defaultBlock(dragPaletteType.current);
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedId(newBlock.id);
    }

    dragPaletteType.current = null;
    dragItem.current = null;
    setDragOverIdx(null);
  };

  const canvasWidth =
    device === 'desktop' ? 'max-w-4xl' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[390px]';

  const openCreateAnalyticsModal = () => {
    setAnalyticsDraft(createEmptyAnalyticsConfig());
    setIsAnalyticsModalOpen(true);
  };

  const openEditAnalyticsModal = (config: LandingPageAnalyticsConfig) => {
    setAnalyticsDraft({
      ...config,
      openEvents: [...config.openEvents],
    });
    setIsAnalyticsModalOpen(true);
  };

  const saveAnalyticsDraft = () => {
    const normalizedName = analyticsDraft.name.trim();
    const normalizedPixelId = analyticsDraft.pixelId.replace(/[^0-9]/g, '');

    if (!normalizedName || !normalizedPixelId) {
      Swal.fire('Data belum lengkap', 'Nama dan Pixel ID wajib diisi.', 'warning');
      return;
    }

    const normalizedDraft: LandingPageAnalyticsConfig = {
      ...analyticsDraft,
      name: normalizedName,
      pixelId: normalizedPixelId,
      conversionApiAccessToken: analyticsDraft.conversionApiAccessToken?.trim() || '',
      testCode: analyticsDraft.testCode?.trim() || '',
      openEvents: analyticsDraft.openEvents.length > 0 ? analyticsDraft.openEvents : ['ViewContent'],
    };

    setAnalyticsConfigs((prev) => {
      const exists = prev.some((config) => config.id === normalizedDraft.id);
      if (exists) {
        return prev.map((config) => (config.id === normalizedDraft.id ? normalizedDraft : config));
      }

      return [...prev, normalizedDraft];
    });

    setIsAnalyticsModalOpen(false);
  };

  const removeAnalyticsConfig = (configId: string) => {
    setAnalyticsConfigs((prev) => prev.filter((config) => config.id !== configId));
  };

  const toggleAnalyticsEvent = (eventName: MetaPixelEvent) => {
    setAnalyticsDraft((prev) => {
      const exists = prev.openEvents.includes(eventName);
      return {
        ...prev,
        openEvents: exists
          ? prev.openEvents.filter((item) => item !== eventName)
          : [...prev.openEvents, eventName],
      };
    });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f7f9] text-sm">
      <header className="z-20 flex h-14 shrink-0 items-center justify-between bg-[#7e22ce] px-4 text-white shadow">
        <div className="flex items-center gap-3">
          <Link href="/landing-page" className="rounded p-1 transition-colors hover:bg-white/10">
            <X size={20} />
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-[#7e22ce] shadow-sm">
              S
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <input
                className="w-48 border-b border-white/30 bg-transparent text-xs font-semibold outline-none focus:border-white"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="flex items-center gap-1 border-b border-white/20 pb-0.5">
                <span className="select-none text-[10px] text-purple-200">/lp/</span>
                <input
                  className="w-40 bg-transparent text-[10px] text-white/90 outline-none"
                  value={slug}
                  placeholder="nama-produk-anda"
                  onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden gap-0.5 rounded bg-white/20 p-0.5 sm:flex">
            {[
              ['desktop', <Monitor size={14} key="desktop-icon" />],
              ['tablet', <Tablet size={14} key="tablet-icon" />],
              ['mobile', <Smartphone size={14} key="mobile-icon" />],
            ].map(([name, icon]) => (
              <button
                key={name as string}
                onClick={() => setDevice(name as 'desktop' | 'tablet' | 'mobile')}
                className={`rounded p-1.5 transition-colors ${
                  device === name ? 'bg-white text-[#7e22ce]' : 'hover:bg-white/10'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSavingDraft || isPublishing}
              className="flex items-center gap-1.5 rounded border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={13} />
              <span className="hidden sm:inline">{isSavingDraft ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={isSavingDraft || isPublishing}
              className="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-bold text-[#7e22ce] transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Rocket size={13} />
              <span className="hidden sm:inline">{isPublishing ? 'Publishing...' : 'Terbitkan'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside
          className={`z-10 flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
            sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Komponen</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronsLeft size={14} />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
            {PALETTE.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={() => onPaletteDragStart(item.type)}
                onClick={() => {
                  const newBlock = defaultBlock(item.type);
                  setBlocks((prev) => [...prev, newBlock]);
                  setSelectedId(newBlock.id);
                }}
                className="select-none rounded-lg border border-gray-200 bg-white p-3 text-[10px] font-semibold text-gray-600 shadow-sm transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600"
              >
                <div className="mb-1.5 text-gray-400">{item.icon}</div>
                {item.label}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-3">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-purple-300 hover:text-purple-600"
            >
              <Settings2 size={14} />
              Pengaturan Halaman
            </button>
          </div>
        </aside>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-md border border-l-0 border-gray-200 bg-white p-1.5 text-gray-500 shadow transition hover:text-purple-600"
          >
            <ChevronsRight size={16} />
          </button>
        )}

        <section
          className="flex flex-1 flex-col items-center overflow-y-auto bg-[#e8edf2] px-4 py-8 pb-32"
          onClick={() => setSelectedId(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onCanvasDrop}
        >
          {isLoadingEdit ? (
            <div className="mt-24 rounded-2xl bg-white px-8 py-6 shadow-lg">Memuat landing page...</div>
          ) : null}

          <div className={`relative w-full rounded-sm bg-white shadow-2xl ${canvasWidth}`}>
            {blocks.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center gap-2 text-gray-400">
                <div className="text-5xl">□</div>
                <p className="text-sm font-medium">Seret komponen ke sini</p>
                <p className="text-xs">atau klik komponen di sidebar kiri</p>
              </div>
            ) : (
              blocks.map((block, index) => {
                const isSelected = block.id === selectedId;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => onBlockDragStart(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverIdx(index);
                    }}
                    onDrop={(event) => onBlockDrop(event, index)}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(block.id);
                      setRightPanelOpen(true);
                    }}
                    className={`group relative transition-all ${
                      isSelected ? 'ring-2 ring-purple-500' : 'hover:ring-2 hover:ring-purple-300'
                    } ${dragOverIdx === index ? 'border-t-4 border-purple-400' : ''}`}
                  >
                    <div className={`absolute left-1 top-1 z-20 text-gray-400 ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}>
                      <GripVertical size={13} />
                    </div>

                    <div className={`absolute right-1 top-1 z-20 gap-1 ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          moveBlock(index, -1);
                        }}
                        className="rounded border border-gray-200 bg-white p-0.5 text-gray-500 shadow transition hover:text-purple-600"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          moveBlock(index, 1);
                        }}
                        className="rounded border border-gray-200 bg-white p-0.5 text-gray-500 shadow transition hover:text-purple-600"
                      >
                        <ChevronDown size={11} />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="rounded border border-red-200 bg-white p-0.5 text-red-400 shadow transition hover:text-red-600"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {isSelected ? (
                      <div className="absolute left-0 top-0 z-20 rounded-br bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        {block.type}
                      </div>
                    ) : null}

                    <BlockRenderer
                      block={block}
                      onClick={() => {
                        setSelectedId(block.id);
                        setRightPanelOpen(true);
                      }}
                      onContentChange={(key, value) => updateBlock(block.id, key, value)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </section>

        <aside
          className={`flex shrink-0 flex-col border-l border-gray-200 bg-white transition-all duration-300 ${
            rightPanelOpen && selectedBlock ? 'w-[240px]' : 'w-0 overflow-hidden'
          }`}
        >
          {selectedBlock ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Edit Elemen</span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <PropertiesPanel
                  block={selectedBlock}
                  onChange={(key, value) => updateBlock(selectedBlock.id, key, value)}
                  onChangeStyle={(key, value) => updateStyle(selectedBlock.id, key, value)}
                />
              </div>
            </>
          ) : null}
        </aside>
      </main>

      {isSettingsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <Settings2 size={18} className="text-purple-600" />
                Pengaturan Halaman
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Slug URL</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 transition focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                  <span className="select-none text-sm font-medium text-gray-500">/lp/</span>
                  <input
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 focus:outline-none"
                    value={slug}
                    placeholder="nama-produk-anda"
                    onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">URL ini dipakai untuk preview internal dan folder publish.</p>
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Custom Domain</label>
                <input
                  type="text"
                  placeholder="contoh: promo.domainanda.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value.trim())}
                />

                {domain ? (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div
                      className={`inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold ${
                        domainStatus === 'active'
                          ? 'bg-green-100 text-green-700'
                          : domainStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          domainStatus === 'active'
                            ? 'bg-green-500'
                            : domainStatus === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      />
                      {domainStatus === 'active'
                        ? 'Domain terhubung'
                        : domainStatus === 'pending'
                          ? 'Menunggu propagasi DNS'
                          : 'Belum diatur'}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                      Jika domain ini dipakai, status publish akan tetap sukses walau propagasi DNS belum selesai.
                    </p>
                  </div>
                ) : null}
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Konfigurasi Hosting Publish</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-6 text-slate-600">
                  <div>`DEPLOY_HOST` host server website</div>
                  <div>`DEPLOY_PORT` port SFTP/SSH, biasanya `22`</div>
                  <div>`DEPLOY_USERNAME` username server hosting</div>
                  <div>`DEPLOY_PATH` folder root publish, misalnya `/home/user/sites`</div>
                  <div>`DEPLOY_SSH_KEY_PATH` direkomendasikan untuk auto upload</div>
                  <div>`DEPLOY_PASSWORD` bisa dipakai jika server builder punya `sshpass`</div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700">Analitik</label>
                    <p className="mt-1 text-[11px] leading-5 text-gray-500">
                      Tambahkan Meta Pixel per halaman. Versi ini langsung inject browser pixel dan event saat landing page dibuka.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateAnalyticsModal}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                  >
                    <CopyPlus size={13} />
                    Tambah Analitik
                  </button>
                </div>

                <div className="space-y-3">
                  {analyticsConfigs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-[11px] leading-5 text-gray-500">
                      Belum ada pixel. Tambahkan Meta Pixel agar event seperti <strong>ViewContent</strong> bisa otomatis dikirim saat halaman dibuka.
                    </div>
                  ) : (
                    analyticsConfigs.map((config) => (
                      <div key={config.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-800">{config.name}</div>
                            <div className="mt-1 text-xs text-gray-500">Meta Pixel ID: {config.pixelId}</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {config.openEvents.map((eventName) => (
                                <span
                                  key={eventName}
                                  className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700"
                                >
                                  {eventName}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditAnalyticsModal(config)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-purple-300 hover:text-purple-700"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAnalyticsConfig(config.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="mt-3 text-[11px] leading-5 text-gray-500">
                  `Conversion API Access Token` dan `Kode Testing` ikut disimpan sekarang, tapi integrasi server-side CAPI belum diaktifkan di versi ini.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50 p-4">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAnalyticsModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tambah Analitik</h3>
                <p className="mt-1 text-xs text-gray-500">Atur Meta Pixel dan event yang dikirim saat landing page dibuka.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Jenis</label>
                <select
                  value={analyticsDraft.type}
                  onChange={() => setAnalyticsDraft((prev) => ({ ...prev, type: 'meta_pixel' }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="meta_pixel">Meta Pixel</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Nama</label>
                <input
                  value={analyticsDraft.name}
                  onChange={(event) => setAnalyticsDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Masukkan nama pixel"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Pixel ID</label>
                <input
                  value={analyticsDraft.pixelId}
                  onChange={(event) =>
                    setAnalyticsDraft((prev) => ({ ...prev, pixelId: event.target.value.replace(/[^0-9]/g, '') }))
                  }
                  placeholder="Masukkan Pixel ID"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Conversion API Access Token</label>
                <textarea
                  rows={4}
                  value={analyticsDraft.conversionApiAccessToken || ''}
                  onChange={(event) => setAnalyticsDraft((prev) => ({ ...prev, conversionApiAccessToken: event.target.value }))}
                  placeholder="Masukkan Conversion API Access Token"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Kode Testing</label>
                <input
                  value={analyticsDraft.testCode || ''}
                  onChange={(event) => setAnalyticsDraft((prev) => ({ ...prev, testCode: event.target.value }))}
                  placeholder="Cth: TEST12345"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-700">Events Saat Landing Page Terbuka</label>
                <div className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
                  {META_PIXEL_EVENT_OPTIONS.map((eventName) => {
                    const checked = analyticsDraft.openEvents.includes(eventName);

                    return (
                      <button
                        key={eventName}
                        type="button"
                        onClick={() => toggleAnalyticsEvent(eventName)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          checked
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                        }`}
                      >
                        <span>{eventName}</span>
                        {checked ? <Check size={14} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAnalyticsDraft}
                className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
