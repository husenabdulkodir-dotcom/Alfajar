import React, { useState, useMemo } from 'react';
import { PointRecord, Santri } from '../types';
import { formatDateIndonesian } from '../utils/helpers';
import {
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Award,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  SlidersHorizontal,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

interface RecentActivityTrackerProps {
  records: PointRecord[];
  santriList: Santri[];
  academicYear: string;
  onSelectSantri: (santri: Santri) => void;
  onOpenQuickInput: () => void;
  onDeleteRecord?: (recordId: string) => void;
  onDeleteMultipleRecords?: (recordIds: string[]) => void;
}

export const RecentActivityTracker: React.FC<RecentActivityTrackerProps> = ({
  records,
  santriList,
  academicYear,
  onSelectSantri,
  onOpenQuickInput,
  onDeleteRecord,
  onDeleteMultipleRecords
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Pelanggaran' | 'Kebaikan' | 'Berat'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');
  const [parentConfirmFilter, setParentConfirmFilter] = useState<'ALL' | 'CONFIRMED' | 'UNCONFIRMED'>('ALL');

  // Deletion Modal States
  const [recordToDelete, setRecordToDelete] = useState<PointRecord | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Santri Map for quick lookup
  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach(s => map.set(s.id, s));
    return map;
  }, [santriList]);

  // Date boundary calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search term filter
      const term = searchTerm.toLowerCase().trim();
      const santriObj = santriMap.get(r.santriId);
      const matchesSearch =
        !term ||
        r.santriName.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        (r.recordedBy && r.recordedBy.toLowerCase().includes(term)) ||
        (r.punishmentOrReward && r.punishmentOrReward.toLowerCase().includes(term)) ||
        (santriObj && santriObj.class.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Type Filter
      if (typeFilter === 'Pelanggaran' && r.type !== 'Pelanggaran') return false;
      if (typeFilter === 'Kebaikan' && r.type !== 'Kebaikan') return false;
      if (typeFilter === 'Berat' && (!r.isHeavyViolation && r.category !== 'Berat')) return false;

      // Category Filter
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;

      // Time Filter
      if (timeFilter === 'TODAY' && r.date !== todayStr) return false;
      if (timeFilter === 'WEEK' && new Date(r.date) < sevenDaysAgo) return false;
      if (timeFilter === 'MONTH' && !r.date.startsWith(currentMonthStr)) return false;
      if (timeFilter === 'YEAR' && r.academicYear !== academicYear) return false;

      // Parent Confirm Filter
      if (parentConfirmFilter === 'CONFIRMED' && !r.parentConfirmed) return false;
      if (parentConfirmFilter === 'UNCONFIRMED' && r.parentConfirmed) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    records,
    searchTerm,
    typeFilter,
    categoryFilter,
    timeFilter,
    parentConfirmFilter,
    todayStr,
    sevenDaysAgo,
    currentMonthStr,
    academicYear,
    santriMap
  ]);

  // Quick Stats for Current Filters (Single pass O(N))
  const stats = useMemo(() => {
    let totalPelanggaran = 0;
    let totalKebaikan = 0;
    let totalBerat = 0;
    let totalPoinMinus = 0;
    let totalPoinPlus = 0;
    let confirmedCount = 0;

    for (const r of filteredRecords) {
      if (r.type === 'Pelanggaran') {
        totalPelanggaran++;
        totalPoinMinus += Math.abs(r.points);
      } else if (r.type === 'Kebaikan') {
        totalKebaikan++;
        totalPoinPlus += Math.abs(r.points);
      }

      if (r.isHeavyViolation || r.category === 'Berat') {
        totalBerat++;
      }

      if (r.parentConfirmed) {
        confirmedCount++;
      }
    }

    return {
      total: filteredRecords.length,
      totalPelanggaran,
      totalKebaikan,
      totalBerat,
      totalPoinMinus,
      totalPoinPlus,
      confirmedCount
    };
  }, [filteredRecords]);

  // Selection handlers
  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map(r => r.id));
    }
  };

  const handleConfirmSingleDelete = () => {
    if (recordToDelete && onDeleteRecord) {
      onDeleteRecord(recordToDelete.id);
      setSelectedRecordIds(prev => prev.filter(id => id !== recordToDelete.id));
      setRecordToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedRecordIds.length > 0) {
      if (onDeleteMultipleRecords) {
        onDeleteMultipleRecords(selectedRecordIds);
      } else if (onDeleteRecord) {
        selectedRecordIds.forEach(id => onDeleteRecord(id));
      }
      setSelectedRecordIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Title Banner */}
      <div className="bg-[#161618] p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">
              Pelacakan Riwayat Pelanggaran & Prestasi Terbaru
            </h2>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
            Lacak seluruh aktivitas pencatatan poin santri secara real-time. Setiap entri langsung tersinkronisasi antar-perangkat dan dapat langsung diverifikasi oleh kesiswaan dan orang tua santri.
          </p>
        </div>

        <button
          onClick={onOpenQuickInput}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 border border-blue-400/30 cursor-pointer"
        >
          <Award className="w-4 h-4" />
          <span>+ Catat Poin Baru</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#161618] p-4 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Total Catatan</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          <span className="text-[10px] text-gray-400">Dalam filter terpilih</span>
        </div>

        <div className="bg-[#161618] p-4 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">Pelanggaran</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-rose-400">{stats.totalPelanggaran}</p>
            <span className="text-xs font-bold text-rose-300">(-{stats.totalPoinMinus} Poin)</span>
          </div>
          <span className="text-[10px] text-rose-300">{stats.totalBerat} Pelanggaran Berat</span>
        </div>

        <div className="bg-[#161618] p-4 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Prestasi & Kebaikan</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-emerald-400">{stats.totalKebaikan}</p>
            <span className="text-xs font-bold text-emerald-300">(+{stats.totalPoinPlus} Poin)</span>
          </div>
          <span className="text-[10px] text-emerald-300">Apresiasi santri</span>
        </div>

        <div className="bg-[#161618] p-4 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400">Konfirmasi Wali</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-1">{stats.confirmedCount}</p>
          <span className="text-[10px] text-sky-300">
            {stats.total > 0 ? Math.round((stats.confirmedCount / stats.total) * 100) : 0}% terverifikasi
          </span>
        </div>
      </div>

      {/* Bulk Action Bar (When records are selected) */}
      {selectedRecordIds.length > 0 && (
        <div className="p-4 bg-blue-600/15 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-blue-200">
            <span className="font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg">
              {selectedRecordIds.length} Catatan Terpilih
            </span>
            <span>dari total {filteredRecords.length} catatan dalam daftar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRecordIds([])}
              className="px-3 py-1.5 bg-[#161618] hover:bg-white/10 text-gray-300 text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Batal Pilihan
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedRecordIds.length} Record Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Card */}
      <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri, judul catatan, sanksi/reward, atau petugas pencatat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0B] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-white/10 text-xs shrink-0 flex-wrap">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => setTypeFilter('Pelanggaran')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === 'Pelanggaran' ? 'bg-rose-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pelanggaran
            </button>
            <button
              onClick={() => setTypeFilter('Kebaikan')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === 'Kebaikan' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Prestasi
            </button>
            <button
              onClick={() => setTypeFilter('Berat')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === 'Berat' ? 'bg-rose-700 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pelanggaran Berat
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5 text-xs">
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 shrink-0 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Waktu:
            </span>
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="w-full py-1.5 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini ({todayStr})</option>
              <option value="WEEK">7 Hari Terakhir</option>
              <option value="MONTH">Bulan Ini</option>
              <option value="YEAR">Tahun Ajaran ({academicYear})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 shrink-0 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              Kategori:
            </span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
              <option value="Ibadah">Ibadah</option>
              <option value="Prestasi">Prestasi</option>
              <option value="Kedisiplinan">Kedisiplinan</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Akhlak">Akhlak</option>
            </select>
          </div>

          {/* Parent Confirmation Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 shrink-0 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
              Status Wali:
            </span>
            <select
              value={parentConfirmFilter}
              onChange={e => setParentConfirmFilter(e.target.value as any)}
              className="w-full py-1.5 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="CONFIRMED">Sudah Dikonfirmasi Wali</option>
              <option value="UNCONFIRMED">Belum Dikonfirmasi Wali</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Activity List */}
      <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            {filteredRecords.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                {selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500" />
                )}
                <span>{selectedRecordIds.length === filteredRecords.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
              </button>
            )}
            <span className="text-xs text-gray-400">
              Menampilkan <strong>{filteredRecords.length}</strong> catatan aktivitas
            </span>
          </div>

          {searchTerm || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || timeFilter !== 'ALL' || parentConfirmFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
                setTimeFilter('ALL');
                setParentConfirmFilter('ALL');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCcw className="w-3 h-3" />
              Reset Semua Filter
            </button>
          ) : null}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#0A0A0B] rounded-2xl border border-dashed border-white/10">
            <Clock className="w-12 h-12 text-gray-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Tidak ada data catatan yang cocok</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ganti filter tanggal & jenis pelanggaran.
              </p>
            </div>
            <button
              onClick={onOpenQuickInput}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              Input Catatan Poin Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map(record => {
              const isPlus = record.type === 'Kebaikan';
              const isHeavy = record.isHeavyViolation || record.category === 'Berat';
              const santriObj = santriMap.get(record.santriId);
              const isSelected = selectedRecordIds.includes(record.id);

              return (
                <div
                  key={record.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-md'
                      : isHeavy
                      ? 'bg-[#1a1215] border-rose-500/30 hover:border-rose-500/50'
                      : isPlus
                      ? 'bg-[#111915] border-emerald-500/20 hover:border-emerald-500/40'
                      : 'bg-[#0A0A0B] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for Bulk Operations */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectRecord(record.id)}
                      className="mt-1 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                      title={isSelected ? 'Batalkan pilihan' : 'Pilih catatan ini'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {/* Main content body */}
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left details */}
                      <div className="space-y-2 flex-1">
                        {/* Santri name & Badges */}
                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => santriObj && onSelectSantri(santriObj)}
                            className="font-bold text-sm text-white hover:text-blue-400 flex items-center gap-1.5 transition-colors group cursor-pointer"
                          >
                            <User className="w-4 h-4 text-blue-400" />
                            <span>{record.santriName}</span>
                            {santriObj && (
                              <span className="text-xs font-normal text-gray-400">
                                (Kelas {santriObj.class})
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
                          </button>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            isPlus
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isHeavy
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {isPlus ? 'Kebaikan / Prestasi' : isHeavy ? '🚨 Pelanggaran Berat' : 'Pelanggaran Disiplin'}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
                            Kategori: {record.category}
                          </span>

                          {record.parentConfirmed ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-sky-400" />
                              Dikonfirmasi Wali
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Belum Dikonfirmasi Wali
                            </span>
                          )}
                        </div>

                        {/* Record Title & Description */}
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {record.title}
                          </h4>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                            <strong className="text-gray-400">{isPlus ? 'Bentuk Apresiasi / Hadiah:' : 'Sanksi / Pembinaan:'} </strong>
                            {record.punishmentOrReward || '-'}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic bg-[#161618] p-2 rounded-lg border border-white/5">
                              Catatan Tambahan: &ldquo;{record.notes}&rdquo;
                            </p>
                          )}
                          {record.parentConfirmedAt && record.parentNote && (
                            <p className="text-xs text-sky-300 mt-1.5 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                              💬 <strong>Tanggapan Wali Santri:</strong> &ldquo;{record.parentNote}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Footer Metadata */}
                        <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {formatDateIndonesian(record.date)}
                          </span>
                          <span>
                            Petugas: <strong className="text-gray-300">Ust. {record.recordedBy}</strong>
                          </span>
                          <span>
                            Tahun Ajaran: <strong className="text-blue-400">{record.academicYear}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right side Points & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="text-right">
                          <span className={`text-base font-black px-3 py-1 rounded-xl block ${
                            isPlus
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isHeavy
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isPlus ? `+${record.points}` : `${record.points}`} Poin
                          </span>
                        </div>

                        {onDeleteRecord && (
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            className="p-1.5 px-2.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/20 text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Hapus catatan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus Record</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Single Record Deletion Confirmation Modal */}
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
                Santri: <strong className="text-gray-200">{recordToDelete.santriName}</strong>
              </p>
              <p className="text-gray-400">
                Tanggal: <strong className="text-gray-200">{formatDateIndonesian(recordToDelete.date)}</strong> &bull; Dicatat oleh: Ust. {recordToDelete.recordedBy}
              </p>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus data catatan poin ini? Poin santri akan otomatis diperbarui dan disinkronkan ke seluruh sistem dan cloud Firestore.
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
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Bulk Deletion Confirmation Modal */}
      {isBulkDeleteModalOpen && selectedRecordIds.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161618] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Hapus Masal Catatan Poin</h3>
                <p className="text-xs text-rose-300">Konfirmasi penghapusan banyak data</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Anda akan menghapus <strong className="text-rose-400 font-bold">{selectedRecordIds.length} catatan poin</strong> yang dipilih sekaligus. Seluruh akumulasi poin santri terkait akan diperbarui dan data di cloud Firestore akan disinkronkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus {selectedRecordIds.length} Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
