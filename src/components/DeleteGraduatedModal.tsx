import React, { useState, useMemo } from 'react';
import { Santri } from '../types';
import { Trash2, X, GraduationCap, AlertTriangle, CheckSquare, Square, Search, Filter } from 'lucide-react';

interface DeleteGraduatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  onDeleteMultipleSantri: (santriIds: string[]) => void;
}

export const DeleteGraduatedModal: React.FC<DeleteGraduatedModalProps> = ({
  isOpen,
  onClose,
  santriList,
  onDeleteMultipleSantri
}) => {
  if (!isOpen) return null;

  // Selected class filter for target alumni / graduates
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(santriList.map(s => s.class))).sort();
  }, [santriList]);

  // Identify default graduated/alumni classes
  const defaultGraduatedClasses = useMemo(() => {
    return uniqueClasses.filter(c => {
      const lower = c.toLowerCase().trim();
      return (
        lower.includes('alumni') ||
        lower.includes('lulus') ||
        lower.includes('tamatan') ||
        lower === '12' ||
        lower === '13'
      );
    });
  }, [uniqueClasses]);

  // Selected target classes to delete
  const [targetClasses, setTargetClasses] = useState<string[]>(
    defaultGraduatedClasses.length > 0 ? defaultGraduatedClasses : (uniqueClasses.length > 0 ? [uniqueClasses[uniqueClasses.length - 1]] : [])
  );

  const [searchFilter, setSearchFilter] = useState('');

  // Candidates for deletion based on targetClasses or explicit manualStatus === 'Lulus'
  const candidateSantri = useMemo(() => {
    const term = searchFilter.toLowerCase().trim();
    return santriList.filter(s => {
      const clsLower = s.class.toLowerCase().trim();
      const statusLower = (s.manualStatus || '').toLowerCase();
      
      const isTargetClass = targetClasses.includes(s.class) ||
        clsLower.includes('alumni') ||
        clsLower.includes('lulus') ||
        statusLower === 'lulus' ||
        statusLower === 'alumni';

      if (!isTargetClass) return false;

      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.class.toLowerCase().includes(term) ||
        (s.nis && s.nis.toLowerCase().includes(term)) ||
        (s.nisn && s.nisn.toLowerCase().includes(term))
      );
    });
  }, [santriList, targetClasses, searchFilter]);

  // Selection state among candidates
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);

  // Keep selectedSantriIds updated whenever candidateSantri changes
  React.useEffect(() => {
    setSelectedSantriIds(candidateSantri.map(s => s.id));
  }, [candidateSantri]);

  const toggleClassTarget = (clsName: string) => {
    if (targetClasses.includes(clsName)) {
      setTargetClasses(targetClasses.filter(c => c !== clsName));
    } else {
      setTargetClasses([...targetClasses, clsName]);
    }
  };

  const toggleSelectSantri = (id: string) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(i => i !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedSantriIds.length === candidateSantri.length) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(candidateSantri.map(s => s.id));
    }
  };

  const handleExecuteDelete = () => {
    if (selectedSantriIds.length === 0) {
      alert('Pilih minimal satu santri lulusan untuk dihapus.');
      return;
    }

    const confirmMsg = `Peringatan Penghapusan Santri Lulusan:\n\nApakah Anda yakin ingin menghapus ${selectedSantriIds.length} data santri lulusan secara permanen?\n\nCatatan: Tindakan ini akan dicatat dalam History Audit data santri.`;
    
    if (window.confirm(confirmMsg)) {
      onDeleteMultipleSantri(selectedSantriIds);
      alert(`Berhasil menghapus ${selectedSantriIds.length} data santri lulusan.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/40 via-red-950/20 to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Hapus Santri Lulusan / Alumni
              </h3>
              <p className="text-xs text-rose-300/80">
                Pembersihan data alumni & santri yang telah menyelesaikan pendidikan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300 text-xs">
                Perhatian Pembersihan Data Santri Lulusan
              </p>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                Gunakan fitur ini untuk menghapus data santri berstatus <strong>Alumni / Lulus</strong> agar direktori santri aktif tetap ringkas. Semua riwayat penghapusan akan tersimpan otomatis di <strong>History Audit</strong>.
              </p>
            </div>
          </div>

          {/* Target Class Selection Pills */}
          <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-rose-400" />
                Pilih Kelas Target Lulusan / Alumni:
              </label>
              <span className="text-[11px] text-gray-400">
                Klik kelas untuk memilih/membatalkan
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {uniqueClasses.map(clsName => {
                const isSelected = targetClasses.includes(clsName);
                const isGrad =
                  clsName.toLowerCase().includes('alumni') ||
                  clsName.toLowerCase().includes('lulus') ||
                  clsName === '12';

                return (
                  <button
                    key={clsName}
                    type="button"
                    onClick={() => toggleClassTarget(clsName)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : isGrad
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>Kelas {clsName}</span>
                    {isGrad && <span className="text-[9px] bg-rose-500/30 px-1 rounded text-rose-200">Lulusan</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Select All Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari santri lulusan dalam daftar..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={candidateSantri.length === 0}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {selectedSantriIds.length === candidateSantri.length && candidateSantri.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-rose-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>Pilih Semua ({candidateSantri.length})</span>
            </button>
          </div>

          {/* Candidate Santri List Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40 max-h-60 overflow-y-auto">
            {candidateSantri.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <GraduationCap className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="font-semibold">Tidak Ada Santri Lulusan Terdeteksi</p>
                <p className="text-[11px] text-gray-500">
                  Tidak ditemukan santri pada kelas/filter yang dipilih. Pilih opsi kelas di atas jika ingin menentukan kelas tertentu.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-white/10">
                  <tr>
                    <th className="p-2.5 text-center w-10">Pilih</th>
                    <th className="p-2.5">Nama Santri</th>
                    <th className="p-2.5">Kelas</th>
                    <th className="p-2.5">NIS / NISN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {candidateSantri.map(s => {
                    const isChecked = selectedSantriIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => toggleSelectSantri(s.id)}
                        className={`hover:bg-rose-500/10 transition-colors cursor-pointer ${
                          isChecked ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectSantri(s.id)}
                            className="rounded border-gray-600 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-white">{s.name}</td>
                        <td className="p-2.5 font-mono text-rose-300">Kelas {s.class}</td>
                        <td className="p-2.5 text-gray-400 font-mono text-[11px]">
                          {s.nis || s.nisn || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-xs text-gray-400 font-medium">
            Terpilih: <strong className="text-rose-400 font-bold">{selectedSantriIds.length}</strong> dari {candidateSantri.length} Santri Lulusan
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={selectedSantriIds.length === 0}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus ({selectedSantriIds.length}) Santri Lulusan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
