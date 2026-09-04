import React, { useState, useEffect, useMemo } from 'react';
import { Santri, PointRecord, BKCounselingNote, EkskulRecord, EkskulPaymentClaim } from '../types';
import {
  calculatePositivePoints,
  calculateNegativePoints,
  calculateNetPoints,
  getHeavyViolations,
  determineSantriStatus,
  getStatusBadgeStyle,
  formatDateIndonesian
} from '../utils/helpers';
import { isSantriEkskulMatch } from '../utils/ekskulMatcher';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Printer,
  KeyRound,
  ArrowRight,
  LogOut,
  HelpCircle,
  Phone,
  Lock,
  Info,
  Users,
  ChevronDown,
  ChevronUp,
  Hash,
  Sparkles,
  Share2,
  RefreshCw,
  ExternalLink,
  Crown,
  HeartHandshake,
  BookOpen,
  Activity,
  WalletCards,
  Medal,
  SendHorizontal
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { ParentGuideModal } from './ParentGuideModal';
import { EkskulPaymentBreakdown } from './EkskulPaymentBreakdown';
import { EkskulPaymentConfirmModal } from './EkskulPaymentConfirmModal';

interface ParentPortalProps {
  santriList: Santri[];
  records: PointRecord[];
  academicYear: string;
  onConfirmRecordByParent: (recordId: string, parentNote: string) => void;
  bkNotes?: BKCounselingNote[];
  ekskulRecords?: EkskulRecord[];
  ekskulClaims?: EkskulPaymentClaim[];
  onSubmitEkskulClaim?: (claim: EkskulPaymentClaim) => void;
  isParentOnly?: boolean;
}

const STORAGE_SESSION_KEY = 'sistem_poin_authenticated_parent_santri_id';

