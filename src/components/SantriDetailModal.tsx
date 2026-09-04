import React, { useState, useMemo } from 'react';
import { Santri, PointRecord, BKCounselingNote, EkskulRecord } from '../types';
import {
  calculatePositivePoints,
  calculateNegativePoints,
  calculateNetPoints,
  getHeavyViolations,
  determineSantriStatus,
  getStatusBadgeStyle,
  formatDateIndonesian,
  exportToCSV
} from '../utils/helpers';
import { isSantriEkskulMatch } from '../utils/ekskulMatcher';
import { EkskulPaymentBreakdown } from './EkskulPaymentBreakdown';
import {
  X,
  ShieldAlert,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  Download,
  Bot,
  Plus,
  Trash2,
  Copy,
  Check,
  Phone,
  Share2,
  KeyRound,
  HeartHandshake,
  Lock,
  Edit2,
  Clock,
  FileText,
  Crown,
  BookOpen,
  Activity,
  Medal,
  WalletCards,
  History
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface SantriDetailModalProps {
  santri: Santri | null;
  onClose: () => void;
  records: PointRecord[];
  bkNotes?: BKCounselingNote[];
  ekskulRecords?: EkskulRecord[];
  academicYear: string;
  onOpenQuickInputForSantri: (santriId: string) => void;
  onOpenAiCounselor: (santri: Santri) => void;
  onOpenBKModalForSantri?: (santriId: string) => void;
  onEditBKNote?: (note: BKCounselingNote) => void;
  onDeleteBKNote?: (noteId: string) => void;
  onDeleteRecord?: (recordId: string) => void;
  onOpenAuditModal?: (santriId?: string) => void;
}

export const SantriDetailModal: React.FC<SantriDetailModalProps> = ({
  santri,
  onClose,
  records,
  bkNotes = [],
  ekskulRecords = [],
  academicYear,
  onOpenQuickInputForSantri,
  onOpenAiCounselor,
  onOpenBKModalForSantri,
  onEditBKNote,
  onDeleteBKNote,
  onDeleteRecord,
  onOpenAuditModal
}) => {
  if (!santri) return null;

  const [activeSubTab, setActiveSubTab] = useState<'points' | 'bk' | 'ekskul'>('points');
  const [filterType, setFilterType] = useState<'ALL' | 'Pelanggaran' | 'Kebaikan' | 'Berat'>('ALL');
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<PointRecord | null>(null);

  const getPortalUrlForSantri = () => {
    const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const pin = santri.accessPin || '1234';
    const nisParam = santri.nis ? `&nis=${encodeURIComponent(santri.nis.trim())}` : '';
    return `${base}?portal=wali${nisParam}&code=${encodeURIComponent(pin)}`;
  };

  const handleCopyAccessCredentials = () => {
    const portalUrl = getPortalUrlForSantri();
    const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const roleText = santri.organizationRole ? `\n• *Amanah/Jabatan Santri:* ${santri.organizationRole}` : '';
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas: ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''})${roleText}.\n\nBerikut adalah data akses resmi untuk memantau poin kedisiplinan & apresiasi Ananda melalui Portal Khusus Wali Santri:\n🔗 *Link Masuk Langsung (Otomatis Masuk):*\n${portalUrl}\n\nAtau buka: ${base}?portal=wali\n(Cukup masukkan salah satu):\n• *NIS Santri:* ${santri.nis || '(Belum terisi)'}\n• *ATAU Kode Akses (PIN):* *${santri.accessPin || '1234'}*\n\nSilakan klik tautan langsung di atas untuk masuk ke portal pemantauan ananda secara aman.\n\nTerima kasih.\n_Bagian Kesiswaan & Pengasuhan Santri_`;
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const portalUrl = getPortalUrlForSantri();
    const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const roleText = santri.organizationRole ? `\n• *Amanah/Jabatan Santri:* ${santri.organizationRole}` : '';
    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas: ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''})${roleText}.\n\nBerikut adalah data akses resmi untuk memantau poin kedisiplinan & apresiasi Ananda melalui Portal Khusus Wali Santri:\n🔗 *Link Masuk Langsung (Otomatis Masuk):*\n${portalUrl}\n\nAtau buka: ${base}?portal=wali\n(Cukup masukkan salah satu):\n• *NIS Santri:* ${santri.nis || '(Belum terisi)'}\n• *ATAU Kode Akses (PIN):* *${santri.accessPin || '1234'}*\n\nSilakan klik tautan langsung di atas untuk memantau perkembangan dan prestasi ananda secara aman.\n\nTerima kasih.\n_Bagian Kesiswaan & Pengasuhan Santri_`;
    const text = encodeURIComponent(message);
    const phone = santri.parentPhone ? santri.parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Calculations (Memoized for high performance)
  const { totalPlus, totalMinus, netPoints, heavyViolationsAllTime, status } = useMemo(() => {
    let plus = 0;
    let minus = 0;
    const heavy: PointRecord[] = [];

    for (const r of records) {
      if (r.santriId === santri.id) {
        if (r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation)) {
          heavy.push(r);
        }
        if (r.academicYear === academicYear) {
          if (r.type === 'Kebaikan') {
            plus += Math.abs(r.points);
          } else {
            minus += Math.abs(r.points);
          }
        }
      }
    }

    const net = plus - minus;
    const st = determineSantriStatus(net, heavy.length, santri.manualStatus);
    return {
      totalPlus: plus,
      totalMinus: minus,
      netPoints: net,
      heavyViolationsAllTime: heavy,
      status: st
    };
  }, [santri.id, santri.manualStatus, records, academicYear]);

  const badgeStyle = getStatusBadgeStyle(status);

  // Student specific records (Memoized)
  const santriRecords = useMemo(() => {
    return records
      .filter(r => r.santriId === santri.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, santri.id]);

  const santriBKNotes = useMemo(() => {
    return bkNotes
      .filter(n => n.santriId === santri.id)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [bkNotes, santri.id]);

  const santriEkskulList = useMemo(() => {
    return ekskulRecords.filter(e => isSantriEkskulMatch(e, santri));
  }, [ekskulRecords, santri]);

  // Filtered records for timeline (Memoized)
  const filteredTimeline = useMemo(() => {
    return santriRecords.filter(r => {
      if (filterType === 'ALL') return true;
      if (filterType === 'Pelanggaran') return r.type === 'Pelanggaran';
      if (filterType === 'Kebaikan') return r.type === 'Kebaikan';
      if (filterType === 'Berat') return r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation);
      return true;
    });
  }, [santriRecords, filterType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = santriRecords.map(r => ({
      NIS: r.santriNis,
      Nama: r.santriName,
      Amanah_Jabatan: santri.organizationRole || '-',
      Tanggal: r.date,
      Jenis: r.type,
      Kategori: r.category,
      Tindakan_Prestasi: r.title,
      Poin: r.points,
      Hukuman_Apresiasi: r.punishmentOrReward,
      Pencatat: r.recordedBy,
      Tahun_Ajaran: r.academicYear,
      Konfirmasi_Ortu: r.parentConfirmed ? 'Sudah Konfirmasi' : 'Belum'
    }));
    exportToCSV(`Rapor_Poin_${santri.nis}_${santri.name.replace(/\s+/g, '_')}`, rows);
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header Modal Bar */}
        <div className="p-4 bg-[#111113] text-white flex items-center justify-between border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm sm:text-base text-white">
              Rapor Karakter & Buku Catatan Disiplin Santri
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAiCounselor(santri)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5 border border-blue-400/30 cursor-pointer"
              title="Dapatkan rekomendasi pembinaan konseling berbasis AI"
            >
              <Bot className="w-4 h-4" />
              AI Konseling
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-[#0A0A0B] border border-white/10 hover:border-white/20 text-gray-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-[#0A0A0B] border border-white/10 hover:border-white/20 text-gray-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Scorecard Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm print:overflow-visible flex-1">
          {/* Printable Header Title */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              Al Fajar Islamic School - Bagian Kesiswaan & Bimbingan Konseling
            </h1>
            <h2 className="text-base font-semibold text-blue-700">
              RAPOR DISIPLIN & REKAM JEJAK KARAKTER SISWA / SANTRI
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tahun Ajaran {academicYear}</p>
            {santri.organizationRole && (
              <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold text-xs">
                Amanah Kepemimpinan: {santri.organizationRole}
              </div>
            )}
          </div>

          {/* Student Profile Card */}
          <div className="bg-[#111113] p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border border-blue-400/30 shrink-0">
                {santri.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    {santri.name}
                  </h3>
                  {santri.organizationRole && (
                    <RoleBadge role={santri.organizationRole} size="md" />
                  )}
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {santri.nisn ? <>NISN: <span className="font-mono text-blue-300 font-bold">{santri.nisn}</span> &bull; </> : ''}
                  {santri.nis ? <>NIS: <span className="font-mono text-gray-200">{santri.nis}</span> &bull; </> : ''}Kelas {santri.class}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">
                    Wali: <strong className="text-gray-200">{santri.parentName}</strong> {santri.parentPhone ? `(${santri.parentPhone})` : ''}
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <div className="flex items-center gap-1.5 bg-[#0A0A0B] border border-blue-500/30 px-2 py-0.5 rounded-lg text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-gray-400">PIN Wali:</span>
                    <span className="font-mono font-bold text-blue-400">{santri.accessPin || '1234'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccessCredentials}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                    title="Salin data login untuk orang tua"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                    <span>{copiedPin ? 'Tersalin!' : 'Salin Akses'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Kirim kredensial akses via WhatsApp ke nomor orang tua"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Kirim WA</span>
                  </button>
                  {onOpenAuditModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAuditModal(santri.id)}
                      className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 border border-indigo-500/30 transition-colors cursor-pointer"
                      title="Lihat riwayat audit perubahan data khusus santri ini"
                    >
                      <History className="w-3 h-3 text-indigo-400" />
                      <span>Audit Perubahan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="text-left md:text-right">
              <p className="text-[11px] text-gray-400">Status Kedisiplinan Saat Ini:</p>
              <div className="mt-1">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                  {status}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">TA {academicYear}</p>
            </div>
          </div>

          {/* Score Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-[11px] font-semibold text-emerald-300">Poin Plus (Prestasi)</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">+{totalPlus}</p>
              <p className="text-[10px] text-emerald-400/70">TA {academicYear}</p>
            </div>

            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <p className="text-[11px] font-semibold text-rose-300">Pelanggaran Biasa</p>
              <p className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">-{totalMinus}</p>
              <p className="text-[10px] text-rose-400/70">Direset Tiap Tahun Ajaran</p>
            </div>

            <div className="p-3 bg-[#111113] rounded-xl border border-white/5">
              <p className="text-[11px] font-semibold text-gray-300">Total Net Poin TA Ini</p>
              <p className={`text-lg sm:text-xl font-black mt-0.5 ${netPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPoints > 0 ? `+${netPoints}` : netPoints}
              </p>
              <p className="text-[10px] text-gray-400">Awal Tahun Start 0 Poin</p>
            </div>

            <div className={`p-3 rounded-xl border ${heavyViolationsAllTime.length > 0 ? 'bg-rose-500/20 border-rose-500/40' : 'bg-[#111113] border border-white/5'}`}>
              <p className="text-[11px] font-semibold text-rose-300">Pelanggaran Berat All-Time</p>
              <p className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">{heavyViolationsAllTime.length} Kasus</p>
              <p className="text-[10px] text-rose-300 font-bold">PERMANEN (TIDAK RESET)</p>
            </div>
          </div>

          {/* HEAVY VIOLATION SPECIAL SECTION (IF ANY) */}
          {heavyViolationsAllTime.length > 0 && (
            <div className="p-4 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Catatan Khusus: Rekam Jejak Pelanggaran Berat (Tidak Direset Pertahun)
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">
                Sesuai aturan Kesiswaan, poin pelanggaran berat berikut disimpan secara permanen di riwayat santri/siswa sepanjang masa studi di Al Fajar Islamic School:
              </p>

              <div className="space-y-2 pt-1">
                {heavyViolationsAllTime.map(hv => (
                  <div key={hv.id} className="p-3 bg-[#0A0A0B] border border-rose-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-rose-300">{hv.title}</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">
                        Tindakan/Sanksi: {hv.punishmentOrReward}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Tanggal: {formatDateIndonesian(hv.date)} &bull; Oleh: {hv.recordedBy} &bull; TA {hv.academicYear}
                      </p>
                    </div>
                    <span className="font-black px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs self-start sm:self-auto shrink-0">
                      {hv.points} Poin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TABS (POINTS HISTORY VS BK COUNSELING NOTES) */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 print:hidden">
            <button
              onClick={() => setActiveSubTab('points')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'points'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Riwayat Poin Disiplin & Prestasi ({santriRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('bk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'bk'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow'
                  : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/5'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
              <span>Catatan Bimbingan Konseling BK ({santriBKNotes.length})</span>
              <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-200 text-[10px] rounded-full">Khusus BK</span>
            </button>

            <button
              onClick={() => setActiveSubTab('ekskul')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'ekskul'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                  : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-500/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekskul & Iuran ({santriEkskulList.length})</span>
            </button>
          </div>

          {/* TAB CONTENT: POINTS HISTORY */}
          {activeSubTab === 'points' && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Riwayat Catatan Poin ({filteredTimeline.length})
                </h4>

                <div className="flex bg-[#0A0A0B] border border-white/10 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'ALL' ? 'bg-[#161618] border border-white/10 shadow text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Semua ({santriRecords.length})
                  </button>
                  <button
                    onClick={() => setFilterType('Pelanggaran')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'Pelanggaran' ? 'bg-[#161618] border border-white/10 shadow text-rose-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    Pelanggaran
                  </button>
                  <button
                    onClick={() => setFilterType('Kebaikan')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'Kebaikan' ? 'bg-[#161618] border border-white/10 shadow text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    Kebaikan
                  </button>
                  <button
                    onClick={() => setFilterType('Berat')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'Berat' ? 'bg-rose-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    Berat
                  </button>
                </div>
              </div>

              {/* Timeline List */}
              {filteredTimeline.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs bg-[#111113] rounded-2xl border border-dashed border-white/10">
                  Belum ada catatan poin untuk kategori ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredTimeline.map(record => {
                    const isPlus = record.type === 'Kebaikan';
                    const isHeavy = record.isHeavyViolation || record.category === 'Berat';

                    return (
                      <div
                        key={record.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isHeavy
                            ? 'border-rose-500/30 bg-rose-500/10'
                            : isPlus
                            ? 'border-emerald-500/20 bg-emerald-500/10'
                            : 'border-white/5 bg-[#111113]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPlus ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : isHeavy ? 'bg-rose-600 text-white' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                [{record.category}] {record.type}
                              </span>
                              <span className="text-gray-400 font-mono text-[11px]">{formatDateIndonesian(record.date)}</span>
                              <span className="text-gray-400 text-[11px]">&bull; TA {record.academicYear} ({record.semester})</span>
                            </div>

                            <h5 className="font-bold text-sm text-white">
                              {record.title}
                            </h5>

                            <p className="text-xs text-gray-300">
                              <strong>{isPlus ? 'Bentuk Apresiasi/Reward:' : 'Sanksi/Hukuman:'}</strong> {record.punishmentOrReward}
                            </p>

                            {record.notes && (
                              <p className="text-[11px] text-gray-400 italic bg-[#0A0A0B] border border-white/5 p-2 rounded-lg mt-1">
                                &ldquo;{record.notes}&rdquo;
                              </p>
                            )}

                            {/* Parent Confirmation Badge */}
                            <div className="pt-1.5 flex items-center gap-2">
                              {record.parentConfirmed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Dibaca & Dikonfirmasi Wali ({record.parentConfirmedAt})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  Belum Dikonfirmasi Wali
                                </span>
                              )}
                              {record.parentNote && (
                                <p className="text-[10px] text-gray-400">Tanggapan Wali: &ldquo;{record.parentNote}&rdquo;</p>
                              )}
                            </div>
                          </div>

                          {/* Points pill & Delete button */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className={`text-base font-black px-3 py-1 rounded-xl block ${
                              isPlus ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : isHeavy ? 'bg-rose-600 text-white' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {isPlus ? `+${record.points}` : `${record.points}`} Poin
                            </span>
                            <span className="text-[10px] text-gray-400 block">Oleh: {record.recordedBy}</span>
                            {onDeleteRecord && (
                              <button
                                type="button"
                                onClick={() => setRecordToDelete(record)}
                                className="mt-1 p-1 px-2 text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg border border-rose-500/20 text-[10px] flex items-center gap-1 transition-all print:hidden cursor-pointer"
                                title="Hapus catatan poin ini"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus Record</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: BK COUNSELING NOTES */}
          {activeSubTab === 'bk' && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-purple-400" />
                    Buku Catatan Sesi Bimbingan Konseling (BK) & Evaluasi
                  </h4>
                  <p className="text-xs text-gray-400">
                    Dokumen rahasia pembinaan internal kesiswaan untuk evaluasi karakter & rapat semester.
                  </p>
                </div>

                {onOpenBKModalForSantri && (
                  <button
                    type="button"
                    onClick={() => onOpenBKModalForSantri(santri.id)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 border border-purple-400/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Sesi BK Baru</span>
                  </button>
                )}
              </div>

              {santriBKNotes.length === 0 ? (
                <div className="p-8 text-center bg-[#111113] rounded-2xl border border-dashed border-white/10 space-y-2">
                  <HeartHandshake className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-gray-300 font-semibold text-xs">Belum ada catatan konseling BK untuk {santri.name}</p>
                  <p className="text-[11px] text-gray-500">
                    Klik tombol "Catat Sesi BK Baru" untuk mendokumentasikan bimbingan atau ringkasan evaluasi AI.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {santriBKNotes.map(note => {
                    const urgencyBadgeClass =
                      note.urgencyLevel === 'Kritis (Perlu Tindak Lanjut)'
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : note.urgencyLevel === 'Tinggi'
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                        : note.urgencyLevel === 'Sedang'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-gray-500/15 text-gray-400 border-gray-500/30';

                    return (
                      <div
                        key={note.id}
                        className="p-4 bg-[#111113] border border-white/5 hover:border-purple-500/30 rounded-2xl transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              Sesi: {new Date(note.sessionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-gray-500">&bull;</span>
                            <span className="text-[11px] text-purple-300 font-medium">
                              Semester {note.semester} ({note.academicYear})
                            </span>
                            <span className="text-gray-500">&bull;</span>
                            <span className="text-[11px] text-gray-400">Konselor: {note.counselorName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${urgencyBadgeClass}`}>
                              {note.urgencyLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {note.status}
                            </span>

                            {onEditBKNote && (
                              <button
                                type="button"
                                onClick={() => onEditBKNote(note)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                                title="Edit Sesi BK"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}

                            {onDeleteBKNote && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Hapus catatan konseling ini?')) {
                                    onDeleteBKNote(note.id);
                                  }
                                }}
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                title="Hapus Sesi BK"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="text-gray-300">
                            <strong className="text-gray-400">Pokok Masalah ({note.counselingType}):</strong> {note.problemDescription}
                          </p>
                          <p className="text-gray-300">
                            <strong className="text-gray-400">Proses Bimbingan:</strong> {note.counselingNotes}
                          </p>
                          {note.studentCommitment && (
                            <p className="text-purple-300 italic text-[11px]">
                              <strong>Komitmen Santri:</strong> &ldquo;{note.studentCommitment}&rdquo;
                            </p>
                          )}
                          {note.actionPlan && (
                            <p className="text-blue-300 text-[11px]">
                              <strong>Rencana Tindak Lanjut:</strong> {note.actionPlan}
                            </p>
                          )}
                        </div>

                        {/* AI Analysis Snippet */}
                        {note.aiAnalysis && (
                          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-400" /> Draf Laporan Evaluasi Semester AI
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySnippet(note.aiAnalysis!.evaluationReportSnippet, note.id)}
                                className="text-[10px] text-purple-300 hover:text-white underline cursor-pointer"
                              >
                                {copiedSnippetId === note.id ? 'Tersalin!' : 'Salin Draf Evaluasi'}
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-300 leading-relaxed font-sans bg-black/40 p-2 rounded-lg border border-white/5">
                              "{note.aiAnalysis.evaluationReportSnippet}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: EKSKUL & MONTHLY PAYMENT BREAKDOWN */}
          {activeSubTab === 'ekskul' && (
            <div className="space-y-4 pt-2">
              {(() => {
                if (santriEkskulList.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-gray-400 bg-[#0A0A0B] rounded-2xl border border-white/5 space-y-2">
                      <Activity className="w-8 h-8 text-gray-600 mx-auto" />
                      <p className="font-semibold text-gray-300">Belum Ada Pendaftaran Ekstrakurikuler</p>
                      <p className="text-[11px] text-gray-500">
                        Santri {santri.name} belum terdaftar di modul ekstrakurikuler sistem kesiswaan terintegrasi.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {santriEkskulList.map((ekskul) => {
                      const isPaid = ekskul.isPaid;
                      const statusColor = isPaid ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-300 bg-rose-500/10 border-rose-500/30';
                      const statusDot = isPaid ? 'bg-emerald-400' : 'bg-rose-400';

                      return (
                        <div
                          key={ekskul.id}
                          className="p-4 sm:p-5 rounded-2xl bg-[#111113] border border-white/10 space-y-4 shadow-lg text-left"
                        >
                          {/* Top Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                <Activity className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-base text-white">{ekskul.ekskulName}</h4>
                                  {ekskul.category && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                      {ekskul.category}
                                    </span>
                                  )}
                                </div>
                                {ekskul.day && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {ekskul.day}{ekskul.time ? ` • ${ekskul.time}` : ''}{ekskul.location ? ` • ${ekskul.location}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className={`px-3 py-1 text-xs font-bold rounded-xl border flex items-center gap-2 self-start sm:self-auto ${statusColor}`}>
                              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                              Status: {ekskul.paymentStatus}
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/5">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Kehadiran</span>
                              <span className="font-bold text-white text-sm mt-0.5 block">
                                {ekskul.attendanceRate !== undefined ? `${ekskul.attendanceRate}%` : '100%'}
                                {ekskul.totalSessions ? (
                                  <span className="text-xs text-gray-400 font-normal ml-1">
                                    ({ekskul.attendedSessions || 0}/{ekskul.totalSessions} sesi)
                                  </span>
                                ) : null}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/5">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Pelatih / Pembina</span>
                              <span className="font-bold text-white text-sm mt-0.5 block truncate" title={ekskul.coachName}>
                                {ekskul.coachName || 'Pembina Ekskul'}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/5">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Status Keaktifan</span>
                              <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                                {ekskul.statusRisk || 'Sangat Baik'}
                              </span>
                            </div>
                          </div>

                          {/* Ekskul Monthly Payment Breakdown */}
                          <EkskulPaymentBreakdown ekskul={ekskul} defaultExpanded={true} />

                          {ekskul.coachNote && (
                            <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs text-blue-200 italic">
                              &ldquo;{ekskul.coachNote}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Printable Signature Area */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold mt-1">Kepala Kesiswaan Al Fajar Islamic School</p>
              <div className="h-16"></div>
              <p className="font-bold border-b border-slate-900 inline-block px-8">Ust. Fathir, S.Pd.I</p>
            </div>
            <div>
              <p>Tanggal Cetak: {formatDateIndonesian(new Date().toISOString().split('T')[0])}</p>
              <p className="font-bold mt-1">Orang Tua / Wali Santri</p>
              <div className="h-16"></div>
              <p className="font-bold border-b border-slate-900 inline-block px-8">{santri.parentName}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#111113] border-t border-white/10 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickInputForSantri(santri.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-blue-400/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Poin Disiplin
            </button>
            {onOpenBKModalForSantri && (
              <button
                onClick={() => onOpenBKModalForSantri(santri.id)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-purple-400/30 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4" />
                Catat Sesi BK
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
          >
            Tutup Rapor
          </button>
        </div>
      </div>

      {/* In-App Delete Record Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161618] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Konfirmasi Hapus Catatan Poin</h3>
                <p className="text-xs text-rose-300">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0A0A0B] rounded-xl border border-white/10 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-white text-sm">{recordToDelete.title}</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  recordToDelete.type === 'Kebaikan'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {recordToDelete.type === 'Kebaikan' ? `+${recordToDelete.points}` : recordToDelete.points} Poin
                </span>
              </div>
              <p className="text-gray-400">
                Santri: <strong className="text-gray-200">{santri.name}</strong> ({santri.class})
              </p>
              <p className="text-gray-400">
                Tanggal: <strong className="text-gray-200">{formatDateIndonesian(recordToDelete.date)}</strong> &bull; Dicatat oleh: Ust. {recordToDelete.recordedBy}
              </p>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus data catatan poin ini? Data akan segera terhapus dan disinkronkan secara real-time ke cloud.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRecord) {
                    onDeleteRecord(recordToDelete.id);
                  }
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
