import React, { useState, useMemo } from 'react';
import { Santri, PointRecord, SantriStatus } from '../types';
import {
  determineSantriStatus,
  getStatusBadgeStyle,
  generateVariedAccessPin,
  isSequentialOrWeakPin
} from '../utils/helpers';
import {
  Search,
  Plus,
  Filter,
  ShieldAlert,
  Award,
  ChevronRight,
  UserPlus,
  Copy,
  Check,
  Eye,
  FileSpreadsheet,
  TrendingUp,
  Edit3,
  X,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Phone,
  KeyRound,
  Hash,
  Sparkles,
  Crown,
  History,
  GraduationCap
} from 'lucide-react';
import { BulkImportSantriModal } from './BulkImportSantriModal';
import { PromoteClassModal } from './PromoteClassModal';
import { BulkNISNManagerModal } from './BulkNISNManagerModal';
import { DeleteGraduatedModal } from './DeleteGraduatedModal';
import { RoleBadge } from './RoleBadge';
import { PRESET_ORGANIZATION_ROLES } from '../utils/organizationRoles';

interface SantriListProps {
  santriList: Santri[];
  records: PointRecord[];
  academicYear: string;
  onSelectSantri: (santri: Santri) => void;
  onOpenQuickInputForSantri: (santriId: string) => void;
  onAddSantri: (newSantri: Santri) => void;
  onImportSantri?: (importedSantri: Santri[], isOverwrite: boolean) => void;
  onPromoteSantriClasses?: (updatedSantriList: Santri[]) => void;
  onUpdateSantri?: (updatedSantri: Santri) => void;
  onDeleteMultipleSantri?: (ids: string[]) => void;
  onBatchUpdateSantri?: (updatedList: Santri[]) => void;
  onOpenAuditModal?: (santriId?: string) => void;
}

