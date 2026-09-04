import React, { useState, useMemo } from 'react';
import { Santri, PointRecord, RuleItem, AnnualResetLog, BKCounselingNote } from '../types';
import { calculateNetPoints, getHeavyViolations, determineSantriStatus, getStatusBadgeStyle, exportToCSV } from '../utils/helpers';
import { exportBackupDataJSON, importBackupDataJSON } from '../utils/storage';
import {
  Sparkles,
  Printer,
  Download,
  Search,
  ShieldAlert,
  Users,
  FileText,
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MessageSquare,
  Award,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface RecapReportsProps {
  santriList: Santri[];
  records: PointRecord[];
  rules: RuleItem[];
  academicYear: string;
  resetLogs: AnnualResetLog[];
  bkNotes?: BKCounselingNote[];
  onRestoreBackup: (data: {
    santriList: Santri[];
    records: PointRecord[];
    rules: RuleItem[];
    academicYear: string;
    resetLogs: AnnualResetLog[];
    bkNotes?: BKCounselingNote[];
  }) => void;
  onOpenSharePortalModal?: () => void;
}

type ViewTab = 'rekapan_berkala' | 'rapat_dewan_guru' | 'keamanan_backup';
type PeriodType = 'monthly' | 'semester' | 'yearly';

export const RecapReports: React.FC<RecapReportsProps> = ({
  santriList,
  records,
  rules,
  academicYear,
  resetLogs,
  bkNotes = [],
  onRestoreBackup,
  onOpenSharePortalModal
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('rekapan_berkala');

  // Filter & Search States
  const [periodType, setPeriodType] = useState<PeriodType>('semester');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Dewan Guru Meeting Notes
  const [meetingNotes, setMeetingNotes] = useState(
    '1. Santri/Siswa penerima SP 1 & SP 2 diwajibkan mengikuti program bimbingan dan pendampingan khusus.\n2. Siswa penerima SP 3 & Kritis dijadwalkan pemanggilan Orang Tua dan sidang penentuan pembinaan.\n3. Siswa Berprestasi/Teladan diberikan piagam penghargaan saat Apel Sekolah Al Fajar Islamic School.'
  );

  // Backup & Restore Notification
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const uniqueClasses = Array.from(new Set(santriList.map(s => s.class)));

  // Filter records based on active period selection
  const periodFilteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.academicYear !== academicYear) return false;

      if (periodType === 'monthly') {
        return r.date.startsWith(selectedMonth);
      } else if (periodType === 'semester') {
        return r.semester === selectedSemester;
      } else {
        return true;
      }
    });
  }, [records, academicYear, periodType, selectedMonth, selectedSemester]);

  // Aggregate stats per Santri for the chosen period with indexed maps for high performance
  const recapRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // Index periodFilteredRecords by santriId
    const periodRecsBySantri = new Map<string, PointRecord[]>();
    for (const r of periodFilteredRecords) {
      let list = periodRecsBySantri.get(r.santriId);
      if (!list) {
        list = [];
        periodRecsBySantri.set(r.santriId, list);
      }
      list.push(r);
    }

    // Index heavy violations and year records in a single pass
    const heavyBySantri = new Map<string, PointRecord[]>();
    const yearNetBySantri = new Map<string, number>();

    for (const r of records) {
      if (r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation)) {
        let hList = heavyBySantri.get(r.santriId);
        if (!hList) {
          hList = [];
          heavyBySantri.set(r.santriId, hList);
        }
        hList.push(r);
      }

      if (r.academicYear === academicYear) {
        const currentNet = yearNetBySantri.get(r.santriId) || 0;
        const pts = r.type === 'Kebaikan' ? Math.abs(r.points) : -Math.abs(r.points);
        yearNetBySantri.set(r.santriId, currentNet + pts);
      }
    }

    return santriList
      .filter(s => selectedClass === 'ALL' || s.class === selectedClass)
      .filter(s =>
        !term ||
        s.name.toLowerCase().includes(term) ||
        (s.nis && s.nis.toLowerCase().includes(term)) ||
        (s.nisn && s.nisn.toLowerCase().includes(term))
      )
      .map(s => {
        const sPeriodRecs = periodRecsBySantri.get(s.id) || [];

        let plusPeriod = 0;
        let minusPeriod = 0;
        for (const r of sPeriodRecs) {
          if (r.type === 'Kebaikan') plusPeriod += Math.abs(r.points);
          else minusPeriod += Math.abs(r.points);
        }
        const netPeriod = plusPeriod - minusPeriod;

        // Heavy violations all-time
        const heavyAllTime = heavyBySantri.get(s.id) || [];

        // Overall status
        const yearNet = yearNetBySantri.get(s.id) || 0;
        const status = determineSantriStatus(yearNet, heavyAllTime.length, s.manualStatus);

        return {
          santri: s,
          plusPeriod,
          minusPeriod,
          netPeriod,
          heavyCount: heavyAllTime.length,
          yearNet,
          status
        };
      });
  }, [santriList, periodFilteredRecords, records, academicYear, selectedClass, searchTerm]);

  // Special Filter for Dewan Guru Meeting (Santri with SP or Heavy Violations)
  const dewanGuruSpecialRows = useMemo(() => {
    return recapRows.filter(r =>
      r.status === 'SP 1' ||
      r.status === 'SP 2' ||
      r.status === 'SP 3' ||
      r.status === 'Kritis' ||
      r.status === 'Peringatan' ||
      r.heavyCount > 0
    );
  }, [recapRows]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const periodLabel = periodType === 'monthly' ? `Bulan_${selectedMonth}` : periodType === 'semester' ? `Semester_${selectedSemester}` : `Tahun_${academicYear}`;
    const data = recapRows.map(r => ({
      NIS: r.santri.nis || '-',
      NISN: r.santri.nisn || '-',
      Nama_Siswa: r.santri.name,
      Kelas: r.santri.class,
      Amanah_Jabatan: r.santri.organizationRole || '-',
      Poin_Plus_Periode: r.plusPeriod,
      Poin_Minus_Periode: r.minusPeriod,
      Net_Poin_Periode: r.netPeriod,
      Net_Poin_Tahunan: r.yearNet,
      Pelanggaran_Berat_AllTime: r.heavyCount,
      Status_Disiplin: r.status
    }));

    exportToCSV(`Rekap_Poin_Santri_${periodLabel}`, data);
  };

  const handleDownloadBackup = () => {
    exportBackupDataJSON(santriList, records, rules, academicYear, resetLogs, bkNotes);
    setBackupMessage({
      type: 'success',
      text: 'File backup data (.json) termasuk data BK berhasil diunduh dan tersimpan di perangkat Anda!'
    });
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupDataJSON(content);
        if (res.success && res.data) {
          onRestoreBackup(res.data);
          setBackupMessage({
            type: 'success',
            text: res.message
          });
        } else {
          setBackupMessage({
            type: 'error',
            text: res.message
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs for Reports */}
      <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2 print:hidden">
        <button
          onClick={() => setActiveTab('rekapan_berkala')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'rekapan_berkala'
              ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Rekapitulasi Berkala</span>
        </button>

        <button
          onClick={() => setActiveTab('rapat_dewan_guru')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'rapat_dewan_guru'
              ? 'bg-amber-600 text-white shadow-sm border border-amber-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Laporan Rapat Dewan Guru</span>
        </button>

        <button
          onClick={() => setActiveTab('keamanan_backup')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'keamanan_backup'
              ? 'bg-emerald-600 text-white shadow-sm border border-emerald-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Keamanan & Backup Data</span>
        </button>
      </div>

      {/* TAB 1: REKAPITULASI BERKALA */}
      {activeTab === 'rekapan_berkala' && (
        <div className="space-y-5">
          {/* Header & Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Laporan Rekapitulasi Evaluasi Karakter Santri
                </h2>
                <p className="text-xs text-slate-500">
                  Rekapitulasi Poin Bulanan, Semesteran, dan Tahunan (Tahun Ajaran {academicYear})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs border border-blue-600 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Export Excel/CSV
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Periode Rekapan:</label>
                <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setPeriodType('monthly')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${periodType === 'monthly' ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setPeriodType('semester')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${periodType === 'semester' ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Semester
                  </button>
                  <button
                    onClick={() => setPeriodType('yearly')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${periodType === 'yearly' ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Tahunan
                  </button>
                </div>
              </div>

              {periodType === 'monthly' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Bulan:</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {periodType === 'semester' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Semester:</label>
                  <select
                    value={selectedSemester}
                    onChange={e => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ganjil">Semester Ganjil (Juli - Desember)</option>
                    <option value="Genap">Semester Genap (Januari - Juni)</option>
                  </select>
                </div>
              )}

              {periodType === 'yearly' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Ajaran Aktif:</label>
                  <div className="py-1.5 px-3 text-xs font-bold bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    TA {academicYear}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Kelas:</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kelas</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cari Nama / NIS:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Kata kunci..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 print:border-none print:shadow-none print:p-0">
            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                AL FAJAR ISLAMIC SCHOOL - BAGIAN KESISWAAN
              </h1>
              <h2 className="text-sm font-bold text-blue-800 mt-1">
                REKAPITULASI POIN KEDISIPLINAN & PRESTASI SANTRI / SISWA ({periodType.toUpperCase()})
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Periode: {periodType === 'monthly' ? selectedMonth : periodType === 'semester' ? `Semester ${selectedSemester}` : `Tahun Ajaran ${academicYear}`}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 rounded-tl-xl">No</th>
                    <th className="p-3 text-cyan-700 font-semibold">NIS</th>
                    <th className="p-3 text-indigo-700 font-semibold">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3 text-center text-emerald-700 font-semibold">Poin Plus (+ Periode)</th>
                    <th className="p-3 text-center text-rose-700 font-semibold">Pelanggaran (- Periode)</th>
                    <th className="p-3 text-center font-black">Net Periode</th>
                    <th className="p-3 text-center text-rose-700 font-semibold">Pelanggaran Berat</th>
                    <th className="p-3 text-center rounded-tr-xl">Status Disiplin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recapRows.map((r, index) => {
                    const badgeStyle = getStatusBadgeStyle(r.status);
                    return (
                      <tr key={r.santri.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-500">{index + 1}</td>
                        <td className="p-3 font-mono text-cyan-800 font-medium">{r.santri.nis || '-'}</td>
                        <td className="p-3 font-mono text-indigo-800 font-medium">{r.santri.nisn || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{r.santri.name}</div>
                          {r.santri.organizationRole && (
                            <div className="mt-1">
                              <RoleBadge role={r.santri.organizationRole} size="sm" />
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{r.santri.class}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">+{r.plusPeriod}</td>
                        <td className="p-3 text-center font-bold text-rose-600">-{r.minusPeriod}</td>
                        <td className={`p-3 text-center font-black text-sm ${r.netPeriod >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.netPeriod > 0 ? `+${r.netPeriod}` : r.netPeriod}
                        </td>
                        <td className={`p-3 text-center font-extrabold ${r.heavyCount > 0 ? 'text-rose-700 bg-rose-50 rounded-lg border border-rose-200' : 'text-slate-400'}`}>
                          {r.heavyCount > 0 ? `${r.heavyCount} Kasus` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Print Signatures */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold mt-1">Ketua Kesiswaan</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-900 inline-block px-8">Ust. Fathir, S.Pd.I</p>
              </div>
              <div>
                <p>Disahkan Oleh,</p>
                <p className="font-bold mt-1">Pimpinan / Kepala Sekolah Al Fajar Islamic School</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-900 inline-block px-8">K.H. Ahmad Subagja, Lc.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN SEMESTERAN DEWAN GURU */}
      {activeTab === 'rapat_dewan_guru' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <FileText className="w-4 h-4" />
                BERKAS RESMI EVALUASI DEWAN GURU
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Laporan Semesteran & Evaluasi Karakter Rapat Dewan Guru
              </h2>
              <p className="text-xs text-slate-500">
                Laporan terintegrasi untuk pembahasan sidang rapat guru, sidang SP/Skorsing, dan penetapan evaluasi santri.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                <option value="Genap">Semester Genap (Jan - Juni)</option>
              </select>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 border border-amber-600 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen Rapat
              </button>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <p className="text-[11px] text-slate-500">Total Santri Dievaluasi</p>
              <p className="text-2xl font-black text-slate-900">{santriList.length}</p>
              <p className="text-[10px] text-slate-400">TA {academicYear} &bull; Sem. {selectedSemester}</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
              <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Santri SP 1 / SP 2 / SP 3
              </p>
              <p className="text-2xl font-black text-amber-900">
                {recapRows.filter(r => r.status === 'SP 1' || r.status === 'SP 2' || r.status === 'SP 3').length} Santri
              </p>
              <p className="text-[10px] text-amber-700">SP1 (-50 / 1x Berat), SP2 (-75 / 2x Berat), SP3 (-90 / 3x Berat)</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-1">
              <p className="text-[11px] text-rose-800 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Santri Status Kritis / Skorsing
              </p>
              <p className="text-2xl font-black text-rose-900">
                {recapRows.filter(r => r.status === 'Kritis').length} Santri
              </p>
              <p className="text-[10px] text-rose-700">Poin &le; -100 atau &ge;4 Kasus Berat</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
              <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Santri Teladan & Baik
              </p>
              <p className="text-2xl font-black text-emerald-900">
                {recapRows.filter(r => r.status === 'Teladan' || r.status === 'Baik').length} Santri
              </p>
              <p className="text-[10px] text-emerald-700">Penerima Apresiasi Guru</p>
            </div>
          </div>

          {/* Special Focus Table for Dewan Guru */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 print:border-none print:shadow-none print:p-0">
            {/* Header Print */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
              <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                AL FAJAR ISLAMIC SCHOOL &bull; SISTEM KESISWAAN & BK
              </h1>
              <h2 className="text-sm font-bold text-amber-900 mt-1">
                LAPORAN SEMESTERAN EVALUASI CHARACTER & KEDISIPLINAN SISWA (RAPAT DEWAN GURU)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Semester {selectedSemester} &bull; Tahun Ajaran {academicYear}
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Daftar Santri Memerlukan Pembahasan Rapat Dewan Guru (SP 1, SP 2, SP 3, Kritis)
                </h3>
              </div>
              <span className="text-xs text-amber-800 font-bold bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                {dewanGuruSpecialRows.length} Santri Teridentifikasi
              </span>
            </div>

            {/* Special Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">No</th>
                    <th className="p-3 text-cyan-700 font-semibold">NIS</th>
                    <th className="p-3 text-indigo-700 font-semibold">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3 text-center text-rose-700 font-semibold">Net Poin</th>
                    <th className="p-3 text-center text-rose-700 font-semibold">Kasus Berat</th>
                    <th className="p-3 text-center">Status SP</th>
                    <th className="p-3">Rekomendasi Tindak Lanjut Rapat Dewan Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dewanGuruSpecialRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                        Tidak ada santri yang terkena SP atau kasus berat pada semester ini. Semua santri dalam kondisi aman!
                      </td>
                    </tr>
                  ) : (
                    dewanGuruSpecialRows.map((r, idx) => {
                      const badgeStyle = getStatusBadgeStyle(r.status);
                      return (
                        <tr key={r.santri.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-mono text-cyan-800">{r.santri.nis || '-'}</td>
                          <td className="p-3 font-mono text-indigo-800">{r.santri.nisn || '-'}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <div>{r.santri.name}</div>
                            {r.santri.organizationRole && (
                              <div className="mt-1">
                                <RoleBadge role={r.santri.organizationRole} size="sm" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">{r.santri.class}</td>
                          <td className="p-3 text-center font-black text-rose-600 text-sm">{r.yearNet}</td>
                          <td className="p-3 text-center font-extrabold text-rose-700">
                            {r.heavyCount > 0 ? `${r.heavyCount} Kasus` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-700">
                            {r.status === 'Kritis' ? (
                              <strong className="text-rose-700">Sidang Pleno: Skorsing / Panggilan Khusus Orang Tua</strong>
                            ) : r.status === 'SP 3' ? (
                              <span className="text-rose-700 font-semibold">Penerbitan SP3 & Pembinaan Khusus Kesiswaan</span>
                            ) : r.status === 'SP 2' ? (
                              <span className="text-amber-800 font-semibold">Penerbitan SP2 & Pembatasan Izin Pulang</span>
                            ) : (
                              <span className="text-amber-700 font-semibold">Penerbitan SP1 & Bimbingan Konseling</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Dewan Guru Meeting Decisions Notes (Interactive & Printable) */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Notulensi & Keputusan Rapat Dewan Guru (Ikut Ter-Cetak):
                </span>
                <span className="text-[10px] text-slate-400 print:hidden">Bisa diedit sebelum dicetak</span>
              </label>
              <textarea
                rows={4}
                value={meetingNotes}
                onChange={e => setMeetingNotes(e.target.value)}
                className="w-full p-3 font-sans text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed print:bg-white print:text-slate-900 print:border-slate-300"
              />
            </div>

            {/* Print Signatures */}
            <div className="hidden print:grid grid-cols-3 gap-6 pt-10 text-center text-xs">
              <div>
                <p>Mewakili Wali Kelas,</p>
                <p className="font-bold mt-1">Koordinator Tingkat</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-900 inline-block px-6">Ust. Syahrul, S.Pd</p>
              </div>
              <div>
                <p>Notulis Rapat Guru,</p>
                <p className="font-bold mt-1">Sekretaris Kesiswaan</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-900 inline-block px-6">Ust. Hidayatullah</p>
              </div>
              <div>
                <p>Disahkan Oleh,</p>
                <p className="font-bold mt-1">Pimpinan / Kepala Sekolah Al Fajar Islamic School</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-900 inline-block px-6">K.H. Ahmad Subagja, Lc.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUSAT KEAMANAN & BACKUP DATA */}
      {activeTab === 'keamanan_backup' && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Pusat Keamanan & Pemulihan Data Kesiswaan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pastikan seluruh data santri, poin kedisiplinan, dan aturan aman tersimpan dan bisa dipulihkan kapan saja.
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-emerald-900">
                    Sistem Penyimpanan Terkunci & Aman
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Data tersimpan secara otomatis di memori lokal browser. Ekspor backup berkala agar berkas tetap aman saat ganti laptop/HP.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-xl shrink-0 shadow-xs">
                Status: {santriList.length} Santri &bull; {records.length} Record
              </span>
            </div>

            {/* Notification Alert */}
            {backupMessage && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  backupMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>{backupMessage.text}</span>
                <button
                  onClick={() => setBackupMessage(null)}
                  className="underline ml-2 cursor-pointer font-bold"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Export Backup Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    1. Unduh File Cadangan (Backup Data .JSON)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Simpan seluruh database (santri, riwayat poin, aturan, dan log reset) ke dalam satu file `.json`. File ini bisa digunakan untuk mengamankan data sebelum rapat guru atau saat berpindah komputer.
                  </p>
                </div>

                <button
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-blue-600 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Backup Data (.json)</span>
                </button>
              </div>

              {/* Import / Restore Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    2. Pulihkan Data dari File Backup (.JSON)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pilih file `.json` hasil unduhan backup sebelumnya untuk memulihkan seluruh data santri dan poin jika perangkat berganti atau data terhapus secara tidak sengaja.
                  </p>
                </div>

                <label className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-emerald-600 cursor-pointer active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Pilih & Pulihkan File Backup (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Dedicated Parent Portal Link Sharing Card */}
            {onOpenSharePortalModal && (
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-sm text-blue-950">Tautan Khusus & Akses Terisolasi Portal Wali Santri</h4>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Gunakan tautan khusus untuk disebarkan ke grup WhatsApp orang tua. Tautan ini secara otomatis mengunci dan menyembunyikan Mode Kesiswaan sehingga wali santri hanya dapat melihat santrinya sendiri.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenSharePortalModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 border border-blue-600 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Bagikan Link & Pesan WA Wali</span>
                </button>
              </div>
            )}

            {/* Extra Export CSV */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-xs text-slate-800 block">Arsip Fisik Excel / CSV:</span>
                <span className="text-xs text-slate-500">
                  Ekspor daftar rekap poin ke format spreadsheet (.csv) untuk dibuka di Microsoft Excel / Google Sheets.
                </span>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
