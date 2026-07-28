'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle2, Plus, ExternalLink, Pencil, Trash2, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Settings } from 'lucide-react';
import CustomDomainModal from '@/components/CustomDomainModal';

export default function LandingPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dbData, setDbData] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Base Domain Setting states
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [baseDomain, setBaseDomain] = useState('');
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  
  // Custom Domain Modal
  const [showCustomDomainModal, setShowCustomDomainModal] = useState(false);
  const [selectedLp, setSelectedLp] = useState<any>(null);

  const router = useRouter();

  const fetchData = () => {
    fetch('/api/landing-pages')
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.title,
            shop: `Slug: /lp/${item.slug}`,
            pinned: item.status === 'Published',
            slug: `/lp/${item.slug}`,
            rawSlug: item.slug,
            mode: "HTML Builder",
            tags: [item.status],
            domain: item.domain || null,
            domain_status: item.domain_status || 'inactive',
            status: item.status,
            id: item.id,
            cf_hostname_id: item.cf_hostname_id,
            cf_ownership_name: item.cf_ownership_name,
            cf_ownership_value: item.cf_ownership_value,
            cf_ssl_name: item.cf_ssl_name,
            cf_ssl_value: item.cf_ssl_value
          }));
          setDbData(formatted);
        }
      })
      .catch(err => console.error("Error fetching LP data", err));
  };

  const handleDelete = async (rawSlug: string, name: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Hapus Landing Page?',
      text: `"${name}" akan dihapus permanen dari database.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      await fetch(`/api/landing-pages/${rawSlug}`, { method: 'DELETE' });
      Swal.fire('Dihapus!', 'Landing page berhasil dihapus.', 'success');
      fetchData();
    }
  };
  
  React.useEffect(() => {
    fetch('/api/landing-pages')
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.title,
            shop: `Slug: /lp/${item.slug}`,
            pinned: item.status === 'Published',
            slug: `/lp/${item.slug}`,
            rawSlug: item.slug,
            mode: "HTML Builder",
            tags: [item.status],
            domain: item.domain || null,
            domain_status: item.domain_status || 'inactive',
            status: item.status,
            id: item.id
          }));
          setDbData(formatted);
        }
      })
      .catch(err => console.error("Error fetching LP data", err));
      
    // Fetch base domain
    fetch('/api/settings/base-domain')
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success' && res.data) {
          setBaseDomain(res.data);
        }
      })
      .catch(err => console.error("Error fetching base domain", err));
  }, []);

  const handleSaveDomain = async () => {
    setIsSavingDomain(true);
    try {
      const res = await fetch('/api/settings/base-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: baseDomain })
      });
      const json = await res.json();
      if (json.status === 'success') {
        Swal.fire('Berhasil', 'Base Domain berhasil disimpan', 'success');
        setShowDomainModal(false);
      } else {
        Swal.fire('Error', json.message || 'Gagal menyimpan domain', 'error');
      }
    } catch (err: any) {
      Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSavingDomain(false);
    }
  };

  const data = dbData;

  return (
    <div className="min-h-screen bg-[#f4f7f9]">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">Landing Pages</h1>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="relative flex gap-2">
            <button 
              onClick={() => setShowDomainModal(true)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded flex items-center gap-2 font-medium text-sm transition-colors"
            >
              <Settings size={16} />
              Setting Domain
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium text-sm transition-colors"
              >
                <Plus size={16} />
                Create Landing Page
              </button>
              
              {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg z-10 py-0 flex flex-col">
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-purple-600 hover:bg-gray-50 border-b border-gray-100">
                  Sales Page
                </Link>
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 border-b border-gray-100">
                  Checkout Page
                </Link>
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  HTML Sales Page <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded">New</span>
                </Link>
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  HTML Checkout Page <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded">New</span>
                </Link>
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 border-b border-gray-100">
                  Blank Page
                </Link>
                <Link href="/landing-page/builder" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Import Sesama Scalev
                </Link>
              </div>
            )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari landing page..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-64"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="p-6">
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 w-[30%]">Nama Landing Page</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500">Mode</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500">Tags</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500">Domains</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 w-24"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((row, index) => {
                const fullDomain = baseDomain && row.rawSlug ? `${row.rawSlug}.${baseDomain}` : row.domain;
                const linkHref = fullDomain ? `https://${fullDomain}` : row.slug;
                
                return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-2">

                      <div>
                        <a href={linkHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline inline-block mb-1">
                          {row.name}
                        </a>
                        {row.shop && (
                          <div className="text-xs text-gray-500">{row.shop}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                      {linkHref}
                    </a>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {row.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {row.tags.map((tag: string, tIndex: number) => (
                        <span key={tIndex} className="inline-block px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {fullDomain ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 text-xs font-medium">{fullDomain}</span>
                        {row.domain_status === 'active' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} /> Aktif
                          </span>
                        ) : row.domain_status === 'pending' ? (
                          <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">Pending</span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Inactive</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum diatur</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-4 relative">
                      <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">
                        {row.status}
                      </span>
                      <button 
                        className="text-gray-400 hover:text-gray-600 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === row.id ? null : row.id);
                        }}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      
                      {openMenuId === row.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-100 z-10 py-1">
                          <Link 
                            href={`/landing-page/builder?edit=${row.rawSlug}`}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-purple-600 w-full text-left"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                          <button 
                            onClick={() => {
                              setSelectedLp(row);
                              setShowCustomDomainModal(true);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-purple-600 w-full text-left"
                          >
                            <Globe size={14} /> Domain Pribadi
                          </button>
                          <a 
                            href={row.slug} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-purple-600 w-full text-left"
                          >
                            <ExternalLink size={14} /> Lihat
                          </a>
                          <button 
                            onClick={() => handleDelete(row.rawSlug, row.name)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded shadow-xl w-full max-w-md flex flex-col">
            <div className="px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Setting Base Domain
              </h2>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600 mb-4">
                Masukkan domain utama Anda (misal: <strong>domainanda.com</strong>). 
                Pastikan Anda sudah mengarahkan Wildcard A Record (*) di DNS Management domain Anda ke IP VPS ini.
              </p>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Base Domain <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={baseDomain}
                  onChange={e => setBaseDomain(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                />
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 flex justify-end gap-3">
              <button 
                onClick={() => setShowDomainModal(false)} 
                className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDomain} 
                disabled={isSavingDomain} 
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#0ea5e9] hover:bg-[#0284c7] rounded transition-colors disabled:opacity-50"
              >
                {isSavingDomain ? 'Menyimpan...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Domain Modal */}
      <CustomDomainModal 
        isOpen={showCustomDomainModal} 
        onClose={() => setShowCustomDomainModal(false)} 
        landingPage={selectedLp}
        onSuccess={fetchData}
      />
    </div>
  );
}
