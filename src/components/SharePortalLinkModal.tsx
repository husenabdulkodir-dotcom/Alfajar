import React, { useState, useMemo } from 'react';
import { Santri } from '../types';
import { exportToCSV, generateVariedAccessPin, isSequentialOrWeakPin } from '../utils/helpers';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  X,
  Users,
  KeyRound,
  Sparkles,
  Share2,
  Lock,
  Printer,
  Download,
  Hash,
  Search,
  Send,
  FileSpreadsheet,
  AlertCircle,
  Phone,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

interface SharePortalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  academicYear: string;
  onBatchUpdateSantri?: (updatedList: Santri[]) => void;
}

export const SharePortalLinkModal: React.FC<SharePortalLinkModalProps> = ({
  isOpen,
  onClose,
  santriList,
  academicYear,
  onBatchUpdateSantri
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'wali-kelas' | 'broadcast' | 'print-slip'>('wali-kelas');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [copiedWaliKelasMsg, setCopiedWaliKelasMsg] = useState(false);
  const [copiedWaliKelasLink, setCopiedWaliKelasLink] = useState(false);
  const [copiedPersonalId, setCopiedPersonalId] = useState<string | null>(null);
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState<string | null>(null);

  // Base Portal URLs
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const portalDedicatedUrl = `${baseUrl}?portal=wali`;
  const portalWaliKelasUrl = `${baseUrl}?portal=walikelas`;

  // Sorted unique classes
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.class))).filter(Boolean).sort();
  }, [santriList]);

  // Filtered santri by selected class & search
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => {
      const matchClass = selectedClassFilter === 'ALL' || s.class === selectedClassFilter;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.nisn && s.nisn.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchClass && matchSearch;
    });
  }, [santriList, selectedClassFilter, searchQuery]);

  // Santri in selected class specifically for WhatsApp message & export
  const santriForClass = useMemo(() => {
    return santriList.filter(s => selectedClassFilter === 'ALL' || s.class === selectedClassFilter);
  }, [santriList, selectedClassFilter]);

  // Metrics
  const totalSantriInScope = santriForClass.length;
  const santriWithNis = santriForClass.filter(s => s.nis && s.nis.trim() !== '').length;
  const santriWithPin = santriForClass.filter(s => s.accessPin && s.accessPin.trim() !== '').length;
  const santriMissingPin = totalSantriInScope - santriWithPin;
  const santriWithWeakPin = santriForClass.filter(s => !s.accessPin || isSequentialOrWeakPin(s.accessPin)).length;

  // Helper to build direct auto-login link
  const buildDirectUrl = (santri: Santri) => {
    const nisParam = santri.nis ? `&nis=${encodeURIComponent(santri.nis.trim())}` : '';
    const pinParam = `&code=${encodeURIComponent(santri.accessPin || '1234')}`;
    return `${baseUrl}?portal=wali${nisParam}${pinParam}`;
  };

  // Generate varied 6-digit PIN for students who have missing or weak/sequential PINs
  const handleAutoGenerateSecurePins = () => {
    if (!onBatchUpdateSantri) return;

    let updatedCount = 0;
    const existingPins = new Set<string>(
      santriList
        .map(s => s.accessPin)
        .filter((pin): pin is string => Boolean(pin) && !isSequentialOrWeakPin(pin))
    );

    const updatedList = santriList.map(s => {
      const isInScope = selectedClassFilter === 'ALL' || s.class === selectedClassFilter;
      if (isInScope && (!s.accessPin || isSequentialOrWeakPin(s.accessPin))) {
        const newPin = generateVariedAccessPin(existingPins);
        existingPins.add(newPin);
        updatedCount++;
        return { ...s, accessPin: newPin };
      }
      return s;
    });

    onBatchUpdateSantri(updatedList);
    setGeneratedSuccessMsg(`Berhasil mengamankan ${updatedCount} Kode Akses (PIN) menjadi 6-digit variatif acak!`);
    setTimeout(() => setGeneratedSuccessMsg(null), 4000);
  };

  // Randomize all PINs in scope with confirmation
  const handleRandomizeAllPinsInScope = () => {
    if (!onBatchUpdateSantri) return;
    const scopeLabel = selectedClassFilter === 'ALL' ? 'SEMUA santri di seluruh kelas' : `seluruh santri di Kelas ${selectedClassFilter}`;
    if (!window.confirm(`Konfirmasi Acak PIN: Apakah Anda yakin ingin membuat Kode Akses (PIN) 6-digit acak baru untuk ${scopeLabel}? Kode lama tidak akan berlaku lagi.`)) {
      return;
    }

    let updatedCount = 0;
    const existingPins = new Set<string>();
    // Reserve pins of students outside current scope
    santriList.forEach(s => {
      const isInScope = selectedClassFilter === 'ALL' || s.class === selectedClassFilter;
      if (!isInScope && s.accessPin) {
        existingPins.add(s.accessPin);
      }
    });

    const updatedList = santriList.map(s => {
      const isInScope = selectedClassFilter === 'ALL' || s.class === selectedClassFilter;
      if (isInScope) {
        const newPin = generateVariedAccessPin(existingPins);
        existingPins.add(newPin);
        updatedCount++;
        return { ...s, accessPin: newPin };
      }
      return s;
    });

    onBatchUpdateSantri(updatedList);
    setGeneratedSuccessMsg(`Berhasil mengacak ${updatedCount} Kode Akses (PIN) menjadi variatif & terlindungi!`);
    setTimeout(() => setGeneratedSuccessMsg(null), 4000);
  };

  // Randomize a single santri's PIN
  const handleRegenerateSinglePin = (santri: Santri) => {
    if (!onBatchUpdateSantri) return;
    const existingPins = new Set(
      santriList
        .filter(s => s.id !== santri.id)
        .map(s => s.accessPin)
        .filter(Boolean) as string[]
    );
    const newPin = generateVariedAccessPin(existingPins);
    const updatedList = santriList.map(s => (s.id === santri.id ? { ...s, accessPin: newPin } : s));
    onBatchUpdateSantri(updatedList);
    setGeneratedSuccessMsg(`Kode Akses untuk ${santri.name} berhasil diacak: ${newPin}`);
    setTimeout(() => setGeneratedSuccessMsg(null), 3000);
  };

  // Dynamic Wali Kelas Portal Link based on selected class filter
  const currentWaliKelasUrl = useMemo(() => {
    if (selectedClassFilter === 'ALL') {
      return portalWaliKelasUrl;
    }
    return `${portalWaliKelasUrl}&kelas=${encodeURIComponent(selectedClassFilter)}`;
  }, [portalWaliKelasUrl, selectedClassFilter]);

  // Format WhatsApp message for Wali Kelas
  const getWaliKelasWhatsAppMessage = () => {
    const classNameText = selectedClassFilter === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClassFilter}`;
    
    let listText = '';
    santriForClass.forEach((s, idx) => {
      const directUrl = buildDirectUrl(s);
      listText += `${idx + 1}. *${s.name}*\n   • NIS: ${s.nis || '(Belum terisi)'}\n   • Kode Akses: *${s.accessPin || '1234'}*\n   • Link Masuk Langsung:\n     ${directUrl}\n\n`;
    });

    return `📢 *REKAP AKSES PORTAL RESMI ORANG TUA / WALI*\n🏫 *Al Fajar Islamic School*\n📋 *Target:* ${classNameText}\n📅 *Tahun Ajaran:* ${academicYear}\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali Kelas ${classNameText},\n\nUntuk mempermudah Bapak/Ibu membagikan template pesan kepada masing-masing orang tua siswa via WhatsApp secara japri, silakan gunakan tautan portal khusus berikut:\n🌐 *Link Portal Khusus Wali Kelas:*\n${currentWaliKelasUrl}\n\n-----------------------------------------\n*DAFTAR KREDENSIAL ANANDA (${classNameText}):*\n${listText}-----------------------------------------\n📌 *Petunjuk Masuk untuk Wali Murid:*\n1. Orang tua dapat langsung klik "Link Masuk Langsung" untuk masuk ke portal ananda tanpa perlu mengetik apapun, ATAU\n2. Buka link portal: ${portalDedicatedUrl}\n   Cukup masukkan *SALAH SATU* saja: NIS Siswa *atau* Kode Akses Wali (PIN) ananda (tidak perlu keduanya).\n3. Layanan bantuan Kesiswaan: WhatsApp 0895-3204-61884.\n\nMohon bantuannya untuk membagikan kepada orang tua masing-masing siswa secara tertutup (japri) demi menjaga kerahasiaan data anak.\n\nTerima kasih atas kerja sama dan dedikasi Bapak/Ibu.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n_Bagian Kesiswaan & Bimbingan Konseling Al Fajar Islamic School_`;
  };

  // Format general broadcast message for Parent Groups (WAG)
  const getGeneralBroadcastMessage = () => {
    return `*PENGUMUMAN AKSES RESMI PORTAL WALI SISWA / SANTRI*\n*Al Fajar Islamic School • Tahun Ajaran ${academicYear}*\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu Orang Tua / Wali Murid,\n\nUntuk meningkatkan transparansi dan kemudahan pemantauan perkembangan putra/putri kita, Al Fajar Islamic School menyediakan *Portal Resmi Khusus Orang Tua / Wali* untuk melihat catatan poin kedisiplinan, apresiasi, dan prestasi ananda secara real-time.\n\n🔗 *Link Resmi Portal Wali:*\n${portalDedicatedUrl}\n\n📌 *Petunjuk Masuk:*\n1. Buka tautan resmi di atas melalui browser HP / Laptop Anda.\n2. Masukkan *SALAH SATU* dari: *Nomor Induk Siswa (NIS)* ATAU *Kode Akses Wali (PIN)* ananda (cukup salah satu saja, tidak perlu mengisi keduanya).\n3. Tautan ini bersifat aman & terisolasi khusus orang tua / wali murid (hanya menampilkan catatan ananda).\n\nJika belum mengetahui NIS atau Kode Akses ananda, silakan hubungi Wali Kelas masing-masing atau layanan Kesiswaan via WhatsApp di *0895-3204-61884*.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n_Bagian Kesiswaan & Bimbingan Konseling Al Fajar Islamic School_`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalDedicatedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWaliKelasLink = () => {
    navigator.clipboard.writeText(currentWaliKelasUrl);
    setCopiedWaliKelasLink(true);
    setTimeout(() => setCopiedWaliKelasLink(false), 2500);
  };

  const handleCopyWaliKelasMsg = () => {
    navigator.clipboard.writeText(getWaliKelasWhatsAppMessage());
    setCopiedWaliKelasMsg(true);
    setTimeout(() => setCopiedWaliKelasMsg(false), 2500);
  };

  const handleShareWhatsAppWaliKelas = () => {
    const text = encodeURIComponent(getWaliKelasWhatsAppMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(getGeneralBroadcastMessage());
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  const handleShareWhatsAppBroadcast = () => {
    const text = encodeURIComponent(getGeneralBroadcastMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyPersonalDirectLink = (santri: Santri) => {
    const directUrl = buildDirectUrl(santri);
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''}).\n\nBerikut tautan untuk memantau catatan poin kedisiplinan & prestasi ananda:\n🔗 *Link Masuk Langsung:* ${directUrl}\n\nAtau buka: ${portalDedicatedUrl}\nCukup masukkan *salah satu*:\n• *NIS Santri:* ${santri.nis || '-'}\n• *ATAU Kode Akses (PIN):* ${santri.accessPin || '1234'}\n\nTerima kasih.\n_Wali Kelas & Kesiswaan_`;
    navigator.clipboard.writeText(text);
    setCopiedPersonalId(santri.id);
    setTimeout(() => setCopiedPersonalId(null), 2500);
  };

  const handleShareWhatsAppPersonal = (santri: Santri) => {
    const directUrl = buildDirectUrl(santri);
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''}).\n\nBerikut tautan untuk memantau catatan poin kedisiplinan & prestasi ananda:\n🔗 *Link Masuk Langsung:* ${directUrl}\n\nAtau buka: ${portalDedicatedUrl}\nCukup masukkan *salah satu*:\n• *NIS Santri:* ${santri.nis || '-'}\n• *ATAU Kode Akses (PIN):* ${santri.accessPin || '1234'}\n\nTerima kasih.\n_Wali Kelas & Kesiswaan_`;
    const phone = santri.parentPhone ? santri.parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    const rows = santriForClass.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis || '',
      NISN: s.nisn || '',
      Nama_Santri: s.name,
      Kelas: s.class,
      Nama_Wali: s.parentName || '',
      No_HP_Wali: s.parentPhone || '',
      Kode_Akses_Wali: s.accessPin || '1234',
      Tautan_Langsung_Portal: buildDirectUrl(s)
    }));

    const classPrefix = selectedClassFilter === 'ALL' ? 'Semua_Kelas' : `Kelas_${selectedClassFilter}`;
    exportToCSV(`Rekap_Kode_Akses_Portal_${classPrefix}_${academicYear.replace('/', '-')}`, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Header (Hidden in Print) */}
        <div className="p-4 sm:p-6 bg-[#111113] border-b border-white/10 flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Share2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Bagikan Kode Akses & Link Portal Wali
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Resmi & Terenkripsi
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Fitur lengkap untuk menyebarkan NIS & Kode Akses ke Wali Kelas atau grup paguyuban orang tua.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation (Hidden in Print) */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-[#111113] border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar print:hidden">
          <button
            onClick={() => setActiveTab('wali-kelas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'wali-kelas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kirim ke Wali Kelas (Rekap Massal)</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Broadcast Grup WhatsApp (WAG)</span>
          </button>

          <button
            onClick={() => setActiveTab('print-slip')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'print-slip'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Slip Akses Wali</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 print:p-0">
          
          {/* TAB 1: REKAP MASSAL UNTUK WALI KELAS */}
          {activeTab === 'wali-kelas' && (
            <div className="space-y-5 animate-fadeIn">

              {/* Dedicated Wali Kelas Link Banner Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#111113] to-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Link Akses Khusus Portal Wali Kelas {selectedClassFilter !== 'ALL' && `(${selectedClassFilter})`}
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Akses Mandiri
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Bagikan link ini kepada Ustadz/Ustadzah Wali Kelas agar mereka dapat masuk ke portal sendiri dan mengirim template pesan japri ke masing-masing orang tua santri.
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-emerald-300/90 break-all select-all">
                    {currentWaliKelasUrl}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleCopyWaliKelasLink}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      copiedWaliKelasLink
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {copiedWaliKelasLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaliKelasLink ? 'Link Tersalin!' : 'Salin Link Wali Kelas'}</span>
                  </button>
                  <a
                    href={currentWaliKelasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
                    title="Buka Portal Wali Kelas di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Filter & Metric Bar */}
              <div className="bg-[#111113] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Class Selector */}
                    <div className="flex items-center gap-1.5 bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-gray-400 font-semibold">Pilih Kelas:</span>
                      <select
                        value={selectedClassFilter}
                        onChange={e => setSelectedClassFilter(e.target.value)}
                        className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-[#161618]">Semua Kelas ({santriList.length} Santri)</option>
                        {uniqueClasses.map(cls => (
                          <option key={cls} value={cls} className="bg-[#161618]">
                            Kelas {cls} ({santriList.filter(s => s.class === cls).length} Santri)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Field */}
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cari nama atau NIS..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0A0A0B] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Actions: Export Excel & Auto-Generate PINs */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {onBatchUpdateSantri && santriWithWeakPin > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoGenerateSecurePins}
                        className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title="Perbarui kode akses yang lemah/berurutan atau kosong menjadi PIN 6-digit acak"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Amankan PIN Variatif ({santriWithWeakPin})</span>
                      </button>
                    )}

                    {onBatchUpdateSantri && (
                      <button
                        type="button"
                        onClick={handleRandomizeAllPinsInScope}
                        className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Acak ulang seluruh kode akses santri di kelas terpilih menjadi 6-digit variatif"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Acak Semua PIN</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Unduh seluruh data kode akses dalam format Excel / CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ekspor Excel / CSV</span>
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3 text-xs flex-wrap pt-1 border-t border-white/5">
                  <span className="text-gray-300">
                    Total Santri: <strong className="text-white">{totalSantriInScope}</strong>
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="text-cyan-400">
                    Memiliki NIS: <strong>{santriWithNis}</strong>
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PIN Variatif Aman: <strong>{totalSantriInScope - santriWithWeakPin}</strong>
                  </span>
                  {santriWithWeakPin > 0 && (
                    <>
                      <span className="text-gray-500">&bull;</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        PIN Lemah/Perlu Diacak: <strong>{santriWithWeakPin}</strong>
                      </span>
                    </>
                  )}
                </div>

                {generatedSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn border border-emerald-500/30">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{generatedSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Ready-to-Send WhatsApp Text Box for Wali Kelas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                      Teks WhatsApp Siap Kirim ke Wali Kelas ({selectedClassFilter === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClassFilter}`})
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-400">Format rapi berurutan</span>
                </div>

                <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-4 text-xs font-mono text-gray-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto no-scrollbar select-all">
                  {getWaliKelasWhatsAppMessage()}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyWaliKelasMsg}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                      copiedWaliKelasMsg
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
                    }`}
                  >
                    {copiedWaliKelasMsg ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaliKelasMsg ? 'Pesan Tersalin!' : 'Salin Pesan WhatsApp Wali Kelas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsAppWaliKelas}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim ke WhatsApp Wali Kelas</span>
                  </button>
                </div>
              </div>

              {/* Table of Students & Credentials */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-400" />
                    Daftar Kredensial Santri & Tautan Langsung ({filteredSantri.length} Santri)
                  </h4>
                  <span className="text-[11px] text-gray-400">Dapat dikirim japri/personal</span>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0B]">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-[#111113] text-gray-400 uppercase font-bold sticky top-0 border-b border-white/10">
                        <tr>
                          <th className="p-3 w-12 text-center">No</th>
                          <th className="p-3">NIS</th>
                          <th className="p-3">Nama Santri</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3">Kode Akses</th>
                          <th className="p-3 text-right">Aksi Cepat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSantri.map((santri, idx) => (
                          <tr key={santri.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              {santri.nis ? (
                                <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                  {santri.nis}
                                </span>
                              ) : (
                                <span className="text-amber-400 italic text-[11px]">Belum diisi</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {santri.name}
                              {santri.parentName && (
                                <span className="block text-[11px] text-gray-400 font-normal">
                                  Wali: {santri.parentName}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-300">{santri.class}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                {isSequentialOrWeakPin(santri.accessPin) ? (
                                  <span
                                    className="font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1"
                                    title="PIN ini mudah ditebak atau berurutan. Klik tombol acak di samping untuk membuat PIN aman."
                                  >
                                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                                    {santri.accessPin || '1234'}
                                  </span>
                                ) : (
                                  <span
                                    className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"
                                    title="PIN aman dan terverifikasi acak 6-digit non-berurutan"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    {santri.accessPin}
                                  </span>
                                )}
                                {onBatchUpdateSantri && (
                                  <button
                                    type="button"
                                    onClick={() => handleRegenerateSinglePin(santri)}
                                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Acak PIN santri ini menjadi 6-digit acak baru"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleCopyPersonalDirectLink(santri)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Salin link langsung beserta NIS & Kode Akses untuk santri ini"
                              >
                                {copiedPersonalId === santri.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-400" />
                                )}
                                <span>{copiedPersonalId === santri.id ? 'Tersalin' : 'Salin Link'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareWhatsAppPersonal(santri)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Kirim link langsung via WhatsApp ke nomor orang tua"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>WA Ortu</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BROADCAST GRUP WALI SANTRI (WAG) */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Security Guarantee Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200/90 leading-relaxed space-y-1">
                  <strong className="text-emerald-300 font-bold block">
                    Mode Khusus Terisolasi untuk Orang Tua:
                  </strong>
                  <p>
                    Saat orang tua membuka tautan portal wali ini, seluruh antarmuka <strong>Kesiswaan</strong> (Rekapitulasi, Input Poin, dan AI Konselor) <strong>otomatis disembunyikan</strong>. Orang tua dapat langsung melihat rapor ananda cukup dengan memasukkan salah satu kredensial: NIS Santri atau Kode Akses (PIN).
                  </p>
                </div>
              </div>

              {/* Main Dedicated URL Copy Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Alamat Tautan Utama Portal Wali Santri
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-[#0A0A0B] border border-blue-500/30 rounded-2xl px-4 py-3 text-xs text-blue-300 font-mono break-all select-all flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{portalDedicatedUrl}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                      }`}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={portalDedicatedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl border border-white/10 transition-colors flex items-center justify-center"
                      title="Buka pratinjau di tab baru"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Broadcast Message Section */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Format Pesan Broadcast Grup WhatsApp (WAG)
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Siap Dibagikan ke WAG</span>
                </div>

                <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-4 text-xs text-gray-300 font-sans whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto no-scrollbar select-all">
                  {getGeneralBroadcastMessage()}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyBroadcast}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                      copiedBroadcast
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
                    }`}
                  >
                    {copiedBroadcast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBroadcast ? 'Pesan Tersalin!' : 'Salin Teks Broadcast'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsAppBroadcast}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan ke WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CETAK SLIP KARTU AKSES WALI */}
          {activeTab === 'print-slip' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Filter & Print Controls (Hidden in Print) */}
              <div className="bg-[#111113] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Lembar Slip Cetak Kartu Akses Wali ({selectedClassFilter === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClassFilter}`})
                    </h4>
                    <p className="text-xs text-gray-400">
                      Slip kartu siap dipotong atau dibagikan saat pembagian rapor / pertemuan wali murid.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <select
                    value={selectedClassFilter}
                    onChange={e => setSelectedClassFilter(e.target.value)}
                    className="bg-[#0A0A0B] text-xs text-white font-bold px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Print)</span>
                  </button>
                </div>
              </div>

              {/* Printable Grid of Access Slips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {filteredSantri.map(santri => (
                  <div
                    key={santri.id}
                    className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/15 text-white space-y-3 print:bg-white print:text-black print:border-2 print:border-black print:rounded-xl"
                  >
                    <div className="border-b border-white/10 print:border-black pb-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 print:text-gray-800">
                          Kartu Kredensial Wali Santri
                        </span>
                        <h5 className="font-extrabold text-sm sm:text-base leading-tight">
                          {santri.name}
                        </h5>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 print:bg-gray-200 text-[10px] font-bold text-blue-300 print:text-black">
                        Kelas {santri.class}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/5 print:bg-gray-100 border border-white/5 print:border-gray-300">
                        <span className="text-[10px] text-gray-400 print:text-gray-600 block">NIS Santri:</span>
                        <strong className="font-mono text-cyan-300 print:text-black font-bold">
                          {santri.nis || '-'}
                        </strong>
                      </div>

                      <div className="p-2 rounded-lg bg-white/5 print:bg-gray-100 border border-white/5 print:border-gray-300">
                        <span className="text-[10px] text-gray-400 print:text-gray-600 block">Kode Akses (PIN):</span>
                        <strong className="font-mono text-blue-400 print:text-black font-bold text-sm">
                          {santri.accessPin || '1234'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 print:text-gray-700 leading-tight space-y-1">
                      <p>
                        🌐 Tautan Portal: <span className="font-mono font-bold text-gray-200 print:text-black">{portalDedicatedUrl}</span>
                      </p>
                      <p className="italic">
                        Cukup masukkan salah satu (NIS Santri atau Kode Akses) untuk melihat catatan poin kedisiplinan & apresiasi ananda.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Hidden in Print) */}
        <div className="p-4 bg-[#111113] border-t border-white/10 flex items-center justify-between shrink-0 print:hidden">
          <p className="text-xs text-gray-400">
            Akses aman & fleksibel: Orang tua dapat masuk menggunakan NIS atau Kode Akses (PIN).
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

