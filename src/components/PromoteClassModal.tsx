import React, { useState } from 'react';
import { Santri } from '../types';
import { TrendingUp, X, ArrowRight, CheckCircle2, AlertCircle, Users, Sparkles } from 'lucide-react';

interface PromoteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  onPromoteSantriClasses: (updatedSantriList: Santri[]) => void;
}

export const PromoteClassModal: React.FC<PromoteClassModalProps> = ({
  isOpen,
  onClose,
  santriList,
  onPromoteSantriClasses
}) => {
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');

  // Custom promotion form states
  const uniqueClasses = Array.from(new Set(santriList.map(s => s.class))).sort();
  const [selectedSourceClass, setSelectedSourceClass] = useState<string>(uniqueClasses[0] || '7 A');
  const [targetClassName, setTargetClassName] = useState<string>('8 A');
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);

  // Track if custom source class changes
  const santriInSourceClass = santriList.filter(s => s.class === selectedSourceClass);

  // Initialize selected santri IDs whenever source class changes
  React.useEffect(() => {
    setSelectedSantriIds(santriInSourceClass.map(s => s.id));
  }, [selectedSourceClass, santriList]);

  if (!isOpen) return null;

  // Helper function to auto promote a class string (e.g., "7 A" -> "8 A", "8 B" -> "9 B", "9" -> "10")
  const autoIncrementClass = (currentClass: string): string => {
    // Match numbers in class string
    return currentClass.replace(/(\d+)/g, (match) => {
      const num = parseInt(match, 10);
      if (num === 7) return '8';
      if (num === 8) return '9';
      if (num === 9) return '10';
      if (num === 10) return '11';
      if (num === 11) return '12';
      if (num === 12) return 'Alumni';
      return String(num + 1);
    });
  };

  // Preview automatic promotions
  const autoPromotionPreview = santriList.map(s => ({
    ...s,
    nextClass: autoIncrementClass(s.class)
  }));

  const handleExecuteAutoPromotion = () => {
    const confirmMsg = `Konfirmasi Kenaikan Kelas Otomatis:\nSeluruh santri akan dinaikkan kelasnya (Contoh: Kelas 7 -> Kelas 8, Kelas 8 -> Kelas 9, Kelas 9 -> Kelas 10). Lanjutkan?`;
    if (!window.confirm(confirmMsg)) return;

    const updated = santriList.map(s => ({
      ...s,
      class: autoIncrementClass(s.class)
    }));

    onPromoteSantriClasses(updated);
    alert('Berhasil menaikkan kelas seluruh santri secara otomatis!');
    onClose();
  };

  const handleExecuteCustomPromotion = () => {
    if (!targetClassName.trim()) {
      alert('Nama kelas tujuan tidak boleh kosong.');
      return;
    }

    if (selectedSantriIds.length === 0) {
      alert('Pilih minimal satu santri yang naik kelas.');
      return;
    }

    const updated = santriList.map(s => {
      if (selectedSantriIds.includes(s.id)) {
        return {
          ...s,
          class: targetClassName.trim()
        };
      }
      return s;
    });

    onPromoteSantriClasses(updated);
    alert(`Berhasil menaikkan ${selectedSantriIds.length} santri dari ${selectedSourceClass} ke ${targetClassName}!`);
    onClose();
  };

  const toggleSantriSelect = (id: string) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(i => i !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  const toggleSelectAllInClass = () => {
    if (selectedSantriIds.length === santriInSourceClass.length) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(santriInSourceClass.map(s => s.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Fitur Kenaikan Kelas Santri (Promosi Tingkat)
              </h3>
              <p className="text-xs text-gray-400">
                Ubah tingkat kelas santri untuk tahun ajaran baru (7 &rarr; 8, 8 &rarr; 9, 9 &rarr; 10)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[#111113] rounded-xl border border-white/5 shrink-0">
          <button
            onClick={() => setMode('auto')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'auto'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Kenaikan Kelas Serentak (Otomatis Semua)
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'custom'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            2. Kenaikan per Rombel / Kelas Khusus
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {mode === 'auto' ? (
            /* Mode 1: Auto Shift All */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-emerald-300">
                <span className="font-bold block text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mekanisme Kenaikan Kelas Serentak:
                </span>
                <p className="text-gray-300 leading-relaxed">
                  Sistem akan secara otomatis mendeteksi kelas santri dan menaikkannya 1 tingkat di seluruh angkatan:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-300 font-mono text-[11px]">
                  <li>Santri Kelas <strong>7 (TUJUH)</strong> &rarr; Naik ke Kelas <strong>8 (DELAPAN)</strong></li>
                  <li>Santri Kelas <strong>8 (DELAPAN)</strong> &rarr; Naik ke Kelas <strong>9 (SEMBILAN)</strong></li>
                  <li>Santri Kelas <strong>9 (SEMBILAN)</strong> &rarr; Naik ke Kelas <strong>10 (SEPULUH)</strong></li>
                  <li>Santri Kelas <strong>10 (SEPULUH)</strong> &rarr; Lulus / Tingkat Lanjut</li>
                </ul>
              </div>

              {/* Preview Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-[#0A0A0B]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161618] text-gray-400 sticky top-0 border-b border-white/10">
                    <tr>
                      <th className="p-2.5 font-bold">NIS</th>
                      <th className="p-2.5 font-bold">Nama Santri</th>
                      <th className="p-2.5 font-bold">Kelas Sekarang</th>
                      <th className="p-2.5 font-bold text-emerald-400">Kelas Baru (Setlah Kenaikan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {autoPromotionPreview.map(s => (
                      <tr key={s.id} className="hover:bg-white/5">
                        <td className="p-2.5 text-blue-400 font-bold">{s.nis}</td>
                        <td className="p-2.5 font-sans text-white">{s.name}</td>
                        <td className="p-2.5 font-sans">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-gray-300 font-bold">
                            {s.class}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans">
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-extrabold flex items-center gap-1.5 w-max">
                            <span>{s.class}</span>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span>{s.nextClass}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Mode 2: Custom Class Shift */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[#111113] border border-white/5 rounded-xl">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Pilih Kelas Asal Santri:
                  </label>
                  <select
                    value={selectedSourceClass}
                    onChange={e => setSelectedSourceClass(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {uniqueClasses.map(c => (
                      <option key={c} value={c}>Kelas {c} ({santriList.filter(s => s.class === c).length} Santri)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Ubah Menjadi Kelas Tujuan:
                  </label>
                  <input
                    type="text"
                    value={targetClassName}
                    onChange={e => setTargetClassName(e.target.value)}
                    placeholder="Contoh: 8 A"
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Santri Checklist Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-[#0A0A0B]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161618] text-gray-400 sticky top-0 border-b border-white/10">
                    <tr>
                      <th className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSantriIds.length === santriInSourceClass.length && santriInSourceClass.length > 0}
                          onChange={toggleSelectAllInClass}
                          className="rounded text-emerald-500 focus:ring-emerald-500 bg-[#0A0A0B]"
                        />
                      </th>
                      <th className="p-2.5 font-bold">NIS</th>
                      <th className="p-2.5 font-bold">Nama Santri</th>
                      <th className="p-2.5 font-bold text-emerald-400">Status Kenaikan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {santriInSourceClass.map(s => {
                      const isChecked = selectedSantriIds.includes(s.id);
                      return (
                        <tr key={s.id} className={isChecked ? 'bg-emerald-500/5' : 'opacity-40'}>
                          <td className="p-2.5 text-center font-sans">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSantriSelect(s.id)}
                              className="rounded text-emerald-500 focus:ring-emerald-500 bg-[#0A0A0B]"
                            />
                          </td>
                          <td className="p-2.5 text-blue-400 font-bold">{s.nis}</td>
                          <td className="p-2.5 font-sans font-medium text-white">{s.name}</td>
                          <td className="p-2.5 font-sans">
                            {isChecked ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span>{selectedSourceClass}</span>
                                <ArrowRight className="w-3 h-3 text-emerald-400" />
                                <span>{targetClassName}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">Tetap ({selectedSourceClass})</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-gray-400">
            Total {santriList.length} Santri terdaftar di sistem.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
            >
              Batal
            </button>

            {mode === 'auto' ? (
              <button
                type="button"
                onClick={handleExecuteAutoPromotion}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-400/30"
              >
                <TrendingUp className="w-4 h-4" />
                Jalankan Kenaikan Kelas All ({santriList.length} Santri)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteCustomPromotion}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-400/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Proses {selectedSantriIds.length} Santri Naik ke {targetClassName}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
