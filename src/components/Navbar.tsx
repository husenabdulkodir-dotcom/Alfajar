import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  PlusCircle,
  BookOpen,
  BarChart3,
  RefreshCw,
  Eye,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Link2,
  Lock,
  ShieldCheck,
  HeartHandshake,
  Server,
  Database,
  LogOut,
  WalletCards,
  History
} from 'lucide-react';

interface NavbarProps {
  currentMode: 'kesiswaan' | 'parent' | 'walikelas';
  setCurrentMode: (mode: 'kesiswaan' | 'parent' | 'walikelas') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  academicYear: string;
  onOpenQuickInput: () => void;
  onOpenYearReset: () => void;
  isParentOnly?: boolean;
  isWaliKelasOnly?: boolean;
  onOpenSharePortalModal?: () => void;
  onOpenQuotaModal?: () => void;
  onOpenEkskulClaimsModal?: () => void;
  onOpenAuditModal?: () => void;
  pendingClaimsCount?: number;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  setCurrentMode,
  activeTab,
  setActiveTab,
  academicYear,
  onOpenQuickInput,
  onOpenYearReset,
  isParentOnly = false,
  isWaliKelasOnly = false,
  onOpenSharePortalModal,
  onOpenQuotaModal,
  onOpenEkskulClaimsModal,
  onOpenAuditModal,
  pendingClaimsCount = 0,
  onLogout
}) => {
  const [saveTime, setSaveTime] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const handleSaved = (e: any) => {
      if (isMounted && e.detail?.timestamp) {
        setSaveTime(e.detail.timestamp);
      }
    };
    window.addEventListener('sistem_poin_data_saved', handleSaved);
    return () => {
      isMounted = false;
      window.removeEventListener('sistem_poin_data_saved', handleSaved);
    };
  }, []);

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm border shrink-0 ${
            isWaliKelasOnly || currentMode === 'walikelas'
              ? 'bg-emerald-600 border-emerald-500'
              : 'bg-blue-600 border-blue-500'
          }`}>
            {isWaliKelasOnly || currentMode === 'walikelas' ? (
              <Users className="w-5 h-5 text-white" />
            ) : isParentOnly ? (
              <Lock className="w-5 h-5 text-white" />
            ) : (
              <Award className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-2">
              AL FAJAR <span className="text-blue-600 font-black">ISLAMIC SCHOOL</span>
              {isWaliKelasOnly || currentMode === 'walikelas' ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Portal Wali Kelas
                </span>
              ) : isParentOnly ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Portal Khusus Orang Tua / Wali
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Real-Time
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-[11px] font-medium">
              {isWaliKelasOnly || currentMode === 'walikelas'
                ? 'Portal Distribusi Akses & Kirim Japri ke Orang Tua Siswa'
                : isParentOnly
                ? 'Layanan Informasi & Pemantauan Prestasi Siswa Terenkripsi'
                : 'Sistem Kedisiplinan & Bimbingan Konseling Siswa'}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Auto-Save & Cloud Sync Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
            title="Database Cloud Active: Data tersinkronisasi otomatis secara real-time antara Laptop dan HP"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Cloud Sync Aktif{saveTime ? ` (${saveTime})` : ''}</span>
          </div>

          {/* Academic Year Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700 border border-slate-200">
            <span className="text-slate-500">Tahun Ajaran:</span>
            <strong className="text-blue-700 font-bold">{academicYear}</strong>
          </div>

          {/* If NOT in Standalone Parent or Standalone Wali Kelas mode, show Mode Selector Toggle */}
          {!isParentOnly && !isWaliKelasOnly ? (
            <>
              {/* Share Dedicated Parent Portal Link Button (Kesiswaan Mode Only) */}
              {currentMode === 'kesiswaan' && onOpenSharePortalModal && (
                <button
                  type="button"
                  onClick={onOpenSharePortalModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-sm"
                  title="Bagikan link portal wali santri atau portal wali kelas"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bagi Link Portal</span>
                </button>
              )}

              {/* Konfirmasi Bayar Ekskul Button (Kesiswaan Mode Only) */}
              {currentMode === 'kesiswaan' && onOpenEkskulClaimsModal && (
                <button
                  type="button"
                  onClick={onOpenEkskulClaimsModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-sm relative ${
                    pendingClaimsCount > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 font-extrabold animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  }`}
                  title="Lihat & Verifikasi konfirmasi pembayaran iuran ekskul dari wali santri"
                >
                  <WalletCards className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="hidden sm:inline">Konfirmasi Ekskul</span>
                  {pendingClaimsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                      {pendingClaimsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Server & DB Quota Monitor Button (Kesiswaan Mode Only) */}
              {currentMode === 'kesiswaan' && onOpenQuotaModal && (
                <button
                  type="button"
                  onClick={onOpenQuotaModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
                  title="Lihat sisa kuota harian & kapasitas server Firestore (Reads, Writes, Deletes, Storage, Egress)"
                >
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Kuota Server</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                </button>
              )}

              {/* Mode Selector Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setCurrentMode('kesiswaan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentMode === 'kesiswaan'
                      ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Kesiswaan</span>
                </button>
                <button
                  onClick={() => setCurrentMode('walikelas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentMode === 'walikelas'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Wali Kelas</span>
                </button>
                <button
                  onClick={() => setCurrentMode('parent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentMode === 'parent'
                      ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Wali Santri</span>
                </button>
              </div>

              {/* Quick Point Input & Audit Buttons (Kesiswaan Mode Only) */}
              {currentMode === 'kesiswaan' && (
                <>
                  {onOpenAuditModal && (
                    <button
                      onClick={onOpenAuditModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all shadow-sm border border-indigo-200 active:scale-95 cursor-pointer"
                      title="Buka History Audit Trail Perubahan Data"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden md:inline">History Audit</span>
                    </button>
                  )}
                  <button
                    onClick={onOpenQuickInput}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm border border-blue-600 active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Catat Poin
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl transition-all shadow-sm border border-red-200 active:scale-95 cursor-pointer"
                      title="Keluar dari Portal Kesiswaan"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span className="hidden sm:inline">Keluar</span>
                    </button>
                  )}
                </>
              )}
            </>
          ) : isWaliKelasOnly ? (
            /* When in Dedicated Wali-Kelas-Only Link Mode */
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Akses Wali Kelas Terverifikasi
              </span>
            </div>
          ) : (
            /* When in Dedicated Parent-Only Link Mode */
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Akses Terproteksi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar (Kesiswaan Mode Only and NOT Parent-Only) */}
      {!isParentOnly && currentMode === 'kesiswaan' && (
        <div className="bg-slate-50/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-blue-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Dashboard Utama
            </button>

            <button
              onClick={() => setActiveTab('santri')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'santri'
                  ? 'text-blue-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              Data & Rapor Santri
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-blue-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600" />
              Pelacakan Riwayat (Real-Time)
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'rules'
                  ? 'text-blue-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              Katalog Aturan & Poin
            </button>

            <button
              onClick={() => setActiveTab('recaps')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'recaps'
                  ? 'text-blue-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Rekapan (Bulan, Semester, Tahun)
            </button>

            <button
              onClick={() => setActiveTab('bk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bk'
                  ? 'text-purple-700 bg-white font-bold shadow-sm border border-slate-200'
                  : 'text-purple-700/80 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-purple-600" />
              <span>Bimbingan Konseling (BK)</span>
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">AI</span>
            </button>

            <div className="ml-auto flex items-center gap-2 pl-4">
              {onOpenQuotaModal && (
                <button
                  onClick={onOpenQuotaModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm"
                  title="Pantau sisa kuota harian Reads, Writes, Deletes, Storage, dan Egress (Khusus Kesiswaan)"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sisa Kuota DB</span>
                </button>
              )}

              <button
                onClick={onOpenYearReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm"
                title="Sistem Reset Poin Tahunan (Melindungi Pelanggaran Berat)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Tahunan
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
