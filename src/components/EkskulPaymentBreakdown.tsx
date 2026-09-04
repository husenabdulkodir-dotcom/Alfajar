import React, { useState } from 'react';
import { EkskulRecord, EkskulPaymentClaim } from '../types';
import { getEkskulPaymentOverview, MonthPaymentStatus } from '../utils/paymentHelpers';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  WalletCards,
  ShieldCheck,
  SendHorizontal
} from 'lucide-react';

interface EkskulPaymentBreakdownProps {
  ekskul: EkskulRecord;
  defaultExpanded?: boolean;
  onOpenConfirmPayment?: (ekskul: EkskulRecord, defaultMonthKey?: string) => void;
  existingClaims?: EkskulPaymentClaim[];
}

export const EkskulPaymentBreakdown: React.FC<EkskulPaymentBreakdownProps> = ({
  ekskul,
  defaultExpanded = true,
  onOpenConfirmPayment,
  existingClaims = []
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filterMode, setFilterMode] = useState<'ALL' | 'LUNAS' | 'BELUM'>('ALL');

  const overview = getEkskulPaymentOverview(ekskul, existingClaims);
  const { currentMonth, previousMonth, allMonths, totalPaidCount, totalUnpaidCount, totalUnpaidAmount } = overview;

  // Find claims related to this specific ekskul
  const ekskulClaims = existingClaims.filter(c => 
    (c.ekskulId && c.ekskulId === ekskul.id) || 
    (c.ekskulName && c.ekskulName.toLowerCase().trim() === ekskul.ekskulName.toLowerCase().trim())
  );

  const pendingClaimsCount = ekskulClaims.filter(c => c.status === 'PENDING').length;

  const filteredMonths = allMonths.filter(m => {
    if (filterMode === 'LUNAS') return m.status === 'LUNAS';
    if (filterMode === 'BELUM') return m.status === 'BELUM_LUNAS';
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all">
      {/* Header Summary: Bulan Ini & Bulan Sebelumnya */}
      <div className="p-4 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <WalletCards className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                Status Pembayaran SPP / Iuran Ekskul
                {pendingClaimsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 animate-pulse">
                    {pendingClaimsCount} Menunggu Verifikasi
                  </span>
                )}
              </h5>
              <p className="text-[11px] text-slate-500">
                Tahun Ajaran 2026/2027 (Agustus &ndash; Juni)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenConfirmPayment && (
              <button
                type="button"
                onClick={() => onOpenConfirmPayment(ekskul, currentMonth.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Konfirmasi pembayaran jika Anda sudah bayar tapi belum terupdate"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Konfirmasi Pembayaran</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Sembunyikan</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Lihat Semua</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Highlight: Bulan Ini & Bulan Sebelumnya */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Previous Month */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
            previousMonth.status === 'LUNAS'
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${
                previousMonth.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {previousMonth.status === 'LUNAS' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Bulan Lalu ({previousMonth.monthName})
                </span>
                <span className="text-xs font-black text-slate-800">
                  {previousMonth.monthName} {previousMonth.year}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                previousMonth.status === 'LUNAS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {previousMonth.status === 'LUNAS' ? 'Sudah Lunas' : 'Belum Lunas'}
              </span>
              {previousMonth.status === 'BELUM_LUNAS' && (
                <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">
                  Rp {previousMonth.amount.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

          {/* Current Month */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
            currentMonth.status === 'LUNAS'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${
                currentMonth.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {currentMonth.status === 'LUNAS' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Bulan Ini (Aktif)
                </span>
                <span className="text-xs font-black text-slate-900">
                  {currentMonth.monthName} {currentMonth.year}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                currentMonth.status === 'LUNAS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {currentMonth.status === 'LUNAS' ? 'Sudah Lunas' : 'Belum Lunas'}
              </span>
              {currentMonth.status === 'BELUM_LUNAS' && (
                <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">
                  Rp {currentMonth.amount.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Breakdown: Agustus s.d. Juni */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-slate-50/40">
          {/* Filter Chips & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-xl text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua (11 Bulan)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('LUNAS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'LUNAS'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Lunas ({totalPaidCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('BELUM')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'BELUM'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Belum Lunas ({totalUnpaidCount})
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Iuran per bulan: <strong className="text-slate-800">Rp {overview.monthlyFee.toLocaleString('id-ID')}</strong>
            </div>
          </div>

          {/* Month Cards Grid (Agustus - Juni) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredMonths.map((m: MonthPaymentStatus) => {
              const isLunas = m.status === 'LUNAS';
              const isBelumLunas = m.status === 'BELUM_LUNAS';
              
              // Check if there is a pending claim for this specific month
              const monthClaim = ekskulClaims.find(c => c.monthKey === m.key);
              const hasPendingClaim = monthClaim && monthClaim.status === 'PENDING';

              return (
                <div
                  key={m.key}
                  onClick={() => {
                    if (onOpenConfirmPayment && !isLunas) {
                      onOpenConfirmPayment(ekskul, m.key);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                    onOpenConfirmPayment && !isLunas ? 'cursor-pointer hover:shadow-sm hover:border-blue-400' : ''
                  } ${
                    m.isCurrent
                      ? 'ring-2 ring-blue-500/50 bg-blue-50/40 border-blue-200'
                      : isLunas
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : hasPendingClaim
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                      : isBelumLunas
                      ? 'bg-rose-50/40 border-rose-200/80'
                      : 'bg-white border-slate-200/70 text-slate-400'
                  }`}
                >
                  {m.isCurrent && (
                    <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider shadow-xs">
                      Bulan Ini
                    </span>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      {m.monthName}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      Tahun {m.year}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-1">
                    {isLunas ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Lunas
                      </span>
                    ) : hasPendingClaim ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700" title="Menunggu verifikasi admin">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        Verifikasi
                      </span>
                    ) : isBelumLunas ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        Belum
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400">
                        <Clock className="w-3 h-3 text-slate-300 shrink-0" />
                        Mendatang
                      </span>
                    )}

                    <span className="text-[9px] font-medium text-slate-500">
                      {isLunas ? '✅' : hasPendingClaim ? '⏳' : isBelumLunas ? `Rp ${(m.amount / 1000)}k` : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unpaid Alert Footer if applicable */}
          {totalUnpaidCount > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    Terdapat {totalUnpaidCount} bulan belum lunas (Total: Rp {totalUnpaidAmount.toLocaleString('id-ID')})
                  </p>
                  <p className="text-[11px] text-amber-800/80">
                    Bapak/Ibu dapat menekan tombol <strong>Konfirmasi Pembayaran</strong> jika sudah mentransfer namun status belum terupdate.
                  </p>
                </div>
              </div>

              {onOpenConfirmPayment && (
                <button
                  type="button"
                  onClick={() => onOpenConfirmPayment(ekskul, currentMonth.key)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Konfirmasi
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] font-medium text-emerald-800">
                Semua iuran bulan berjalan tercatat <strong>Lunas</strong>. Terima kasih atas partisipasi aktif Bapak/Ibu.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
