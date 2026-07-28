import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Copy, RefreshCw, Trash2, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  landingPage: any; // LP object from page.tsx
  onSuccess: () => void; // callback to refresh table
}

export default function CustomDomainModal({ isOpen, onClose, landingPage, onSuccess }: CustomDomainModalProps) {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Data from LP
  const cfStatus = landingPage?.domain_status;
  const cfDomain = landingPage?.domain;
  const hostnameId = landingPage?.cf_hostname_id;
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && landingPage) {
      setDomain(cfDomain || '');
    }
  }, [isOpen, landingPage, cfDomain]);

  if (!isOpen || !landingPage) return null;

  const handleRegister = async () => {
    if (!domain) return Swal.fire('Error', 'Domain wajib diisi', 'error');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/custom-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          landingPageId: landingPage.id, 
          customDomain: domain 
        })
      });
      const json = await res.json();
      
      if (res.ok) {
        Swal.fire('Berhasil', 'Domain didaftarkan. Selesaikan verifikasi DNS.', 'success');
        onSuccess();
      } else {
        Swal.fire('Error', json.error || 'Gagal', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Internal error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!hostnameId) return;
    setIsChecking(true);
    try {
      const res = await fetch(`/api/custom-domain?id=${hostnameId}&lpId=${landingPage.id}`);
      const json = await res.json();
      if (res.ok) {
        if (json.data.status === 'active' && json.data.sslStatus === 'active') {
          Swal.fire('Berhasil', 'Domain sudah aktif dan terverifikasi!', 'success');
          onSuccess();
        } else {
          Swal.fire('Status', `Status Hostname: ${json.data.status}, SSL: ${json.data.sslStatus}`, 'info');
        }
      }
    } catch (err) {
      Swal.fire('Error', 'Gagal cek status', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus Custom Domain?',
      text: "Domain ini akan dilepas dari Landing Page ini.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus'
    });
    
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/custom-domain?id=${hostnameId || ''}&lpId=${landingPage.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          Swal.fire('Dihapus', 'Custom domain berhasil dihapus', 'success');
          setDomain('');
          onSuccess();
        }
      } catch (err) {
        Swal.fire('Error', 'Gagal menghapus', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      title: 'Disalin!',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false,
      icon: 'success'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Globe className="text-purple-600" />
            Domain Pribadi
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto">
          {!hostnameId ? (
            // Form Tambah Domain
            <div className="space-y-4">
              <div className="bg-purple-50 text-purple-800 p-4 rounded-md text-sm mb-4">
                Hubungkan domain milik Anda sendiri (misal: <strong>toko-anda.com</strong> atau <strong>promo.toko-anda.com</strong>) ke Landing Page ini.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Domain</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.toLowerCase())}
                    placeholder="misal: etacefit.id"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Menyimpan...' : 'Daftarkan'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Domain Sudah Terdaftar (Pending atau Active)
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{cfDomain}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    Status: 
                    {cfStatus === 'active' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        <AlertCircle size={12} /> Pending Verifikasi
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCheckStatus}
                    disabled={isChecking}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                  >
                    <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} /> Cek Status
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-100"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>

              {cfStatus !== 'active' && (
                <div className="border border-yellow-200 bg-yellow-50/50 rounded-md p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Instruksi Verifikasi DNS</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Tambahkan DNS Record berikut di tempat Anda membeli domain (Hostinger, Niagahoster, dll) agar Cloudflare bisa memverifikasi dan menerbitkan sertifikat SSL.
                  </p>
                  
                  <div className="space-y-4">
                    {/* CNAME Target */}
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 font-medium">Type: CNAME</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Name</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">{cfDomain}</span>
                            <button onClick={() => copyToClipboard(cfDomain)} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Target</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">pos.ptslu.cloud</span>
                            <button onClick={() => copyToClipboard('pos.ptslu.cloud')} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ownership TXT */}
                    {landingPage.cf_ownership_name && (
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 font-medium">Type: TXT</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Name</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">{landingPage.cf_ownership_name}</span>
                            <button onClick={() => copyToClipboard(landingPage.cf_ownership_name)} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Target / Value</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">{landingPage.cf_ownership_value}</span>
                            <button onClick={() => copyToClipboard(landingPage.cf_ownership_value)} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* SSL TXT */}
                    {landingPage.cf_ssl_name && (
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 font-medium">Type: TXT</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Name</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">{landingPage.cf_ssl_name}</span>
                            <button onClick={() => copyToClipboard(landingPage.cf_ssl_name)} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Target / Value</span>
                          <div className="flex justify-between bg-gray-50 px-2 py-1.5 rounded border">
                            <span className="truncate max-w-[200px]">{landingPage.cf_ssl_value}</span>
                            <button onClick={() => copyToClipboard(landingPage.cf_ssl_value)} className="text-gray-400 hover:text-purple-600"><Copy size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
