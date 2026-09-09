import React, { useState, useMemo } from 'react';
import { AuditLog, Santri } from '../types';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  User,
  Layers,
  Crown,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface AuditLogsDashboardTableProps {
  auditLogs: AuditLog[];
  santriList: Santri[];
  onSelectSantri?: (santri: Santri) => void;
  onOpenFullAuditModal?: (santriId?: string) => void;
}

export const AuditLogsDashboardTable: React.FC<AuditLogsDashboardTableProps> = ({
  auditLogs,
  santriList,
  onSelectSantri,
  onOpenFullAuditModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Map santri by id for fast lookups
  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach(s => map.set(s.id, s));
    return map;
  }, [santriList]);

  // Unique classes for filtering
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.class))).filter(Boolean).sort();
  }, [santriList]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const classChanges = auditLogs.filter(l =>
      (l.fieldName || '').toLowerCase().includes('kelas') || l.actionType === 'PROMOTE'
    ).length;
    const roleChanges = auditLogs.filter(l =>
      (l.fieldName || '').toLowerCase().includes('jabatan') ||
      (l.fieldName || '').toLowerCase().includes('osis') ||
      (l.fieldName || '').toLowerCase().includes('role')
    ).length;
    const nisChanges = auditLogs.filter(l =>
      (l.fieldName || '').toLowerCase().includes('nis')
    ).length;

    // Changes today
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayChanges = auditLogs.filter(l => (l.timestamp || '').startsWith(todayStr)).length;

    return {
      total,
      classChanges,
      roleChanges,
      nisChanges,
      todayChanges
    };
  }, [auditLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Action filter
      if (actionFilter !== 'ALL' && log.actionType !== actionFilter) {
        return false;
      }

      // Field filter
      if (fieldFilter !== 'ALL') {
        const fieldNameLower = (log.fieldName || '').toLowerCase();
        if (fieldFilter === 'class' && !fieldNameLower.includes('kelas') && log.actionType !== 'PROMOTE') {
          return false;
        }
        if (
          fieldFilter === 'role' &&
          !fieldNameLower.includes('jabatan') &&
          !fieldNameLower.includes('osis') &&
          !fieldNameLower.includes('role')
        ) {
          return false;
        }
        if (fieldFilter === 'nis' && !fieldNameLower.includes('nis')) {
          return false;
        }
        if (fieldFilter === 'status' && !fieldNameLower.includes('status')) {
          return false;
        }
      }

      // Class filter based on current santri state or log content
      if (classFilter !== 'ALL') {
        const currentSantri = santriMap.get(log.santriId);
        const logClass = currentSantri?.class || '';
        const oldClass = log.oldValue || '';
        const newClass = log.newValue || '';
        if (
          logClass !== classFilter &&
          !oldClass.includes(classFilter) &&
          !newClass.includes(classFilter)
        ) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const santriName = (log.santriName || '').toLowerCase();
        const santriId = (log.santriId || '').toLowerCase();
        const fieldName = (log.fieldName || '').toLowerCase();
        const oldValue = (log.oldValue || '').toLowerCase();
        const newValue = (log.newValue || '').toLowerCase();
        const performedBy = (log.performedBy || '').toLowerCase();
        const details = (log.details || '').toLowerCase();

        const currentSantri = santriMap.get(log.santriId);
        const currentNis = (currentSantri?.nis || '').toLowerCase();

        if (
          !santriName.includes(q) &&
          !santriId.includes(q) &&
          !fieldName.includes(q) &&
          !oldValue.includes(q) &&
          !newValue.includes(q) &&
          !performedBy.includes(q) &&
          !details.includes(q) &&
          !currentNis.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, actionFilter, fieldFilter, classFilter, searchTerm, santriMap]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  // Handle page reset if search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, fieldFilter, classFilter, rowsPerPage]);

  // Date format helper
  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      if (diffHour < 24) return `${diffHour} jam lalu`;
      if (diffDay === 1) return 'Kemarin';
      if (diffDay < 7) return `${diffDay} hr lalu`;
      return '';
    } catch {
      return '';
    }
  };

  // Action badge style helper
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return {
          label: 'TAMBAH',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'UPDATE':
        return {
          label: 'UBAH DATA',
          bg: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'PROMOTE':
        return {
          label: 'NAIK KELAS',
          bg: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'BATCH_UPDATE':
        return {
          label: 'MASSAL',
          bg: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'DELETE':
        return {
          label: 'HAPUS',
          bg: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'RESTORE':
        return {
          label: 'PULIHKAN',
          bg: 'bg-teal-50 text-teal-700 border-teal-200'
        };
      default:
        return {
          label: action,
          bg: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log perubahan yang dapat diekspor.');
      return;
    }

    const headers = [
      'Waktu',
      'Aksi',
      'Nama Santri',
      'NIS Santri',
      'Kelas Saat Ini',
      'Bagian / Field',
      'Nilai Sebelum',
      'Nilai Sesudah',
      'Diubah Oleh',
      'Detail Keterangan'
    ];

    const rows = filteredLogs.map(l => {
      const s = santriMap.get(l.santriId);
      return [
        `"${formatTimestamp(l.timestamp)}"`,
        `"${l.actionType}"`,
        `"${(l.santriName || '').replace(/"/g, '""')}"`,
        `"${(s?.nis || '-').replace(/"/g, '""')}"`,
        `"${(s?.class || '-').replace(/"/g, '""')}"`,
        `"${(l.fieldName || '-').replace(/"/g, '""')}"`,
        `"${(l.oldValue || '-').replace(/"/g, '""')}"`,
        `"${(l.newValue || '-').replace(/"/g, '""')}"`,
        `"${(l.performedBy || '-').replace(/"/g, '""')}"`,
        `"${(l.details || '-').replace(/"/g, '""')}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Audit_Log_Perubahan_Santri_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Table Header with Title & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  Tabel Riwayat Perubahan Data Santri (Audit Logs)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-Time Firestore
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigasi siapa dan kapan data santri (kelas, nama, NIS, status, jabatan) diubah untuk mencegah dan melacak data yang berubah secara tak sengaja.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Ekspor seluruh baris terfilter ke format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          {onOpenFullAuditModal && (
            <button
              onClick={() => onOpenFullAuditModal()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Buka dialog pencarian audit lengkap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Investigasi Penuh</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Metric Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Log Tercatat</p>
            <p className="text-lg font-black text-slate-900">{stats.total} Kejadian</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Perubahan Kelas</p>
            <p className="text-lg font-black text-blue-600">{stats.classChanges} Log</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Perubahan Jabatan (OSIS)</p>
            <p className="text-lg font-black text-emerald-600">{stats.roleChanges} Log</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600">
            <Crown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Aktivitas Hari Ini</p>
            <p className="text-lg font-black text-purple-600">{stats.todayChanges} Baru</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari santri, NIS, field, atau aktor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Jenis Aksi</option>
              <option value="UPDATE">Ubah Data (UPDATE)</option>
              <option value="CREATE">Santri Baru (CREATE)</option>
              <option value="PROMOTE">Kenaikan Kelas (PROMOTE)</option>
              <option value="BATCH_UPDATE">Update Massal (BATCH)</option>
              <option value="DELETE">Penghapusan (DELETE)</option>
              <option value="RESTORE">Pemulihan (RESTORE)</option>
            </select>
          </div>

          {/* Field Filter */}
          <div>
            <select
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kolom / Field</option>
              <option value="class">Perubahan Kelas Saja</option>
              <option value="role">Perubahan Jabatan (OSIS)</option>
              <option value="nis">Perubahan NIS / NISN</option>
              <option value="status">Perubahan Status Disiplin</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kelas ({uniqueClasses.length} Kelas)</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchTerm || actionFilter !== 'ALL' || fieldFilter !== 'ALL' || classFilter !== 'ALL') && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-slate-500 font-medium">Filter aktif:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px]">
                Kata kunci: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-blue-950 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            )}
            {actionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px]">
                Aksi: {actionFilter}
                <button
                  onClick={() => setActionFilter('ALL')}
                  className="hover:text-blue-950 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            )}
            {fieldFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px]">
                Field: {fieldFilter}
                <button
                  onClick={() => setFieldFilter('ALL')}
                  className="hover:text-blue-950 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            )}
            {classFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px]">
                Kelas: {classFilter}
                <button
                  onClick={() => setClassFilter('ALL')}
                  className="hover:text-blue-950 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('ALL');
                setFieldFilter('ALL');
                setClassFilter('ALL');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline ml-auto cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">Waktu & Tanggal</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Aktor (Diubah Oleh)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Santri Terkait</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Jenis Aksi</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Bagian / Field</th>
              <th className="py-3 px-3.5 whitespace-nowrap min-w-[200px]">Perubahan Data (Sebelum &rarr; Sesudah)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Keterangan / Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">
                      {auditLogs.length === 0
                        ? 'Belum ada log riwayat perubahan data.'
                        : 'Tidak ada riwayat perubahan data yang sesuai dengan filter pencarian.'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md">
                      Setiap kali data santri (seperti pemindahan kelas, penggantian nama, NIS, status, atau jabatan) diubah melalui aplikasi, pencatatan otomatis dilakukan secara instan di sini.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map(log => {
                const badge = getActionBadge(log.actionType);
                const currentSantri = santriMap.get(log.santriId);
                const relTime = getRelativeTime(log.timestamp);

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      {relTime && (
                        <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {relTime}
                        </div>
                      )}
                    </td>

                    {/* Performed By (Actor) */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[11px]">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[150px]">{log.performedBy || 'Admin Kesiswaan'}</span>
                      </div>
                    </td>

                    {/* Santri */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{log.santriName}</span>
                        {currentSantri?.organizationRole && (
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                            {currentSantri.organizationRole}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {currentSantri?.nis ? `NIS: ${currentSantri.nis} • ` : ''}Kelas {currentSantri?.class || '-'}
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Field Name */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {log.fieldName || 'Data Santri'}
                      </span>
                    </td>

                    {/* Before & After Values */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.oldValue !== undefined && log.oldValue !== null && (
                          <span className="line-through text-slate-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium max-w-[180px] truncate" title={log.oldValue}>
                            {log.oldValue || '(Kosong)'}
                          </span>
                        )}

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[11px] max-w-[180px] truncate" title={log.newValue}>
                          {log.newValue || '(Kosong)'}
                        </span>
                      </div>
                    </td>

                    {/* Detail & Quick Inspect */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.details && (
                          <span className="text-[11px] text-slate-500 max-w-[160px] truncate block" title={log.details}>
                            {log.details}
                          </span>
                        )}

                        {currentSantri && onSelectSantri && (
                          <button
                            onClick={() => onSelectSantri(currentSantri)}
                            className="p-1 px-2 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-md transition-colors flex items-center gap-1 border border-blue-200 cursor-pointer"
                            title="Buka detail rapor karakter santri"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Menampilkan</span>
          <select
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="py-1 px-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
          >
            <option value={5}>5 baris</option>
            <option value={10}>10 baris</option>
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
          </select>
          <span>dari <strong>{filteredLogs.length}</strong> riwayat perubahan</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
