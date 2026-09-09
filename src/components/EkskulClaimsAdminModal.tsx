import React, { useState } from 'react';
import { EkskulPaymentClaim } from '../types';
import {
  X,
  WalletCards,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Trash2,
  Building2,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface EkskulClaimsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  claims: EkskulPaymentClaim[];
  onUpdateClaimStatus: (
    claimId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
    reviewedBy?: string
  ) => void;
  onDeleteClaim: (claimId: string) => void;
}

export const EkskulClaimsAdminModal: React.FC<EkskulClaimsAdminModalProps> = ({
  isOpen,
  onClose,
  claims,
  onUpdateClaimStatus,
  onDeleteClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  if (!isOpen) return null;

  // Filtering claims
  const filteredClaims = claims.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      c.santriName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ekskulName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.santriClass.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = claims.filter(c => c.status === 'PENDING').length;
  const verifiedCount = claims.filter(c => c.status === 'VERIFIED').length;
  const rejectedCount = claims.filter(c => c.status === 'REJECTED').length;

  const handleApprove = (claim: EkskulPaymentClaim) => {
    onUpdateClaimStatus(claim.id, 'VERIFIED', undefined, 'Admin / Kesiswaan');
  };

  const handleConfirmReject = (claimId: string) => {
    onUpdateClaimStatus(claimId, 'REJECTED', rejectionReasonInput.trim() || 'Bukti transfer / nominal tidak sesuai', 'Admin / Kesiswaan');
    setRejectingClaimId(null);
    setRejectionReasonInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-blue-300 shrink-0">
              <WalletCards className="w-6 h-6 text-blue-300" />
            </div>
            <div className="truncate">
              <h3 className="font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
                Verifikasi Konfirmasi Bayar Ekskul
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs border border-amber-300 animate-pulse">
                    {pendingCount} Menunggu
                  </span>
                )}
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Pusat Validasi Bukti Bayar & Klaim Iuran Ekskul Santri oleh Wali Santri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('VERIFIED')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terverifikasi ({verifiedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ditolak ({rejectedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({claims.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari santri / ekskul / wali..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List Claims */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">
                Tidak ada data konfirmasi pembayaran {statusFilter !== 'ALL' ? `berstatus ${statusFilter}` : ''}
              </p>
              <p className="text-xs text-slate-400">
                Pengajuan dari orang tua santri akan tampil otomatis di sini secara real-time.
              </p>
            </div>
          ) : (
            filteredClaims.map(claim => {
              const isPending = claim.status === 'PENDING';
              const isVerified = claim.status === 'VERIFIED';
              const isRejected = claim.status === 'REJECTED';

              return (
                <div
                  key={claim.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPending
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/50'
                      : isVerified
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  {/* Left Detail */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">
                        {claim.santriName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-[10px]">
                        Kelas {claim.santriClass}
                      </span>
                      {claim.santriNis && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          NIS: {claim.santriNis}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-xs font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                        <Building2 className="w-3.5 h-3.5" />
                        {claim.ekskulName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {claim.monthLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Rp {claim.amount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>
                        Metode: <strong className="text-slate-800">{claim.paymentMethod}</strong> ({claim.bankName || 'BSI'}) &bull; Atas Nama Pengirim: <strong className="text-slate-800">{claim.senderName}</strong>
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Diajukan oleh: <strong className="text-slate-600">{claim.submittedByParent}</strong> {claim.parentPhone ? `(${claim.parentPhone})` : ''} &bull; Tgl Bayar: {claim.paymentDate}
                      </p>
                      {claim.notes && (
                        <p className="text-[11px] text-slate-700 italic bg-white/70 p-1.5 rounded-lg border border-slate-200/80 mt-1">
                          &quot;{claim.notes}&quot;
                        </p>
                      )}
                      {claim.rejectionReason && isRejected && (
                        <p className="text-[11px] text-rose-700 font-bold bg-rose-100/80 p-1.5 rounded-lg border border-rose-300 mt-1">
                          Alasan Penolakan: {claim.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                    {/* View Proof Image */}
                    {claim.proofImage && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofImage(claim.proofImage || null)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Lihat foto bukti transfer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lihat Bukti Resi</span>
                      </button>
                    )}

                    {/* Pending Actions */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(claim)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          title="Setujui dan Verifikasi Lunas"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verifikasi Lunas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectingClaimId(claim.id);
                            setRejectionReasonInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="Tolak Konfirmasi"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {isVerified && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Terverifikasi
                      </span>
                    )}

                    {isRejected && (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-black text-xs border border-rose-300 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Ditolak
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteClaim(claim.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus riwayat pengajuan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Prompt: Reject Reason */}
        {rejectingClaimId && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 space-y-2 shrink-0">
            <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Masukkan Alasan Penolakan untuk Wali Santri:
            </h5>
            <input
              type="text"
              value={rejectionReasonInput}
              onChange={e => setRejectionReasonInput(e.target.value)}
              placeholder="Contoh: Nominal transfer tidak sesuai / foto resi kabur"
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectingClaimId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingClaimId)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        )}

        {/* Modal Image Preview Overlay */}
        {selectedProofImage && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-4 max-w-2xl w-full max-h-[90vh] flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  Foto Bukti Transfer Resi
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedProofImage(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 rounded-2xl p-2 flex items-center justify-center">
                <img
                  src={selectedProofImage}
                  alt="Bukti Transfer"
                  className="max-h-[70vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setSelectedProofImage(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistem Verifikasi Pembayaran Ekskul Al Fajar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