export const SantriList: React.FC<SantriListProps> = ({
  santriList,
  records,
  academicYear,
  onSelectSantri,
  onOpenQuickInputForSantri,
  onAddSantri,
  onImportSantri,
  onPromoteSantriClasses,
  onUpdateSantri,
  onDeleteMultipleSantri,
  onBatchUpdateSantri,
  onOpenAuditModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [onlyHeavy, setOnlyHeavy] = useState(false);
  
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isBulkNISNOpen, setIsBulkNISNOpen] = useState(false);
  const [isDeleteGraduatedOpen, setIsDeleteGraduatedOpen] = useState(false);

  // Multi-Selection State for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Individual Santri Editing State
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [isCustomEditingRole, setIsCustomEditingRole] = useState(false);

  // Form states for new santri
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('7 A');
  const [newNisn, setNewNisn] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isCustomNewRole, setIsCustomNewRole] = useState(false);

  // Extract unique classes
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.class))).sort();
  }, [santriList]);

  // Precompute stats map in a single pass over records for high-performance filtering & rendering
  const santriStatsMap = useMemo(() => {
    const map = new Map<string, { net: number; plus: number; minus: number; heavy: PointRecord[]; heavyCount: number; status: SantriStatus }>();
    
    // Group records by santriId
    const recordsBySantri = new Map<string, PointRecord[]>();
    for (const r of records) {
      let list = recordsBySantri.get(r.santriId);
      if (!list) {
        list = [];
        recordsBySantri.set(r.santriId, list);
      }
      list.push(r);
    }

    for (const s of santriList) {
      const sRecs = recordsBySantri.get(s.id) || [];
      let plus = 0;
      let minus = 0;
      const heavy: PointRecord[] = [];

      for (const r of sRecs) {
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

      const net = plus - minus;
      const status = determineSantriStatus(net, heavy.length, s.manualStatus);
      map.set(s.id, { net, plus, minus, heavy, heavyCount: heavy.length, status });
    }

    return map;
  }, [santriList, records, academicYear]);

  // Filtered Santri List (Memoized)
  const filteredSantri = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/\s+/g, '');

    return santriList.filter(s => {
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.parentName.toLowerCase().includes(term) ||
        (s.nis && s.nis.toLowerCase().includes(term)) ||
        (s.nisn && s.nisn.toLowerCase().includes(term)) ||
        (s.organizationRole && s.organizationRole.toLowerCase().includes(term)) ||
        s.class.toLowerCase().replace(/\s+/g, '').includes(cleanTerm);

      if (!matchesSearch) return false;

      if (classFilter !== 'ALL' && s.class !== classFilter) return false;

      const stats = santriStatsMap.get(s.id);
      const status = stats?.status || 'Aman';
      const heavyCount = stats?.heavyCount || 0;

      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      if (onlyHeavy && heavyCount === 0) return false;

      if (roleFilter === 'HAS_ROLE') {
        return !!s.organizationRole;
      } else if (roleFilter === 'NO_ROLE') {
        return !s.organizationRole;
      } else if (roleFilter === 'OSIS') {
        return !!s.organizationRole && s.organizationRole.toLowerCase().includes('osis');
      } else if (roleFilter === 'QISM') {
        return !!s.organizationRole && s.organizationRole.toLowerCase().includes('qism');
      } else if (roleFilter === 'KELAS') {
        return !!s.organizationRole && s.organizationRole.toLowerCase().includes('kelas');
      } else if (roleFilter !== 'ALL') {
        return s.organizationRole === roleFilter;
      }

      return true;
    });
  }, [santriList, santriStatsMap, searchTerm, classFilter, statusFilter, onlyHeavy, roleFilter]);

  // Toggle selection for a single santri
  const toggleSelectSantri = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select or Deselect all filtered santri
  const isAllFilteredSelected =
    filteredSantri.length > 0 &&
    filteredSantri.every(s => selectedIds.includes(s.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredSantri.map(s => s.id));
      setSelectedIds(prev => prev.filter(id => !filteredSet.has(id)));
    } else {
      const filteredIds = filteredSantri.map(s => s.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleCopyAccessPin = (santri: Santri) => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const nisParam = santri.nis ? `&nis=${encodeURIComponent(santri.nis.trim())}` : '';
    const directUrl = `${baseUrl}?portal=wali${nisParam}&code=${encodeURIComponent(santri.accessPin || '1234')}`;
    const infoText = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas: ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''}).\n\nBerikut data akses resmi untuk memantau poin kedisiplinan & prestasi ananda via Portal Orang Tua:\n🔗 *Link Langsung (Otomatis Masuk):*\n${directUrl}\n\nAtau buka: ${baseUrl}?portal=wali\n• *NIS Santri:* ${santri.nis || '(Belum terisi)'}\n• *Kode Akses Wali (PIN):* *${santri.accessPin || '1234'}*\n\nTerima kasih.\n_Bagian Kesiswaan & Wali Kelas_`;
    navigator.clipboard.writeText(infoText);
    setCopiedPinId(santri.id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleShareWhatsAppPin = (santri: Santri) => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const nisParam = santri.nis ? `&nis=${encodeURIComponent(santri.nis.trim())}` : '';
    const directUrl = `${baseUrl}?portal=wali${nisParam}&code=${encodeURIComponent(santri.accessPin || '1234')}`;
    const text = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\nYth. Bapak/Ibu Wali dari Ananda *${santri.name}* (Kelas: ${santri.class}${santri.nis ? `, NIS: ${santri.nis}` : ''}).\n\nBerikut data akses resmi untuk memantau poin kedisiplinan & prestasi ananda via Portal Orang Tua:\n🔗 *Link Langsung (Otomatis Masuk):*\n${directUrl}\n\nAtau buka: ${baseUrl}?portal=wali\n• *NIS Santri:* ${santri.nis || '(Belum terisi)'}\n• *Kode Akses Wali (PIN):* *${santri.accessPin || '1234'}*\n\nTerima kasih.\n_Bagian Kesiswaan & Wali Kelas_`
    );
    const phone = santri.parentPhone ? santri.parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Nama Santri wajib diisi.');
      return;
    }

    const existingPins = new Set(santriList.map(s => s.accessPin).filter(Boolean) as string[]);
    const created: Santri = {
      id: `s-${Date.now()}`,
      name: newName.trim(),
      class: newClass,
      nisn: newNisn.trim() || undefined,
      nis: newNis.trim() || undefined,
      parentName: newParentName.trim() || 'Orang Tua',
      parentPhone: newParentPhone.trim() || '081234567890',
      accessPin: generateVariedAccessPin(existingPins),
      organizationRole: newRole.trim() ? newRole.trim() : undefined,
      academicYear
    };

    onAddSantri(created);
    setIsAddModalOpen(false);

    // Reset form
    setNewName('');
    setNewNisn('');
    setNewNis('');
    setNewParentName('');
    setNewParentPhone('');
    setNewRole('');
    setIsCustomNewRole(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantri) return;
    if (onUpdateSantri) {
      onUpdateSantri(editingSantri);
    }
    setEditingSantri(null);
    alert('Data santri berhasil diperbarui!');
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleSantri) {
      onDeleteMultipleSantri(selectedIds);
      alert(`Berhasil menghapus ${selectedIds.length} data santri.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleDeleteSingleSantri = (santri: Santri) => {
    if (confirm(`Apakah Anda yakin ingin menghapus santri "${santri.name}" secara permanen?`)) {
      if (onDeleteMultipleSantri) {
        onDeleteMultipleSantri([santri.id]);
        setEditingSantri(null);
        setSelectedIds(prev => prev.filter(id => id !== santri.id));
        alert('Data santri berhasil dihapus.');
      }
    }
  };

  const selectedSantriObjects = santriList.filter(s => selectedIds.includes(s.id));

  return (
    <div className="space-y-5">
      {/* Search & Filter Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Title */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Direktori & Rapor Karakter Santri
            </h2>
            <p className="text-xs text-slate-500">
              Total {filteredSantri.length} Santri ditampilkan (Tahun Ajaran {academicYear})
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Select All Toggle Button */}
            <button
              onClick={toggleSelectAllFiltered}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                isAllFilteredSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-white" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllFilteredSelected
                  ? 'Batal Pilih Semua'
                  : `Pilih Semua (${filteredSantri.length})`}
              </span>
            </button>

            {/* Rekap & Bulk NIS / NISN Button */}
            <button
              onClick={() => setIsBulkNISNOpen(true)}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-indigo-200 shadow-sm cursor-pointer"
              title="Merekap, memperbaiki, menata ulang nomor NIS & NISN santri secara massal per kelas / Excel / Generator"
            >
              <Hash className="w-4 h-4 text-indigo-600" />
              <span>Rekap & Input NIS / NISN Massal</span>
            </button>

            {/* Bulk Import Button */}
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-emerald-200 shadow-sm cursor-pointer"
              title="Impor puluhan santri sekaligus dari Excel / Tabel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Impor Massal (Copas Excel)</span>
            </button>

            {/* Promote Class Button */}
            <button
              onClick={() => setIsPromoteOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-amber-200 shadow-sm cursor-pointer"
              title="Fitur Kenaikan Kelas (Naik Tingkat 7 -> 8 -> 9)"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Naik Kelas</span>
            </button>

            {/* Delete Graduated / Alumni Button */}
            <button
              onClick={() => setIsDeleteGraduatedOpen(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm cursor-pointer"
              title="Fitur pembersihan / hapus data santri lulusan & alumni secara massal"
            >
              <GraduationCap className="w-4 h-4 text-rose-600" />
              <span>Hapus Lulusan</span>
            </button>

            {/* Audit History Button */}
            {onOpenAuditModal && (
              <button
                onClick={() => onOpenAuditModal()}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-indigo-200 shadow-sm cursor-pointer"
                title="Lacak Audit Trail Perubahan Data Santri (Waktu, Nilai Lama, Nilai Baru, Pemicu)"
              >
                <History className="w-4 h-4 text-indigo-600" />
                <span>History Audit</span>
              </button>
            )}

            {/* Add Santri Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 border border-blue-600 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Santri</span>
            </button>
          </div>
        </div>

        {/* Prominent Search Bar & Quick Counters */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-blue-600 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Cepat: Ketik Nama Santri, NIS, NISN, Nama Orang Tua, atau Kelas (Cth: Ahmad, 7A)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-24 py-3 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all text-xs flex items-center gap-1 cursor-pointer"
                  title="Bersihkan Pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Clear</span>
                </button>
              )}
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {filteredSantri.length} Santri
              </span>
            </div>
          </div>

          {/* Secondary Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Class Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Semua Kelas ({santriList.length})</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>
                    {c.toLowerCase() === 'alumni' ? 'Alumni' : `Kelas ${c}`} ({santriList.filter(s => s.class === c).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Semua Status Disiplin</option>
                <option value="Teladan">Teladan (Poin Plus ≥ +50)</option>
                <option value="Baik">Baik (Poin Plus ≥ +15)</option>
                <option value="Aman">Aman (-24 s.d. +14)</option>
                <option value="Peringatan">Peringatan (-25 s.d. -49)</option>
                <option value="SP 1">SP 1 (-50 s.d. -74 atau 1x Berat)</option>
                <option value="SP 2">SP 2 (-75 s.d. -89 atau 2x Berat)</option>
                <option value="SP 3">SP 3 (-90 s.d. -99 atau 3x Berat)</option>
                <option value="Kritis">Kritis (&lt; -100 atau ≥4x Berat)</option>
              </select>
            </div>

            {/* Role / Jabatan Filter */}
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="ALL">Semua Jabatan Santri</option>
                <option value="HAS_ROLE">⭐ Semua Pengurus (OSIS &amp; Kelas)</option>
                <option value="OSIS">👑 Pengurus OSIS</option>
                <option value="Ketua OSIS">Ketua OSIS</option>
                <option value="Qism Ibadah">🕌 Qism Ibadah</option>
                <option value="Qism Amni">🛡️ Qism Amni (Keamanan)</option>
                <option value="Qism Lughoh">🗣️ Qism Lughoh (Bahasa)</option>
                <option value="Qism Nadzofah">✨ Qism Nadzofah (Kebersihan)</option>
                <option value="KELAS">📋 Pengurus Kelas</option>
                <option value="Ketua Kelas">Ketua Kelas</option>
                <option value="NO_ROLE">Santri Biasa (Tanpa Jabatan)</option>
              </select>
            </div>

            {/* Heavy Violation Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200 w-full hover:bg-rose-100 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyHeavy}
                  onChange={e => setOnlyHeavy(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 bg-white"
                />
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Hanya Pelanggaran Berat</span>
              </label>
            </div>
          </div>

          {/* Active Filter Indicator Tag */}
          {(searchTerm || classFilter !== 'ALL' || statusFilter !== 'ALL' || roleFilter !== 'ALL' || onlyHeavy) && (
            <div className="flex items-center justify-between gap-2 p-2 px-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-blue-950">Filter Aktif:</span>
                {searchTerm && (
                  <span className="bg-white text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-medium shadow-2xs">
                    Kata kunci: "{searchTerm}"
                  </span>
                )}
                {classFilter !== 'ALL' && (
                  <span className="bg-white text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-medium shadow-2xs">
                    Kelas: {classFilter}
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="bg-white text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200 font-medium shadow-2xs">
                    Status: {statusFilter}
                  </span>
                )}
                {roleFilter !== 'ALL' && (
                  <span className="bg-white text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 font-medium shadow-2xs">
                    Jabatan: {roleFilter === 'HAS_ROLE' ? 'Semua Pengurus' : roleFilter === 'NO_ROLE' ? 'Tanpa Jabatan' : roleFilter}
                  </span>
                )}
                {onlyHeavy && (
                  <span className="bg-white text-rose-800 px-2 py-0.5 rounded-lg border border-rose-200 font-medium shadow-2xs">
                    Hanya Pelanggaran Berat
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setClassFilter('ALL');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                  setOnlyHeavy(false);
                }}
                className="text-blue-700 hover:text-blue-900 underline text-[11px] font-bold shrink-0 cursor-pointer"
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Santri Cards Grid */}
      {filteredSantri.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 border-dashed rounded-3xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Data Santri Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Tidak ada santri yang cocok dengan kriteria pencarian atau filter yang Anda terapkan.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setClassFilter('ALL');
              setStatusFilter('ALL');
              setRoleFilter('ALL');
              setOnlyHeavy(false);
            }}
            className="mt-6 px-4 py-2 bg-blue-50 text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSantri.map(santri => {
            const isSelected = selectedIds.includes(santri.id);
            const stats = santriStatsMap.get(santri.id);
            const net = stats?.net ?? 0;
            const heavy = stats?.heavy ?? [];
            const status = stats?.status ?? 'Aman';
            const badgeStyle = getStatusBadgeStyle(status);

            return (
              <div
                key={santri.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40' : 'border-slate-200 hover:border-blue-200 hover:shadow-md'
                }`}
              >
                {/* Checkbox Overlay for Multi Selection */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={() => toggleSelectSantri(santri.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 border-rose-600 text-white shadow'
                        : 'bg-slate-50 border-slate-300 text-transparent hover:border-slate-400'
                    }`}
                    title={isSelected ? 'Batalkan pilihan' : 'Pilih santri ini'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

              {/* Header Info */}
              <div className="space-y-3 pr-7">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base border border-blue-200 shrink-0">
                      {santri.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {santri.name}
                        </h3>
                        <button
                          onClick={() => setEditingSantri(santri)}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Edit Kelas / Data / NISN Santri"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="font-bold text-blue-700 text-xs">Kelas {santri.class}</span>
                        <span className="text-slate-300 text-xs">&bull;</span>
                        {santri.nis ? (
                          <span
                            className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200"
                            title="Nomor Induk Santri (Sekolah)"
                          >
                            NIS: {santri.nis}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsBulkNISNOpen(true)}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                            title="NIS sekolah belum diisi. Klik untuk kelola massal"
                          >
                            NIS: Belum diisi
                          </button>
                        )}
                        <span className="text-slate-300 text-xs">&bull;</span>
                        {santri.nisn ? (
                          <span
                            className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200"
                            title="Nomor Induk Siswa Nasional (10 Digit)"
                          >
                            NISN: {santri.nisn}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsBulkNISNOpen(true)}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                            title="NISN nasional belum diisi. Klik untuk kelola massal"
                          >
                            NISN: Belum diisi
                          </button>
                        )}
                      </div>

                      {/* Organization Role Badge (OSIS / Ketua Kelas / Qism) */}
                      {santri.organizationRole ? (
                        <div className="mt-2 flex items-center">
                          <RoleBadge
                            role={santri.organizationRole}
                            size="sm"
                            onClick={() => setEditingSantri(santri)}
                          />
                        </div>
                      ) : (
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSantri(santri)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-amber-700 flex items-center gap-1 transition-colors group cursor-pointer"
                            title="Klik untuk menetapkan Jabatan OSIS / Ketua Kelas"
                          >
                            <Crown className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                            <span>+ Set Jabatan OSIS / Kelas</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shrink-0`}>
                    {status}
                  </span>
                </div>

                {/* Parent info */}
                <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Wali / Ortu:</span>
                    <span className="font-bold text-slate-800">{santri.parentName}</span>
                  </div>
                  {santri.parentPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">No. HP Wali:</span>
                      <span className="font-semibold text-slate-800">{santri.parentPhone}</span>
                    </div>
                  )}
                </div>

                {/* Points Summary */}
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-semibold">Poin Net TA {academicYear}</p>
                    <p className={`text-base font-black mt-0.5 ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {net > 0 ? `+${net}` : net}
                    </p>
                  </div>

                  <div className={`p-2 rounded-xl ${heavy.length > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-100'}`}>
                    <p className="text-[10px] text-slate-500 font-semibold">Pelanggaran Berat</p>
                    <p className={`text-base font-black mt-0.5 ${heavy.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {heavy.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyAccessPin(santri)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Salin data login PIN Wali untuk orang tua"
                  >
                    {copiedPinId === santri.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPinId === santri.id ? 'Tersalin!' : 'PIN'}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsAppPin(santri)}
                    className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    title="Kirim PIN Akses Portal via WhatsApp ke Wali"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenQuickInputForSantri(santri.id)}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Poin
                  </button>

                  <button
                    onClick={() => onSelectSantri(santri)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Rapor
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Floating Sticky Bottom Bar for Bulk Delete Action */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border-2 border-rose-300 shadow-2xl rounded-2xl p-3 sm:px-6 flex items-center justify-between gap-4 max-w-xl w-[92%] animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold border border-rose-200 shrink-0">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {selectedIds.length} Santri Terpilih
              </p>
              <p className="text-[10px] text-slate-500">Siap untuk dihapus massal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer"
            >
              Batal
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow border border-rose-600 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus ({selectedIds.length}) Santri</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Konfirmasi Hapus Massal Santri
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {selectedIds.length} Santri akan dihapus permanen
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-800">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Peringatan Penting:
              </p>
              <p className="text-[11px] text-slate-700">
                Tindakan ini tidak dapat dibatalkan. Data santri beserta riwayat poin dan laporan yang melekat akan dihapus secara menyeluruh.
              </p>
            </div>

            {/* List Preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Daftar Santri Yang Akan Dihapus:
              </label>
              <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 divide-y divide-slate-200 text-xs">
                {selectedSantriObjects.slice(0, 10).map((s, i) => (
                  <div key={s.id} className="pt-1 flex items-center justify-between text-slate-700">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {i + 1}. {s.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Kelas {s.class}</span>
                  </div>
                ))}
                {selectedSantriObjects.length > 10 && (
                  <p className="text-[10px] text-amber-700 font-bold pt-1.5 text-center">
                    ...dan {selectedSantriObjects.length - 10} santri lainnya
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow border border-rose-600 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus {selectedIds.length} Santri</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Santri Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Tambah Santri Baru
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  placeholder="Ahmad Zaki Syahputra"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kelas:</label>
                <input
                  type="text"
                  required
                  value={newClass}
                  onChange={e => setNewClass(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NISN (10 Digit):</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0081234567"
                    value={newNisn}
                    onChange={e => setNewNisn(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIS (Sekolah):</label>
                  <input
                    type="text"
                    placeholder="202607001"
                    value={newNis}
                    onChange={e => setNewNis(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Wali / Orang Tua:</label>
                <input
                  type="text"
                  placeholder="Bpk. Ridwan"
                  value={newParentName}
                  onChange={e => setNewParentName(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">No. WhatsApp Wali:</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={newParentPhone}
                  onChange={e => setNewParentPhone(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Amanah / Jabatan Santri Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Amanah / Jabatan Santri:</span>
                  </label>
                  {newRole && (
                    <RoleBadge role={newRole} size="sm" />
                  )}
                </div>

                <select
                  value={isCustomNewRole ? '__CUSTOM__' : (newRole || '')}
                  onChange={e => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomNewRole(true);
                    } else {
                      setIsCustomNewRole(false);
                      setNewRole(e.target.value);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Tanpa Jabatan Khusus (Santri Biasa) --</option>
                  {PRESET_ORGANIZATION_ROLES.map(cat => (
                    <optgroup key={cat.category} label={`━━ ${cat.category} ━━`}>
                      {cat.roles.map(r => (
                        <option key={r.title} value={r.title}>{r.title}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__CUSTOM__">✍️ Tulis Jabatan Kustom Sendiri...</option>
                </select>

                {isCustomNewRole && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Contoh: Anggota Qism Kesenian & Kaligrafi"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ketik nama jabatan/amanah khusus untuk santri ini.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Santri Modal */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Edit Data / Kelas Santri
              </h3>
              <button onClick={() => setEditingSantri(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Santri:</label>
                <input
                  type="text"
                  required
                  value={editingSantri.name}
                  onChange={e => setEditingSantri({ ...editingSantri, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kelas (Tingkat):</label>
                <input
                  type="text"
                  required
                  value={editingSantri.class}
                  onChange={e => setEditingSantri({ ...editingSantri, class: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NISN (10 Digit):</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0081234567"
                    value={editingSantri.nisn || ''}
                    onChange={e =>
                      setEditingSantri({
                        ...editingSantri,
                        nisn: e.target.value.replace(/\D/g, '')
                      })
                    }
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-indigo-800 font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIS (Sekolah):</label>
                  <input
                    type="text"
                    placeholder="202607001"
                    value={editingSantri.nis || ''}
                    onChange={e =>
                      setEditingSantri({
                        ...editingSantri,
                        nis: e.target.value
                      })
                    }
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Wali:</label>
                <input
                  type="text"
                  value={editingSantri.parentName}
                  onChange={e => setEditingSantri({ ...editingSantri, parentName: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold text-xs">PIN Portal Orang Tua (Kode Akses):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const existingPins = new Set(santriList.map(s => s.accessPin).filter(Boolean) as string[]);
                      const newPin = generateVariedAccessPin(existingPins);
                      setEditingSantri({ ...editingSantri, accessPin: newPin });
                    }}
                    className="text-[11px] text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors font-bold"
                    title="Buat PIN 6-digit acak baru yang unik dan tidak berurutan"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Acak PIN Baru</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editingSantri.accessPin || ''}
                  onChange={e => setEditingSantri({ ...editingSantri, accessPin: e.target.value })}
                  placeholder="Contoh: 849201"
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-amber-700 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Gunakan kode acak 6-digit variatif agar tidak mudah ditebak oleh orang lain.
                </p>
              </div>

              {/* Status SP / Disiplin Override */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Status SP & Disiplin (Aturan Kesiswaan):</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Edit status SP langsung</span>
                </label>
                <select
                  value={editingSantri.manualStatus || 'Otomatis'}
                  onChange={e => setEditingSantri({
                    ...editingSantri,
                    manualStatus: e.target.value === 'Otomatis' ? undefined : (e.target.value as any)
                  })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Otomatis">⚡ Otomatis (Sesuai Poin Santri)</option>
                  <option value="Aman">🟢 Aman</option>
                  <option value="Baik">✨ Baik</option>
                  <option value="Teladan">🏆 Teladan</option>
                  <option value="Peringatan">⚠️ Peringatan (-25 poin)</option>
                  <option value="SP 1">🔴 Surat Peringatan 1 (SP 1)</option>
                  <option value="SP 2">🚨 Surat Peringatan 2 (SP 2)</option>
                  <option value="SP 3">🔥 Surat Peringatan 3 (SP 3)</option>
                  <option value="Kritis">💥 Status Kritis / Tindakan Khusus</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  *Pilih salah satu status di atas jika Kesiswaan ingin menentukan SP secara manual melampaui poin otomatis.
                </p>
              </div>

              {/* Amanah / Jabatan Santri (OSIS, Qism, Ketua Kelas) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Amanah / Jabatan Santri (OSIS &amp; Kelas):</span>
                  </label>
                  {editingSantri.organizationRole && (
                    <div className="flex items-center gap-1.5">
                      <RoleBadge role={editingSantri.organizationRole} size="md" />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSantri({ ...editingSantri, organizationRole: undefined });
                          setIsCustomEditingRole(false);
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 underline font-bold px-1 cursor-pointer"
                        title="Hapus jabatan ini"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                <select
                  value={isCustomEditingRole ? '__CUSTOM__' : (editingSantri.organizationRole || '')}
                  onChange={e => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomEditingRole(true);
                    } else if (!e.target.value) {
                      setIsCustomEditingRole(false);
                      setEditingSantri({ ...editingSantri, organizationRole: undefined });
                    } else {
                      setIsCustomEditingRole(false);
                      setEditingSantri({ ...editingSantri, organizationRole: e.target.value });
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-amber-950 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Tanpa Jabatan Khusus (Santri Biasa) --</option>
                  {PRESET_ORGANIZATION_ROLES.map(cat => (
                    <optgroup key={cat.category} label={`━━ ${cat.category} ━━`}>
                      {cat.roles.map(r => (
                        <option key={r.title} value={r.title}>{r.title}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__CUSTOM__">✍️ Tulis Jabatan Kustom Sendiri...</option>
                </select>

                {isCustomEditingRole && (
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      placeholder="Contoh: Anggota Qism Kesenian & Kaligrafi"
                      value={editingSantri.organizationRole || ''}
                      onChange={e => setEditingSantri({ ...editingSantri, organizationRole: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Tuliskan nama jabatan / amanah spesifik yang diemban santri/siswa ini di Al Fajar Islamic School.
                    </p>
                  </div>
                )}

                <div className="p-2 rounded-lg bg-amber-100/60 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  💡 <strong>Informasi untuk Wali:</strong> Jabatan kepengurusan ini otomatis tampil di <em>Kartu Raport Santri</em> dan <em>Portal Wali Murid</em> sehingga orang tua dapat mengetahui amanah putra/putri mereka di sekolah.
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteSingleSantri(editingSantri)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Santri Ini</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSantri(null)}
                    className="px-3 py-1.5 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Copas Modal */}
      {onImportSantri && (
        <BulkImportSantriModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          academicYear={academicYear}
          onImportSantri={onImportSantri}
        />
      )}

      {/* Class Promotion Modal */}
      {onPromoteSantriClasses && (
        <PromoteClassModal
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          santriList={santriList}
          onPromoteSantriClasses={onPromoteSantriClasses}
        />
      )}

      {/* Bulk NISN & NIS Manager Modal */}
      <BulkNISNManagerModal
        isOpen={isBulkNISNOpen}
        onClose={() => setIsBulkNISNOpen(false)}
        santriList={santriList}
        onSaveBatch={updatedList => {
          if (onBatchUpdateSantri) {
            onBatchUpdateSantri(updatedList);
          } else if (onUpdateSantri) {
            updatedList.forEach(s => onUpdateSantri(s));
          }
        }}
      />

      {/* Delete Graduated / Alumni Modal */}
      <DeleteGraduatedModal
        isOpen={isDeleteGraduatedOpen}
        onClose={() => setIsDeleteGraduatedOpen(false)}
        santriList={santriList}
        onDeleteMultipleSantri={ids => {
          if (onDeleteMultipleSantri) {
            onDeleteMultipleSantri(ids);
          }
        }}
      />
    </div>
  );
};
