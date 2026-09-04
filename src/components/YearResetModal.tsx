import React, { useState } from 'react';
import { Santri, PointRecord, AnnualResetLog } from '../types';
import { getHeavyViolations } from '../utils/helpers';
import { RefreshCw, ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface YearResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAcademicYear: string;
  santriList: Santri[];
  records: PointRecord[];
  onExecuteReset: (newAcademicYear: string, resetLog: AnnualResetLog) => void;
}

export const YearResetModal: React.FC<YearResetModalProps> = ({
  isOpen,
  onClose,
  currentAcademicYear,
  santriList,
  records,
  onExecuteReset
}) => {
  if (!isOpen) return null;

  const [nextYearInput, setNextYearInput] = useState('2027/2028');
  const [confirmText, setConfirmText] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Count total heavy violations preserved
  const totalHeavyPreserved = records.filter(r => r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation)).length;

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toUpperCase() !== 'RESET') {
      alert('Ketik kata "RESET" untuk mengonfirmasi proses ini.');
      return;
    }

    const resetLog: AnnualResetLog = {
      id: `log-${Date.now()}`,
      resetDate: new Date().toISOString().split('T')[0],
      fromAcademicYear: currentAcademicYear,
      toAcademicYear: nextYearInput.trim(),
      totalSantriReset: santriList.length,
      preservedHeavyViolationsCount: totalHeavyPreserved,
      performedBy: 'Ust. Fathir (Kesiswaan)'
    };

    onExecuteReset(nextYearInput.trim(), resetLog);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              Reset Poin Tahun Ajaran Baru
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {resetSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-base text-white">
              Reset Tahun Ajaran Berhasil!
            </h4>
            <p className="text-xs text-gray-400">
              Sistem telah mengupdate Tahun Ajaran menjadi <strong>{nextYearInput}</strong>. Poin rutin telah di-reset ke 0, dan seluruh catatan Pelanggaran Berat tetap tersimpan utuh.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Aturan & Atribut Reset Poin Tahunan:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-200/80 leading-relaxed text-[11px]">
                <li>Poin Plus (Prestasi) & Pelanggaran Biasa (Ringan/Sedang) akan di-reset ke <strong>0 Poin Baseline</strong> untuk tahun ajaran baru.</li>
                <li className="font-extrabold text-rose-400">
                  POIN PELANGGARAN BERAT TIDAK DI-RESET! Semua {totalHeavyPreserved} catatan Pelanggaran Berat tetap tersimpan secara PERMANEN di riwayat santri.
                </li>
                <li>Data rekapitulasi tahun ajaran lama ({currentAcademicYear}) tetap tersimpan di arsip laporan.</li>
              </ul>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Tahun Ajaran Baru yang Dimulai:
              </label>
              <input
                type="text"
                required
                value={nextYearInput}
                onChange={e => setNextYearInput(e.target.value)}
                placeholder="2027/2028"
                className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Konfirmasi Pembatalan/Reset (Ketik &quot;RESET&quot;):
              </label>
              <input
                type="text"
                required
                placeholder="RESET"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white font-mono text-center font-extrabold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-gray-400 hover:text-white font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={confirmText.toUpperCase() !== 'RESET'}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow border border-amber-400/30 disabled:opacity-50"
              >
                Jalankan Reset Tahunan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
