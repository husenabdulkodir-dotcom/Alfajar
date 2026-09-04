import React, { useState, useMemo, useEffect } from 'react';
import { Santri, PointRecord } from '../types';
import { calculateNetPoints } from '../utils/helpers';
import {
  Send,
  MessageCircle,
  Copy,
  Check,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  KeyRound,
  Hash,
  Sparkles,
  Phone,
  User,
  School,
  Share2,
  RefreshCw,
  Edit3,
  X,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface WaliKelasPortalProps {
  santriList: Santri[];
  records: PointRecord[];
  academicYear: string;
  isStandalone?: boolean;
  initialClass?: string;
  onBackToKesiswaan?: () => void;
  onUpdateSantri?: (updated: Santri) => void;
}

export const WaliKelasPortal: React.FC<WaliKelasPortalProps> = ({
  santriList,
  records,
  academicYear,
  isStandalone = false,
  initialClass,
  onBackToKesiswaan,
  onUpdateSantri
}) => {
  // Available classes
  const uniqueClasses = useMemo(() => {
    const list = Array.from(new Set(santriList.map(s => s.class))).filter(Boolean).sort();
    return list.length > 0 ? list : ['7A', '7B', '8A', '8B', '9A', '9B'];
  }, [santriList]);

  // Selected class
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialClass && uniqueClasses.includes(initialClass)) {
      return initialClass;
    }
    // Check URL search or hash param
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const kelasParam = params.get('kelas') || params.get('class');
      if (kelasParam && uniqueClasses.includes(kelasParam)) {
        return kelasParam;
      }
    }
    return uniqueClasses[0] || '7A';
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'unsent'>('all');
  const [templateType, setTemplateType] = useState<'standard' | 'simple' | 'eval'>('standard');
  const [customNote, setCustomNote] = useState('');
  const [showCustomNote, setShowCustomNote] = useState(false);

  // Copied & toast tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Phone Modal / Inline State
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [editParentNameValue, setEditParentNameValue] = useState('');

  // Preview Modal for Santri
  const [previewSantri, setPreviewSantri] = useState<Santri | null>(null);

  // Sent status tracking in LocalStorage
  const storageKey = `walikelas_sent_tracking_${academicYear}_${selectedClass}`;
  const [sentMap, setSentMap] = useState<Record<string, { sentAt: string; method: string }>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Re-read or persist when selectedClass changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`walikelas_sent_tracking_${academicYear}_${selectedClass}`);
      setSentMap(saved ? JSON.parse(saved) : {});
    } catch {
      setSentMap({});
    }
  }, [academicYear, selectedClass]);

  const saveSentMap = (newMap: Record<string, { sentAt: string; method: string }>) => {
    setSentMap(newMap);
    try {
      localStorage.setItem(`walikelas_sent_tracking_${academicYear}_${selectedClass}`, JSON.stringify(newMap));
    } catch (e) {
      console.warn('Failed to save sent tracking:', e);
    }
  };

  const markAsSent = (santriId: string, method: string = 'WhatsApp') => {
    const updated = {
      ...sentMap,
      [santriId]: {
        sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        method
      }
    };
    saveSentMap(updated);
  };

  const toggleSentStatus = (santriId: string) => {
    if (sentMap[santriId]) {
      const copy = { ...sentMap };
      delete copy[santriId];
      saveSentMap(copy);
      showToast('Status ditandai: Belum Dikirim');
    } else {
      markAsSent(santriId, 'Manual');
      showToast('Status ditandai: Sudah Dikirim');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Base URL & Portal URL
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const portalDedicatedUrl = `${baseUrl}?portal=wali`;

  // Build direct login URL for a santri (auto login via URL query)
  const buildDirectUrl = (santri: Santri) => {
    const nisParam = santri.nis ? `&nis=${encodeURIComponent(santri.nis.trim())}` : '';
    const pinParam = santri.accessPin ? `&code=${encodeURIComponent(santri.accessPin.trim())}` : '&code=1234';
    return `${baseUrl}?portal=wali${nisParam}${pinParam}`;
  };

  // Build the message template for Japri to parent
  const generateJapriMessage = (santri: Santri) => {
    const directUrl = buildDirectUrl(santri);
    const pin = santri.accessPin || '1234';
    const parentGreeting = santri.parentName ? `Bapak/Ibu *${santri.parentName}*` : 'Bapak/Ibu Orang Tua/Wali';
    const cleanNote = customNote.trim() ? `\n\n📌 *Catatan Khusus dari Wali Kelas:*\n_${customNote.trim()}_\n` : '';
    const roleLine = santri.organizationRole ? `\n• *Amanah/Jabatan Santri:* ${santri.organizationRole}` : '';

    if (templateType === 'simple') {
      return `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. ${parentGreeting} dari ananda *${santri.name}* (Kelas ${santri.class}${santri.organizationRole ? ` - ${santri.organizationRole}` : ''}).\n\nBerikut tautan langsung untuk memantau catatan poin kedisiplinan dan apresiasi ananda:\n🔗 *Link Masuk Langsung:*\n${directUrl}\n\nAtau buka: ${portalDedicatedUrl}\nCukup ketik salah satu:\n• NIS: *${santri.nis || '-'}*\n• ATAU Kode PIN: *${pin}*${roleLine}${cleanNote}\nTerima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n_Wali Kelas ${santri.class}_`;
    }

    if (templateType === 'eval') {
      const net = calculateNetPoints(santri.id, records, academicYear);
      const pointsText = net >= 0 ? `+${net} Poin (Predikat Baik)` : `${net} Poin`;
      return `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. ${parentGreeting} dari ananda *${santri.name}* (Kelas ${santri.class}${santri.organizationRole ? ` - ${santri.organizationRole}` : ''}).\n\nBerikut informasi perkembangan perilaku & kedisiplinan ananda di Al Fajar Islamic School (Akumulasi Poin Saat Ini: *${pointsText}*).\n\nUntuk melihat rincian riwayat kebaikan, prestasi, maupun evaluasi kedisiplinan ananda, silakan buka portal resmi:\n🔗 *Link Akses Langsung:*\n${directUrl}\n\nAtau buka: ${portalDedicatedUrl}\n• NIS: *${santri.nis || '-'}*\n• PIN Akses: *${pin}*${roleLine}${cleanNote}\nMohon dukungan dan bimbingan bersama demi pembinaan ananda yang lebih baik.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n_Wali Kelas ${santri.class}_`;
    }

    // Default: Standard Full Friendly
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. ${parentGreeting},\nWali dari Ananda *${santri.name}* (Kelas ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''}${santri.organizationRole ? ` - ${santri.organizationRole}` : ''}).\n\nSalam silaturahmi dari kami pihak Al Fajar Islamic School. Untuk mempermudah Bapak/Ibu memantau perkembangan kedisiplinan, prestasi, dan apresiasi kebaikan ananda secara real-time, kami membagikan akses resmi Portal Khusus Orang Tua / Wali:\n\n🔗 *Link Masuk Otomatis (Tinggal Klik):*\n${directUrl}\n\n🌐 *Atau Buka Tautan Manual:*\n${portalDedicatedUrl}\n*(Bapak/Ibu cukup memasukkan salah satu saja, tidak perlu keduanya):*\n• *NIS Siswa:* ${santri.nis || '(Bisa cek kartu pelajar)'}\n• *ATAU Kode Akses (PIN):* *${pin}*${roleLine}${cleanNote}\n\nData ananda terisolasi aman dan hanya dapat dilihat oleh keluarga. Apabila ada pertanyaan mengenai perkembangan ananda, silakan hubungi kami.\n\nTerima kasih atas kerja sama dan kepercayaannya.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n_Wali Kelas ${santri.class}_`;
  };

  // Filter santri for the current class
  const classSantriList = useMemo(() => {
    return santriList.filter(s => s.class === selectedClass);
  }, [santriList, selectedClass]);

  // Filter by search & sent status
  const displayedSantriList = useMemo(() => {
    return classSantriList.filter(s => {
      const isSent = !!sentMap[s.id];
      if (statusFilter === 'sent' && !isSent) return false;
      if (statusFilter === 'unsent' && isSent) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        (s.parentPhone && s.parentPhone.includes(q)) ||
        (s.organizationRole && s.organizationRole.toLowerCase().includes(q))
      );
    });
  }, [classSantriList, sentMap, statusFilter, searchQuery]);

  // Statistics for this class
  const totalCount = classSantriList.length;
  const sentCount = classSantriList.filter(s => !!sentMap[s.id]).length;
  const unsentCount = totalCount - sentCount;
  const withPhoneCount = classSantriList.filter(s => s.parentPhone && s.parentPhone.trim() !== '').length;
  const percentSent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // Handle Action: Send Japri via WhatsApp
  const handleSendWhatsAppJapri = (santri: Santri) => {
    const text = generateJapriMessage(santri);
    const encoded = encodeURIComponent(text);
    const cleanPhone = santri.parentPhone
      ? santri.parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')
      : '';

    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');

    // Auto mark as sent
    markAsSent(santri.id, 'WhatsApp');
    showToast(`Membuka WhatsApp untuk wali ${santri.name}. Status otomatis ditandai 'Sudah Dikirim'!`);
  };

  // Handle Action: Copy Japri Text
  const handleCopyJapriText = (santri: Santri) => {
    const text = generateJapriMessage(santri);
    navigator.clipboard.writeText(text);
    setCopiedId(santri.id);
    setTimeout(() => setCopiedId(null), 2500);

    // Prompt or auto mark
    markAsSent(santri.id, 'Disalin');
    showToast(`Pesan japri untuk ananda ${santri.name} berhasil disalin!`);
  };

  // Quick edit phone handler
  const handleOpenEditPhone = (santri: Santri) => {
    setEditingSantri(santri);
    setEditPhoneValue(santri.parentPhone || '');
    setEditParentNameValue(santri.parentName || '');
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantri || !onUpdateSantri) return;

    const updated: Santri = {
      ...editingSantri,
      parentPhone: editPhoneValue.trim(),
      parentName: editParentNameValue.trim() || editingSantri.parentName
    };
    onUpdateSantri(updated);
    setEditingSantri(null);
    showToast(`Data kontak orang tua untuk ${updated.name} berhasil diperbarui!`);
  };

  // Reset sent tracking for class
  const handleResetClassTracking = () => {
    if (confirm(`Apakah Anda yakin ingin mengatur ulang tanda status pengiriman untuk Kelas ${selectedClass}?`)) {
      saveSentMap({});
      showToast('Status pengiriman kelas telah direset.');
    }
  };

  // Mark all as sent
  const handleMarkAllSent = () => {
    const newMap: Record<string, { sentAt: string; method: string }> = {};
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    classSantriList.forEach(s => {
      newMap[s.id] = { sentAt: now, method: 'Batch' };
    });
    saveSentMap(newMap);
    showToast(`Semua santri Kelas ${selectedClass} (${classSantriList.length} santri) ditandai Sudah Terkirim!`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Floating Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Portal Khusus Wali Kelas
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                T.A. {academicYear}
              </span>
              {isStandalone && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                  Mode Mandiri (Akses Terisolasi)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>Distribusi Akses Wali Santri</span>
              <span className="text-emerald-700 font-extrabold text-xl sm:text-2xl bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                {selectedClass}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              Kirimkan kredensial (NIS / PIN / Link Langsung) kepada masing-masing orang tua santri secara pribadi (japri) via WhatsApp dengan sekali klik.
            </p>
          </div>

          {/* Right Action: Class Selector & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-600 font-bold px-2 flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-600" />
                Pilih Kelas:
              </span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-white text-slate-800 text-xs sm:text-sm font-bold py-1.5 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                {uniqueClasses.map(c => (
                  <option key={c} value={c} className="bg-white text-slate-800">
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            {onBackToKesiswaan && !isStandalone && (
              <button
                type="button"
                onClick={onBackToKesiswaan}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                Kembali ke Kesiswaan
              </button>
            )}
          </div>
        </div>

        {/* Progress & Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Santri</p>
              <p className="text-lg sm:text-xl font-black text-slate-900">{totalCount} Santri</p>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-800 uppercase tracking-wider font-semibold">Sudah Dikirim</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700">
                {sentCount} <span className="text-xs text-slate-600 font-normal">({percentSent}%)</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm shrink-0 border border-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-amber-800 uppercase tracking-wider font-semibold">Belum Terkirim</p>
              <p className="text-lg sm:text-xl font-black text-amber-700">{unsentCount} Santri</p>
            </div>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0 border border-purple-300">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-purple-800 uppercase tracking-wider font-semibold">Nomor WA Tersedia</p>
              <p className="text-lg sm:text-xl font-black text-slate-900">
                {withPhoneCount} / {totalCount}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Visual Bar */}
        <div className="mt-4 pt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">Progres Distribusi Pesan Japri:</span>
            <span className="font-bold text-emerald-700">{percentSent}% Selesai</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${percentSent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Template & Options Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Format Template Pesan WhatsApp Japri</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih gaya bahasa yang ingin digunakan saat mengirimkan pesan ke orang tua santri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomNote(!showCustomNote)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showCustomNote || customNote.trim()
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showCustomNote ? 'Tutup Catatan Tambahan' : 'Tambah Catatan Khusus'}</span>
            </button>
          </div>
        </div>

        {/* Template Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setTemplateType('standard')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'standard'
                ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-emerald-700">1. Lengkap & Santun (Rekomendasi)</span>
              {templateType === 'standard' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Salam resmi, nama ananda, link langsung, petunjuk login salah satu (NIS atau PIN), dan penutup wali kelas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('simple')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'simple'
                ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-emerald-700">2. Praktis & Ringkas</span>
              {templateType === 'simple' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Salam singkat, nama ananda, tautan langsung tinggal klik, dan nomor NIS/PIN darurat.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('eval')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'eval'
                ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-emerald-700">3. Rapor & Evaluasi Poin</span>
              {templateType === 'eval' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Menampilkan skor akumulasi poin saat ini, ajakan bimbingan bersama, dan link rapor.
            </p>
          </button>
        </div>

        {/* Optional Custom Note Input */}
        {showCustomNote && (
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2 animate-fadeIn">
            <label className="block text-xs font-bold text-blue-900">
              Sisipkan Pesan / Pengumuman Tambahan dari Wali Kelas:
            </label>
            <input
              type="text"
              placeholder="Contoh: Mengingatkan bahwa besok Ahad ada pertemuan silaturahmi wali santri jam 09.00 WIB."
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Teks ini akan otomatis terselip di dalam pesan WhatsApp japri untuk seluruh santri.
            </p>
          </div>
        )}
      </div>

      {/* Filter, Search & Batch Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, atau nama orang tua..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Status Filter Tabs & Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unsent')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'unsent' ? 'bg-white text-amber-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum ({unsentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'sent' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terkirim ({sentCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleMarkAllSent}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Tandai semua santri di kelas ini sudah dikirimi pesan"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tandai Semua Selesai</span>
          </button>

          {sentCount > 0 && (
            <button
              type="button"
              onClick={handleResetClassTracking}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Reset status pengiriman"
            >
              Reset Status
            </button>
          )}
        </div>
      </div>

      {/* Santri List Cards */}
      {displayedSantriList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Tidak ada data santri yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ubah filter status pengiriman di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedSantriList.map((santri, index) => {
            const isSent = !!sentMap[santri.id];
            const sentInfo = sentMap[santri.id];
            const hasPhone = Boolean(santri.parentPhone && santri.parentPhone.trim() !== '');
            const netPoints = calculateNetPoints(santri.id, records, academicYear);

            return (
              <div
                key={santri.id}
                className={`rounded-3xl p-5 border transition-all duration-200 relative flex flex-col justify-between shadow-xs ${
                  isSent
                    ? 'bg-white border-emerald-300 hover:border-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header item: Santri Identity & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar / Index Number */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                          isSent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                            {santri.name}
                          </h3>
                          {santri.organizationRole && (
                            <RoleBadge role={santri.organizationRole} size="sm" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="font-mono text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">
                            NIS: {santri.nis || '-'}
                          </span>
                          <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            PIN: {santri.accessPin || '1234'}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              netPoints >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            {netPoints >= 0 ? `+${netPoints}` : netPoints} Poin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sent Status Toggle Pill */}
                    <button
                      type="button"
                      onClick={() => toggleSentStatus(santri.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                        isSent
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Klik untuk mengubah status manual"
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terkirim {sentInfo?.sentAt ? `(${sentInfo.sentAt})` : ''}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Belum Dikirim</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Parent Contact Details */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Wali: <strong className="text-slate-900">{santri.parentName || 'Orang Tua Santri'}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditPhone(santri)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        {hasPhone ? 'Edit No. HP' : '+ Masukkan No. HP'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono text-slate-700 font-semibold">
                          {hasPhone ? santri.parentPhone : '(Nomor WA belum dicatat)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Masuk: NIS atau PIN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* WhatsApp Japri Button */}
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppJapri(santri)}
                    className="flex-1 min-w-[150px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Buka WhatsApp dengan pesan template siap kirim ke wali"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Japri (WA)</span>
                  </button>

                  {/* Copy Japri Text */}
                  <button
                    type="button"
                    onClick={() => handleCopyJapriText(santri)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Salin template teks pesan japri ke clipboard"
                  >
                    {copiedId === santri.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>

                  {/* Preview Portal for Santri */}
                  <button
                    type="button"
                    onClick={() => setPreviewSantri(santri)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    title="Pratinjau tampilan portal wali santri untuk ananda ini"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Edit Parent Phone / Contact */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Edit Kontak Orang Tua
                  </h3>
                  <p className="text-xs text-slate-500">{editingSantri.name} (Kelas {editingSantri.class})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSantri(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Orang Tua / Wali:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. H. Ahmad Dahlan"
                  value={editParentNameValue}
                  onChange={e => setEditParentNameValue(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Orang Tua:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={editPhoneValue}
                  onChange={e => setEditPhoneValue(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white text-slate-900 font-mono rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bisa dimulai dengan 08... atau 628... Sistem akan otomatis memformat saat membuka WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSantri(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Tampilan Portal Orang Tua */}
      {previewSantri && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Pratinjau Akses Santri
                  </h3>
                  <p className="text-xs text-slate-500">{previewSantri.name} (Kelas {previewSantri.class})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSantri(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Nomor Induk Santri (NIS):</span>
                  <span className="font-mono font-bold text-cyan-700">{previewSantri.nis || '(Belum terisi)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Kode Akses Wali (PIN):</span>
                  <span className="font-mono font-bold text-amber-700">{previewSantri.accessPin || '1234'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Metode Masuk Wali:</span>
                  <span className="text-emerald-700 font-bold">Cukup Salah Satu (NIS atau PIN)</span>
                </div>
              </div>

              {/* Message preview box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Pesan Template yang Dikirim ke Orang Tua:
                </label>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {generateJapriMessage(previewSantri)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <a
                href={buildDirectUrl(previewSantri)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Portal Langsung di Tab Baru</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppJapri(previewSantri);
                  setPreviewSantri(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim via WA Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