export const ParentPortal: React.FC<ParentPortalProps> = ({
  santriList,
  records,
  academicYear,
  onConfirmRecordByParent,
  bkNotes = [],
  ekskulRecords = [],
  ekskulClaims = [],
  onSubmitEkskulClaim,
  isParentOnly = false
}) => {
  // Authentication & Session States
  const [loginMethod, setLoginMethod] = useState<'nis' | 'pin'>('nis');
  const [credentialInput, setCredentialInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Authenticated Data (strictly isolated to the logged-in parent's child/children)
  const [authenticatedSantriIds, setAuthenticatedSantriIds] = useState<string[]>([]);
  const [activeSantriId, setActiveSantriId] = useState<string | null>(null);

  // UI Interactive States
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = useState(false);
  const [selectedEkskulForConfirm, setSelectedEkskulForConfirm] = useState<EkskulRecord | null>(null);
  const [defaultMonthForConfirm, setDefaultMonthForConfirm] = useState<string>('2026-09');
  const [recordFilter, setRecordFilter] = useState<'ALL' | 'Pelanggaran' | 'Kebaikan' | 'Heavy'>('ALL');
  const [parentNoteInput, setParentNoteInput] = useState<{ [recordId: string]: string }>({});
  const [confirmingRecordId, setConfirmingRecordId] = useState<string | null>(null);
  const [confirmationSuccessMsg, setConfirmationSuccessMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Restore session from localStorage or URL parameters (either nis OR code/pin)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let urlNis = urlParams.get('nis') || urlParams.get('santri_nis');
      let urlCode = urlParams.get('code') || urlParams.get('pin') || urlParams.get('access_code') || urlParams.get('token');

      // Also check hash in case router or fragment is used
      if ((!urlNis && !urlCode) && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr.includes('?') ? hashStr.split('?')[1] : hashStr);
        if (!urlNis) urlNis = hashParams.get('nis') || hashParams.get('santri_nis');
        if (!urlCode) urlCode = hashParams.get('code') || hashParams.get('pin') || hashParams.get('access_code');
      }

      // 1. Auto-login if NIS is provided in URL
      if (urlNis && urlNis.trim()) {
        const cleanNis = urlNis.trim().toLowerCase();
        setCredentialInput(urlNis.trim());
        setLoginMethod('nis');
        const matched = santriList.filter(s => {
          return (s.nis && s.nis.trim().toLowerCase() === cleanNis) ||
                 (s.nisn && s.nisn.trim().toLowerCase() === cleanNis);
        });

        if (matched.length > 0) {
          const matchedIds = matched.map(s => s.id);
          setAuthenticatedSantriIds(matchedIds);
          setActiveSantriId(matchedIds[0]);
          try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(matchedIds));
          } catch (e) {
            console.warn('Storage error:', e);
          }
          return;
        }
      }

      // 2. Auto-login if Kode Akses (PIN) is provided in URL
      if (urlCode && urlCode.trim()) {
        const cleanCode = urlCode.trim().toLowerCase();
        setCredentialInput(urlCode.trim());
        setLoginMethod('pin');
        const matched = santriList.filter(s => {
          return s.accessPin && s.accessPin.trim().toLowerCase() === cleanCode;
        });

        if (matched.length > 0) {
          const matchedIds = matched.map(s => s.id);
          setAuthenticatedSantriIds(matchedIds);
          setActiveSantriId(matchedIds[0]);
          try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(matchedIds));
          } catch (e) {
            console.warn('Storage error:', e);
          }
          return;
        }
      }

      // 3. Otherwise restore previous verified session from localStorage
      const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify that the santri still exists in current dataset
          const validIds = parsed.filter(id => santriList.some(s => s.id === id));
          if (validIds.length > 0) {
            setAuthenticatedSantriIds(validIds);
            setActiveSantriId(validIds[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore parent session:', e);
    }
  }, [santriList]);

  // Handle Login submission with EITHER NIS OR Kode Akses (PIN)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmed = credentialInput.trim();
    if (!trimmed) {
      setAuthError(
        loginMethod === 'nis'
          ? 'Silakan masukkan Nomor Induk Santri (NIS) ananda.'
          : 'Silakan masukkan Kode Akses Wali (PIN) ananda.'
      );
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      const clean = trimmed.toLowerCase();
      let matched: Santri[] = [];

      if (loginMethod === 'nis') {
        // Search by NIS / NISN
        matched = santriList.filter(s => {
          const matchNis = s.nis && s.nis.trim().toLowerCase() === clean;
          const matchNisn = s.nisn && s.nisn.trim().toLowerCase() === clean;
          return matchNis || matchNisn;
        });

        // Smart fallback: if user typed their PIN into the NIS box
        if (matched.length === 0) {
          matched = santriList.filter(
            s => s.accessPin && s.accessPin.trim().toLowerCase() === clean
          );
        }
      } else {
        // Search by Access PIN
        matched = santriList.filter(
          s => s.accessPin && s.accessPin.trim().toLowerCase() === clean
        );

        // Smart fallback: if user typed their NIS into the PIN box
        if (matched.length === 0) {
          matched = santriList.filter(s => {
            const matchNis = s.nis && s.nis.trim().toLowerCase() === clean;
            const matchNisn = s.nisn && s.nisn.trim().toLowerCase() === clean;
            return matchNis || matchNisn;
          });
        }
      }

      if (matched.length > 0) {
        const matchedIds = matched.map(s => s.id);
        setAuthenticatedSantriIds(matchedIds);
        setActiveSantriId(matchedIds[0]);
        setAuthError('');

        if (rememberSession) {
          try {
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(matchedIds));
          } catch (err) {
            console.warn('Storage error:', err);
          }
        }
      } else {
        if (loginMethod === 'nis') {
          setAuthError(
            `Nomor Induk Santri (NIS) "${trimmed}" tidak ditemukan dalam sistem. Pastikan nomor induk sudah sesuai atau gunakan opsi Kode Akses (PIN).`
          );
        } else {
          setAuthError(
            `Kode Akses Wali (PIN) "${trimmed}" tidak ditemukan atau salah. Silakan periksa kembali atau gunakan opsi NIS Santri.`
          );
        }
      }
      setIsAuthenticating(false);
    }, 200);
  };

  // Handle Logout
  const handleLogout = () => {
    setAuthenticatedSantriIds([]);
    setActiveSantriId(null);
    setCredentialInput('');
    setAuthError('');
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  // Get active santri object (strictly from authenticated IDs)
  const myChildren = useMemo(() => {
    return santriList.filter(s => authenticatedSantriIds.includes(s.id));
  }, [santriList, authenticatedSantriIds]);

  const activeSantri = useMemo(() => {
    return myChildren.find(s => s.id === activeSantriId) || myChildren[0] || null;
  }, [myChildren, activeSantriId]);

  // Points & Status Computations (Unconditional Hooks for React Rules of Hooks)
  const totalPlus = useMemo(() => activeSantri ? calculatePositivePoints(activeSantri.id, records, academicYear) : 0, [activeSantri, records, academicYear]);
  const totalMinus = useMemo(() => activeSantri ? calculateNegativePoints(activeSantri.id, records, academicYear) : 0, [activeSantri, records, academicYear]);
  const netPoints = useMemo(() => activeSantri ? calculateNetPoints(activeSantri.id, records, academicYear) : 0, [activeSantri, records, academicYear]);
  const heavyViolations = useMemo(() => activeSantri ? getHeavyViolations(activeSantri.id, records) : [], [activeSantri, records]);
  const status = useMemo(() => activeSantri ? determineSantriStatus(netPoints, heavyViolations.length, activeSantri.manualStatus) : 'Aman', [activeSantri, netPoints, heavyViolations.length]);
  const badgeStyle = useMemo(() => getStatusBadgeStyle(status), [status]);

  // Filter records strictly for this santri (Memoized)
  const santriRecords = useMemo(() => activeSantri ? records.filter(r => r.santriId === activeSantri.id) : [], [records, activeSantri]);
  const santriBKNotes = useMemo(() => activeSantri ? (bkNotes || []).filter(n => n.santriId === activeSantri.id) : [], [bkNotes, activeSantri]);
  
  // Real Ekskul Data from Cloud (Matched by ID, NIS/NISN, or Student Name via smart matcher)
  const santriEkskulRecords = useMemo(() => activeSantri ? (ekskulRecords || []).filter(e => isSantriEkskulMatch(e, activeSantri)) : [], [ekskulRecords, activeSantri]);

  const filteredRecords = useMemo(() => {
    return santriRecords.filter(r => {
      if (recordFilter === 'ALL') return true;
      if (recordFilter === 'Pelanggaran') return r.type === 'Pelanggaran';
      if (recordFilter === 'Kebaikan') return r.type === 'Kebaikan';
      if (recordFilter === 'Heavy') return r.isHeavyViolation || r.category === 'Berat';
      return true;
    });
  }, [santriRecords, recordFilter]);

  // Handle Refresh Data
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // ----------------------------------------------------------------------------------
  // VIEW 1: LOGIN SCREEN (NIS & KODE AKSES WALI)
  // ----------------------------------------------------------------------------------
  if (!activeSantri) {
    return (
      <>
      <div className="max-w-xl mx-auto py-6 sm:py-12 px-3 sm:px-4 space-y-6 animate-fadeIn">
        
        {/* Main Portal Login Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          {/* Subtle Top Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full" />

          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1.5">
                Portal Resmi Wali Santri
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Portal Wali Santri
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                Cukup gunakan <strong>salah satu</strong> metode: Nomor Induk Santri (NIS) <em>atau</em> Kode Akses Wali (PIN).
              </p>
            </div>
          </div>

          {/* Method Selector Tabs: NIS vs KODE AKSES */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('nis');
                setAuthError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginMethod === 'nis'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Hash className="w-4 h-4 text-cyan-600" />
              <span>Gunakan NIS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('pin');
                setAuthError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginMethod === 'pin'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Gunakan Kode PIN</span>
            </button>
          </div>

          {/* Single-Method Input Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            
            {loginMethod === 'nis' ? (
              /* Method 1: NIS (Nomor Induk Santri) */
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700">
                  Nomor Induk Santri (NIS):
                </label>
                <div className="relative flex items-center">
                  <Hash className="w-5 h-5 text-cyan-600 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={30}
                    placeholder="Ketik NIS Santri (Contoh: 202607001)"
                    value={credentialInput}
                    onChange={e => {
                      setCredentialInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    className="w-full pl-11 pr-4 py-3 text-sm sm:text-base font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Nomor Induk siswa/santri sesuai kartu santri atau buku rapor.</span>
                </div>
              </div>
            ) : (
              /* Method 2: Kode Akses Wali (PIN) */
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Kode Akses Wali Santri (PIN):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFaqOpen(!isFaqOpen)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Bantuan Kode Akses
                  </button>
                </div>

                <div className="relative flex items-center">
                  <KeyRound className="w-5 h-5 text-amber-600 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={20}
                    placeholder="Ketik Kode Akses / PIN (Contoh: 849201)"
                    value={credentialInput}
                    onChange={e => {
                      setCredentialInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    className="w-full pl-11 pr-12 py-3 text-sm sm:text-base font-mono font-bold tracking-widest rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kode Akses khusus yang dibagikan oleh Wali Kelas Ananda.
                </p>
              </div>
            )}

            {/* Remember Me Option & Mode Switcher */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={e => setRememberSession(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod(loginMethod === 'nis' ? 'pin' : 'nis');
                  setAuthError('');
                }}
                className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold cursor-pointer"
              >
                {loginMethod === 'nis' ? 'Atau gunakan PIN Wali?' : 'Atau gunakan NIS Santri?'}
              </button>
            </div>

            {/* Error Message Box */}
            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Gagal Masuk:</strong> {authError}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-blue-600 cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? (
                <span>Memverifikasi Akses...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Buka Rapor & Catatan Poin Ananda
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bantuan & Kontak Kesiswaan Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Bantuan & Layanan Wali Santri (Kesiswaan)
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Apabila Bapak/Ibu kendala atau belum mengetahui NIS / Kode Akses Wali (PIN) Ananda, silakan hubungi <strong>Bagian Kesiswaan</strong>:
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    WA Kesiswaan: 0895-3204-61884
                  </span>
                </div>
              </div>

              <a
                href="https://wa.me/62895320461884?text=Assalamu%27alaikum%20Bagian%20Kesiswaan%2C%20saya%20Wali%20Santri%20ingin%20menanyakan%20informasi%20akses%20Portal%20Wali%20Santri."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-emerald-600 shrink-0 cursor-pointer self-start sm:self-center"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>Hubungi WA Kesiswaan</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
            
            <div className="pt-3 border-t border-emerald-200 mt-4">
               <button
                 type="button"
                 onClick={() => setIsGuideModalOpen(true)}
                 className="w-full py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-emerald-300 shadow-sm"
               >
                 <Printer className="w-4 h-4" />
                 Cetak Brosur Panduan UI Portal
               </button>
            </div>
          </div>

          {/* Technical Guide Accordion: Panduan Kode Akses Wali */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <button
              type="button"
              onClick={() => setIsFaqOpen(!isFaqOpen)}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Panduan: Cara Masuk Portal Wali Santri
                </span>
              </div>
              {isFaqOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isFaqOpen && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    1. Pilih Salah Satu (NIS atau Kode Akses)
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed pl-5">
                    Bapak/Ibu cukup memasukkan <strong>salah satu saja</strong>: Nomor Induk Santri (NIS) ananda <em>atau</em> Kode Akses Wali (PIN). Tidak diperlukan pengisian keduanya secara bersamaan.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    2. Di Mana Menemukan NIS & Kode Akses?
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed pl-5">
                    NIS tertera pada kartu pelajar atau buku rapor santri. Kode Akses (PIN) dibagikan secara resmi oleh Wali Kelas masing-masing melalui pesan WhatsApp atau kartu slip kredensial.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-amber-600" />
                    3. Bantuan Jika Belum Mengetahui NIS / PIN
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed pl-5">
                    Silakan hubungi <strong>Wali Kelas Ananda</strong> atau <strong>Bagian Kesiswaan (WA: 0895-3204-61884)</strong> untuk menanyakan NIS atau meminta Kode Akses resmi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isGuideModalOpen && <ParentGuideModal onClose={() => setIsGuideModalOpen(false)} />}
    </>
  );
}

  // ----------------------------------------------------------------------------------
  // VIEW 2: AUTHENTICATED PARENT PORTAL (RESTRICTED ONLY TO LOGGED-IN SANTRI)
  // ----------------------------------------------------------------------------------

  // Handle Parent Confirmation
  const handleConfirmRecord = (recordId: string) => {
    const note = parentNoteInput[recordId] || 'Telah dibaca dan dipahami oleh Wali Santri.';
    setConfirmingRecordId(recordId);

    setTimeout(() => {
      onConfirmRecordByParent(recordId, note);
      setConfirmingRecordId(null);
      setConfirmationSuccessMsg('Konfirmasi Anda berhasil dicatat dan tersinkronisasi ke Kesiswaan.');
      setTimeout(() => setConfirmationSuccessMsg(null), 3000);
    }, 200);
  };

  // Generate WhatsApp Share Message for Family
  const handleShareSummaryFamily = () => {
    const roleText = activeSantri.organizationRole ? `\n*Amanah Kepemimpinan:* ${activeSantri.organizationRole}` : '';
    const ekskulSummary = santriEkskulRecords.length > 0
      ? `\n*Ekstrakurikuler:* ${santriEkskulRecords.map(e => `${e.ekskulName} (${e.isPaid ? 'Lunas Sep 2026' : 'Tagihan Sep 2026'})`).join(', ')}`
      : '';
    const portalUrl = `${window.location.origin}${window.location.pathname}?nis=${activeSantri.nis || ''}&tab=portal`;

    const text = `*LAPORAN POIN DISIPLIN & PRESTASI SANTRI*\n*Nama:* ${activeSantri.name}\n*Kelas:* ${activeSantri.class} ${activeSantri.nis ? `(NIS: ${activeSantri.nis})` : ''}${roleText}\n*Tahun Ajaran:* ${academicYear}\n\n*Status Kedisiplinan:* ${status}\n• Poin Prestasi: +${totalPlus}\n• Poin Pelanggaran: -${totalMinus}\n• Net Poin: ${netPoints >= 0 ? `+${netPoints}` : netPoints}\n• Pelanggaran Berat: ${heavyViolations.length} Kasus${ekskulSummary}\n\n🔗 *Buka Portal Resmi:* ${portalUrl}\n_Dipantau melalui Portal Resmi Wali Santri_`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Security & Session Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700">
                Sesi Terverifikasi (NIS & Kode Akses)
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-600">
              Wali Terdaftar: <strong className="text-slate-900">{activeSantri.parentName || 'Orang Tua'}</strong> {activeSantri.parentPhone ? `(${activeSantri.parentPhone})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* If the parent has multiple children registered */}
          {myChildren.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <select
                value={activeSantri.id}
                onChange={e => setActiveSantriId(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {myChildren.map(child => (
                  <option key={child.id} value={child.id}>
                    Pilih Anak: {child.name} ({child.class})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Segarkan data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Secure Logout Button */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            title="Keluar dari sesi portal orang tua"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar / Ganti Akun
          </button>
        </div>
      </div>

      {/* Main Student Report Card Header */}
      <div className="bg-white text-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
        {/* Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-xs border border-blue-600 shrink-0">
              {activeSantri.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeSantri.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                  Kelas {activeSantri.class}
                </span>
                {activeSantri.organizationRole && (
                  <RoleBadge role={activeSantri.organizationRole} size="md" />
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {activeSantri.nis ? (
                  <>NIS: <span className="font-mono font-bold text-cyan-700">{activeSantri.nis}</span> &bull; </>
                ) : null}
                {activeSantri.nisn ? (
                  <>NISN: <span className="font-mono font-bold text-indigo-700">{activeSantri.nisn}</span> &bull; </>
                ) : null}
                Tahun Ajaran Aktif: <strong className="text-slate-900">{academicYear}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Status Keamanan: Terenkripsi & terisolasi khusus untuk Wali Santri yang sah.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="text-left md:text-right bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full sm:w-auto">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status Kedisiplinan Terkini:</p>
              <div className="mt-1">
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border inline-block ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                  {status}
                </span>
              </div>
              <p className="text-[10px] text-blue-700 mt-1 font-semibold">Evaluasi Real-Time Kesiswaan</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShareSummaryFamily}
                className="flex-1 sm:flex-none p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Bagikan ringkasan laporan ananda via WhatsApp ke keluarga"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-none p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Cetak atau simpan rapor poin ini sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leadership & Organization Role Highlight Banner */}
        {activeSantri.organizationRole && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-900">
                  Amanah Kepemimpinan Santri:
                </span>
                <RoleBadge role={activeSantri.organizationRole} size="sm" />
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Ananda mengemban amanah sebagai <strong className="text-amber-950">{activeSantri.organizationRole}</strong> di Al Fajar Islamic School untuk melatih kepemimpinan, kepedulian, dan tanggung jawab dakwah.
              </p>
            </div>
          </div>
        )}

        {/* 4 Scorecard Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-3 border-t border-slate-100">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <p className="text-[10px] font-bold uppercase text-emerald-800">Poin Prestasi / Plus</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">+{totalPlus}</p>
          </div>

          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
            <p className="text-[10px] font-bold uppercase text-rose-800">Pelanggaran Biasa</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">-{totalMinus}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-600">Net Poin Tahun Ini</p>
            <p className={`text-2xl font-black mt-0.5 ${netPoints >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netPoints > 0 ? `+${netPoints}` : netPoints}
            </p>
          </div>

          <div className={`p-3 rounded-2xl border ${heavyViolations.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase text-rose-800">Pelanggaran Berat</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{heavyViolations.length} Kasus</p>
          </div>
        </div>
      </div>

      {/* Heavy Violations Notice Banner (if any) */}
      {heavyViolations.length > 0 && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            Catatan Penting Wali: Terdapat Rekam Jejak Pelanggaran Berat
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Poin pelanggaran kategori berat bersifat <strong>PERMANEN</strong> dan menjadi bahan pertimbangan sidang disiplin dewan asatidz / guru. Mohon sinergi dan komunikasi berkala dengan pihak sekolah Al Fajar Islamic School untuk pendampingan ananda.
          </p>

          <div className="space-y-2 pt-1">
            {heavyViolations.map(hv => (
              <div key={hv.id} className="p-3.5 bg-white border border-rose-200 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <p className="font-bold text-rose-900 text-sm">{hv.title}</p>
                  <p className="text-xs text-slate-700 mt-0.5">
                    <strong>Tindakan / Sanksi:</strong> {hv.punishmentOrReward}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tanggal: {formatDateIndonesian(hv.date)} &bull; Pencatat: Ust. {hv.recordedBy}
                  </p>
                </div>
                <span className="font-black px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs self-start sm:self-auto shrink-0 shadow-xs">
                  {hv.points} Poin
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bimbingan & Pendampingan Karakter Santri (Khusus Wali Santri - Strict Privacy) */}
      {santriBKNotes.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  Bimbingan & Pendampingan Karakter Santri
                </h3>
                <p className="text-xs text-slate-500">
                  Ringkasan pendampingan berkala bersama Guru Bimbingan Konseling (BK) & Wali Kelas
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              Laporan Ramah Wali &bull; Al Fajar Islamic School
            </span>
          </div>

          {/* 3 Mandated Components for Parent View */}
          <div className="space-y-4 pt-1">
            {santriBKNotes.map((note) => {
              const pv = note.aiAnalysis?.parentView;
              const progressStatus = pv?.progressStatus || (note.status === 'Selesai' ? 'Selesai & Adaptasi Baik' : note.urgencyLevel === 'Tinggi' ? 'Perlu Kolaborasi Ortu' : 'Progres Berjalan Positif');
              const developmentSummary = pv?.developmentSummary || note.aiAnalysis?.evaluationReportSnippet || 'Ananda senantiasa menunjukkan ikhtiar perbaikan dan keikutsertaan aktif dalam program pembinaan karakter serta kedisiplinan di sekolah.';
              const tips = pv?.homeAssistanceTips || [
                'Memberikan apresiasi dan afirmasi positif atas setiap pencapaian santri.',
                'Menjaga dialog hangat serta mengingatkan komitmen kedisiplinan dan ibadah di rumah.',
                'Mempertahankan komunikasi terbuka bersama Wali Kelas dan Guru BK.'
              ];

              return (
                <div key={note.id} className="p-4 sm:p-5 rounded-2xl bg-purple-50/30 border border-purple-200 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      Periode: Semester {note.semester} ({note.academicYear})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateIndonesian(note.counselingDate)}
                    </span>
                  </div>

                  {/* 1. Status Progres */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-600">1. Status Progres:</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 shadow-xs">
                      {progressStatus}
                    </span>
                  </div>

                  {/* 2. Ringkasan Perkembangan */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Ringkasan Perkembangan Ananda:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {developmentSummary}
                    </p>
                  </div>

                  {/* 3. Saran Pendampingan di Rumah */}
                  {tips && tips.length > 0 && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" /> 3. Rekomendasi Pendampingan Orang Tua di Rumah:
                      </span>
                      <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
                        {tips.map((tip, idx) => (
                          <li key={idx} className="leading-relaxed">{tip}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Laporan Ekstrakurikuler & Aktivitas Tambahan (Mockup) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Laporan Ekstrakurikuler & Aktivitas Tambahan
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Cloud
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi perkembangan minat, bakat, dan administrasi ekskul.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 self-start sm:self-auto">
            {academicYear} &bull; Semester Ganjil
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-1">
          {santriEkskulRecords.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              Belum ada data kegiatan ekstrakurikuler yang terdaftar untuk ananda saat ini.
            </div>
          ) : (
            santriEkskulRecords.map((ekskul) => {
              const isPaid = ekskul.isPaid;
              const statusColor = isPaid ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200';
              const statusDot = isPaid ? 'bg-emerald-500' : 'bg-rose-500';
              const nameLower = ekskul.ekskulName.toLowerCase();
              const icon = nameLower.includes('pramuka') || nameLower.includes('tapak') 
                ? <Medal className="w-5 h-5 text-amber-600" /> 
                : <Activity className="w-5 h-5 text-blue-600" />;

              return (
                <div key={ekskul.id} className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Top Club Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-slate-900">{ekskul.ekskulName}</h4>
                          {ekskul.category && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                              {ekskul.category}
                            </span>
                          )}
                        </div>
                        {ekskul.day && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ekskul.day}{ekskul.time ? ` • ${ekskul.time}` : ''}{ekskul.location ? ` • ${ekskul.location}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-2 self-start sm:self-auto shadow-xs ${statusColor}`}>
                      <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                      Status Saat Ini: {ekskul.paymentStatus}
                    </div>
                  </div>

                  {/* Attendance & Coach Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {ekskul.attendanceRate !== undefined && (
                      <div className="p-3 rounded-2xl bg-white border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tingkat Kehadiran</span>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                          {ekskul.attendanceRate}%
                          {ekskul.totalSessions ? (
                            <span className="text-xs text-slate-500 font-normal">
                              ({ekskul.attendedSessions || 0}/{ekskul.totalSessions} sesi)
                            </span>
                          ) : null}
                        </span>
                      </div>
                    )}

                    {ekskul.coachName && (
                      <div className="p-3 rounded-2xl bg-white border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Pembina / Pelatih</span>
                        <span className="font-bold text-slate-800 text-sm truncate mt-0.5" title={ekskul.coachName}>
                          {ekskul.coachName}
                        </span>
                      </div>
                    )}

                    {ekskul.supervisorName && (
                      <div className="p-3 rounded-2xl bg-white border border-slate-100 flex flex-col justify-center sm:col-span-2 md:col-span-1">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Koordinator Kesiswaan</span>
                        <span className="font-bold text-slate-800 text-sm truncate mt-0.5" title={ekskul.supervisorName}>
                          {ekskul.supervisorName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Monthly Payment Breakdown (Bulan Ini, Bulan Sebelumnya, & Agustus - Juni) */}
                  <EkskulPaymentBreakdown
                    ekskul={ekskul}
                    defaultExpanded={true}
                    onOpenConfirmPayment={(e, mKey) => {
                      setSelectedEkskulForConfirm(e);
                      setDefaultMonthForConfirm(mKey || '2026-09');
                      setIsPaymentConfirmModalOpen(true);
                    }}
                    existingClaims={ekskulClaims}
                  />

                  {ekskul.coachNote && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-700 leading-relaxed italic border-l-2 border-blue-400 pl-3">
                        &quot;{ekskul.coachNote}&quot;
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Success Alert */}
      {confirmationSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {confirmationSuccessMsg}
        </div>
      )}

      {/* Real-Time Feed of Records & Parent Confirmation */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Riwayat Catatan Poin Ananda (Real-Time Feed)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap catatan poin yang dimasukkan kesiswaan akan tampil di sini secara langsung.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setRecordFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  recordFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({santriRecords.length})
              </button>
              <button
                onClick={() => setRecordFilter('Kebaikan')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  recordFilter === 'Kebaikan' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Prestasi
              </button>
              <button
                onClick={() => setRecordFilter('Pelanggaran')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  recordFilter === 'Pelanggaran' ? 'bg-white text-rose-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pelanggaran
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak rapor karakter ananda"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* Empty Records State */}
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
            <Award className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada catatan poin untuk filter yang dipilih.
            </p>
            <p className="text-xs text-slate-500">
              Catatan perilaku dan prestasi ananda akan otomatis muncul setelah diinput oleh Asatidz Kesiswaan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map(record => {
              const isPlus = record.type === 'Kebaikan';
              const isHeavy = record.isHeavyViolation || record.category === 'Berat';

              return (
                <div
                  key={record.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 bg-white transition-all shadow-xs ${
                    isHeavy
                      ? 'border-rose-300 bg-rose-50/20'
                      : isPlus
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPlus
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isHeavy
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          [{record.category}] {record.type}
                        </span>
                        <span className="text-slate-500 font-mono text-xs">
                          {formatDateIndonesian(record.date)}
                        </span>
                        <span className="text-slate-500 text-xs">
                          &bull; Ust. {record.recordedBy}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        {record.title}
                      </h4>

                      <p className="text-xs text-slate-700">
                        <strong className="text-slate-500">
                          {isPlus ? 'Apresiasi / Penghargaan:' : 'Tindakan Sanksi:'}
                        </strong>{' '}
                        {record.punishmentOrReward || '-'}
                      </p>

                      {record.notes && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          &ldquo;{record.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-base sm:text-lg font-black px-3.5 py-1.5 rounded-xl shrink-0 ${
                        isPlus
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isHeavy
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPlus ? `+${record.points}` : `${record.points}`} Poin
                    </span>
                  </div>

                  {/* Parent Confirmation Card */}
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    {record.parentConfirmed ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-800">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-emerald-950">Telah Dikonfirmasi oleh Orang Tua / Wali</strong>
                            {record.parentNote && (
                              <p className="text-[11px] text-slate-700 mt-0.5">
                                Catatan Wali: &ldquo;{record.parentNote}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono self-start sm:self-auto shrink-0">
                          {record.parentConfirmedAt}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          Konfirmasi Tanda Terima Wali Santri:
                        </div>

                        <p className="text-[11px] text-slate-600">
                          Mohon klik konfirmasi di bawah ini sebagai bukti bahwa Anda telah mengetahui catatan ini. Anda juga dapat menyertakan pesan/tanggapan untuk Bagian Kesiswaan.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Tuliskan tanggapan / pesan wali (opsional)..."
                            value={parentNoteInput[record.id] || ''}
                            onChange={e =>
                              setParentNoteInput({ ...parentNoteInput, [record.id]: e.target.value })
                            }
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            disabled={confirmingRecordId === record.id}
                            onClick={() => handleConfirmRecord(record.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center justify-center gap-1.5 border border-blue-600 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {confirmingRecordId === record.id ? 'Menyimpan...' : 'Saya Sudah Membaca'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isGuideModalOpen && <ParentGuideModal onClose={() => setIsGuideModalOpen(false)} />}

      {/* Ekskul Payment Confirmation Modal */}
      {isPaymentConfirmModalOpen && activeSantri && (
        <EkskulPaymentConfirmModal
          isOpen={isPaymentConfirmModalOpen}
          onClose={() => {
            setIsPaymentConfirmModalOpen(false);
            setSelectedEkskulForConfirm(null);
          }}
          santri={activeSantri}
          ekskulList={santriEkskulRecords}
          initialEkskul={selectedEkskulForConfirm}
          initialMonthKey={defaultMonthForConfirm}
          existingClaims={ekskulClaims}
          onSubmitClaim={claim => {
            if (onSubmitEkskulClaim) {
              onSubmitEkskulClaim(claim);
            }
          }}
        />
      )}
    </div>
  );
};

