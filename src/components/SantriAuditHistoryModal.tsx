import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Calendar,
  Clock,
  Layers,
  Crown,
  Hash,
  Tag,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLog, Santri } from '../types';

interface SantriAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
  santriList: Santri[];
  preSelectedSantriId?: string;
}

export const SantriAuditHistoryModal: React.FC<SantriAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  santriList,
  preSelectedSantriId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [selectedSantriId, setSelectedSantriId] = useState<string>(preSelectedSantriId || 'ALL');

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Santri filter
      if (selectedSantriId !== 'ALL' && log.santriId !== selectedSantriId) {
        return false;
      }

      // Action filter
      if (actionFilter !== 'ALL' && log.actionType !== actionFilter) {
        return false;
      }

      // Field filter
      if (fieldFilter !== 'ALL') {
        const fieldNameLower = (log.fieldName || '').toLowerCase();
        if (fieldFilter === 'class' && !fieldNameLower.includes('kelas')) return false;
        if (fieldFilter === 'role' && !fieldNameLower.includes('jabatan') && !fieldNameLower.includes('osis') && !fieldNameLower.includes('role')) return false;
        if (fieldFilter === 'nis' && !fieldNameLower.includes('nis')) return false;
        if (fieldFilter === 'name' && !fieldNameLower.includes('nama')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = log.santriName.toLowerCase().includes(term);
        const matchesField = (log.fieldName || '').toLowerCase().includes(term);
        const matchesOld = (log.oldValue || '').toLowerCase().includes(term);
        const matchesNew = (log.newValue || '').toLowerCase().includes(term);
        const matchesBy = (log.performedBy || '').toLowerCase().includes(term);
        const matchesDetails = (log.details || '').toLowerCase().includes(term);

        if (!matchesName && !matchesField && !matchesOld && !matchesNew && !matchesBy && !matchesDetails) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, selectedSantriId, actionFilter, fieldFilter, searchTerm]);

  // Statistics
  const totalEvents = auditLogs.length;
  const uniqueSantriCount = new Set(auditLogs.map(l => l.santriId)).size;
  const classChangesCount = auditLogs.filter(l => (l.fieldName || '').toLowerCase().includes('kelas')).length;
  const roleChangesCount = auditLogs.filter(l => (l.fieldName || '').toLowerCase().includes('jabatan') || (l.fieldName || '').toLowerCase().includes('osis')).length;

  // Format date helper
  const formatDate = (isoString: string) => {
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

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log audit untuk diexport.');
      return;
    }

    const headers = ['Timestamp', 'Action', 'Santri ID', 'Nama Santri', 'Field Diubah', 'Nilai Lama', 'Nilai Baru', 'Oleh / Pemicu', 'Detail'];
    const rows = filteredLogs.map(l => [
      `"${formatDate(l.timestamp)}"`,
      `"${l.actionType}"`,
      `"${l.santriId}"`,
      `"${l.santriName.replace(/"/g, '""')}"`,
      `"${(l.fieldName || '-').replace(/"/g, '""')}"`,
      `"${(l.oldValue || '-').replace(/"/g, '""')}"`,
      `"${(l.newValue || '-').replace(/"/g, '""')}"`,
      `"${(l.performedBy || '-').replace(/"/g, '""')}"`,
      `"${(l.details || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_Santri_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  History Audit &amp; Riwayat Perubahan Data
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-extrabold uppercase">
                  Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Melacak secara presisi setiap perubahan data santri (Waktu, Field, Nilai Lama, Nilai Baru, &amp; Pemicu Perubahan)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Total Log Audit</p>
              <p className="text-base font-black text-slate-900">{totalEvents} Kejadian</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Santri Terpengaruh</p>
              <p className="text-base font-black text-slate-900">{uniqueSantriCount} Santri</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Perubahan Kelas</p>
              <p className="text-base font-black text-amber-600">{classChangesCount} Log</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-semibold">Perubahan Jabatan</p>
              <p className="text-base font-black text-emerald-600">{roleChangesCount} Log</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, field, nilai..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Filter Santri */}
            <div>
              <select
                value={selectedSantriId}
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Semua Santri ({santriList.length})</option>
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Kelas {s.class})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action */}
            <div>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Semua Tipe Aksi</option>
                <option value="UPDATE">UPDATE (Perubahan Single)</option>
                <option value="PROMOTE">PROMOTE (Naik Kelas)</option>
                <option value="CREATE">CREATE (Tambah Santri)</option>
                <option value="IMPORT">IMPORT (Impor Excel)</option>
                <option value="RESTORE">RESTORE (Pemulihan Data)</option>
                <option value="DELETE">DELETE (Hapus Santri)</option>
              </select>
            </div>

            {/* Filter Field */}
            <div>
              <select
                value={fieldFilter}
                onChange={e => setFieldFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Semua Field Diubah</option>
                <option value="class">Perubahan Kelas</option>
                <option value="role">Perubahan Jabatan / OSIS</option>
                <option value="nis">Perubahan NIS / NISN</option>
                <option value="name">Perubahan Nama</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-900">{filteredLogs.length}</strong> dari {auditLogs.length} riwayat log audit
            </span>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Unduh laporan audit lengkap ke format CSV Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Laporan Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Audit Log Content List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-100/50">
          {filteredLogs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Belum Ada Log Audit Perubahan</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                {searchTerm || actionFilter !== 'ALL' || fieldFilter !== 'ALL' || selectedSantriId !== 'ALL'
                  ? 'Tidak ditemukan log audit yang cocok dengan kriteria pencarian/filter di atas.'
                  : 'Sistem audit aktif. Setiap ada perubahan kelas, NIS, atau jabatan santri di kemudian hari, riwayatnya akan tercatat di sini secara otomatis.'}
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isUpdate = log.actionType === 'UPDATE';
              const isPromote = log.actionType === 'PROMOTE';
              const isCreate = log.actionType === 'CREATE';
              const isDelete = log.actionType === 'DELETE';
              const isImport = log.actionType === 'IMPORT';

              return (
                <div
                  key={log.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  {/* Top Row: Timestamp & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-700">{formatDate(log.timestamp)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Action Type Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border flex items-center gap-1 ${
                          isPromote
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isCreate
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDelete
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isImport
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isPromote ? (
                          <Layers className="w-3 h-3" />
                        ) : isCreate ? (
                          <Plus className="w-3 h-3" />
                        ) : isDelete ? (
                          <Trash2 className="w-3 h-3" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {log.actionType}
                      </span>

                      {/* Field Pill */}
                      {log.fieldName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                          {log.fieldName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Row: Santri Name & Field Value Changes */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Santri Info */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{log.santriName}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">({log.santriId})</span>
                      </h4>
                      {log.details && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug font-medium">
                          {log.details}
                        </p>
                      )}
                    </div>

                    {/* Value Diff Block */}
                    {(log.oldValue || log.newValue) && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-3 text-xs shrink-0 self-start md:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Sebelumnya</span>
                          <span className="font-medium text-slate-600 line-through bg-slate-200/60 px-2 py-0.5 rounded">
                            {log.oldValue || '-'}
                          </span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />

                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Sesudahnya</span>
                          <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded border border-emerald-300">
                            {log.newValue || '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Row: Performed By */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      Pemicu / Oleh: <strong className="text-slate-800">{log.performedBy || 'Admin Kesiswaan'}</strong>
                    </span>

                    <span className="text-slate-400 font-mono text-[10px]">Log ID: {log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Audit trail tersimpan aman dan terenkripsi di database Cloud Firestore
          </p>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
