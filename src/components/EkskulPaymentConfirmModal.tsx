import React, { useState, useRef } from 'react';
import { Santri, EkskulRecord, EkskulPaymentClaim } from '../types';
import { ACADEMIC_MONTHS } from '../utils/paymentHelpers';
import {
  X,
  WalletCards,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Trash2,
  ShieldCheck,
  Calendar,
  CreditCard,
  User,
  Info
} from 'lucide-react';

interface EkskulPaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri;
  ekskulList: EkskulRecord[];
  initialEkskul?: EkskulRecord | null;
  initialMonthKey?: string;
  existingClaims?: EkskulPaymentClaim[];
  onSubmitClaim: (claim: EkskulPaymentClaim) => void;
  coordinatorPhone?: string; // Optional custom phone for WhatsApp
}

export const EkskulPaymentConfirmModal: React.FC<EkskulPaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  santri,
  ekskulList,
  initialEkskul,
  initialMonthKey,
  existingClaims = [],
  onSubmitClaim,
  coordinatorPhone = '6281234567890' // Default contact or from parent / config
}) => {
  const defaultEkskul = initialEkskul || ekskulList[0] || null;
  const [selectedEkskulId, setSelectedEkskulId] = useState<string>(defaultEkskul?.id || '');
  
  // Current active selected ekskul object
  const activeEkskul = ekskulList.find(e => e.id === selectedEkskulId) || defaultEkskul;
  
  // Default month: passed in or current month (e.g. "2026-09")
  const [monthKey, setMonthKey] = useState<string>(initialMonthKey || '2026-09');
  const [amount, setAmount] = useState<number>(activeEkskul?.monthlyFee || 50000);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank (BSI / Bank Syariah)');
  const [senderName, setSenderName] = useState<string>(santri.parentName || '');
  const [bankName, setBankName] = useState<string>('BSI');
  const [notes, setNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Selected month label
  const selectedMonthObj = ACADEMIC_MONTHS.find(m => m.key === monthKey);
  const monthLabel = selectedMonthObj ? `${selectedMonthObj.monthName} ${selectedMonthObj.year}` : monthKey;

  // Filter claims strictly for this student
  const santriClaims = existingClaims.filter(c => c.santriId === santri.id);

  // Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2.5MB for Firestore safety)
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 2.5 MB. Mohon pilih foto resi yang lebih kecil atau screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEkskul) {
      alert('Silakan pilih ekstrakurikuler terlebih dahulu.');
      return;
    }

    if (!senderName.trim()) {
      alert('Mohon isi nama pengirim / pemilik rekening pembayaran.');
      return;
    }

    setIsSubmitting(true);

    const newClaim: EkskulPaymentClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      santriId: santri.id,
      santriName: santri.name,
      santriClass: santri.class,
      santriNis: santri.nis,
      ekskulId: activeEkskul.id,
      ekskulName: activeEkskul.ekskulName,
      monthKey,
      monthLabel,
      amount: Number(amount) || (activeEkskul.monthlyFee || 50000),
      paymentDate,
      paymentMethod,
      senderName: senderName.trim(),
      bankName: bankName.trim(),
      notes: notes.trim() || undefined,
      proofImage: proofImage || undefined,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      submittedByParent: santri.parentName || senderName.trim(),
      parentPhone: santri.parentPhone
    };

    try {
      onSubmitClaim(newClaim);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to submit claim:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Direct Confirmation to WhatsApp
  const handleSendWhatsApp = () => {
    if (!activeEkskul) return;
    
    const text = `*KONFIRMASI PEMBAYARAN IURAN EKSKUL*\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Ustadz/Koordinator Ekskul, mohon konfirmasi pembayaran iuran ekstrakurikuler ananda:\n\n` +
      `👤 *Nama Santri:* ${santri.name}\n` +
      `🏫 *Kelas:* ${santri.class} ${santri.nis ? `(NIS: ${santri.nis})` : ''}\n` +
      `⚽ *Ekstrakurikuler:* ${activeEkskul.ekskulName}\n` +
      `📅 *Bulan Iuran:* ${monthLabel}\n` +
      `💰 *Nominal:* Rp ${Number(amount).toLocaleString('id-ID')}\n` +
      `💳 *Metode:* ${paymentMethod} (${bankName})\n` +
      `📝 *Atas Nama Pengirim:* ${senderName}\n` +
      `🗓️ *Tanggal Bayar:* ${paymentDate}\n` +
      (notes ? `💬 *Catatan:* ${notes}\n` : '') +
      `\n_Bukti transfer telah dilampirkan. Mohon bantuan untuk memvalidasi di sistem kesiswaan. Syukran wa jazakumullahu khairan._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between gap-4 relative shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shrink-0">
              <WalletCards className="w-6 h-6 text-blue-200" />
            </div>
            <div className="truncate">
              <h3 className="font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
                Konfirmasi Pembayaran Ekskul
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                {santri.name} &bull; Kelas {santri.class} {santri.nis ? `(NIS: ${santri.nis})` : ''}
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

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Informational Guidance */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950">
                Pemberitahuan untuk Wali Santri:
              </p>
              <p className="text-blue-800 mt-0.5">
                Jika Bapak/Ibu telah melakukan pembayaran iuran ekskul namun status di portal masih tercatat <strong>&quot;Belum Lunas&quot;</strong>, silakan isi formulir konfirmasi di bawah ini. Data konfirmasi Anda akan langsung masuk ke sistem kesiswaan untuk diverifikasi.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 animate-slideDown">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">
                  Konfirmasi Pembayaran Berhasil Dikirim!
                </p>
                <p className="text-emerald-800 mt-0.5">
                  Laporan Anda telah tersimpan di cloud sistem kesiswaan dengan status <strong>Menunggu Verifikasi Pembina</strong>. Anda juga dapat meneruskan detailnya ke WhatsApp Koordinator.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Pilih Ekstrakurikuler & Bulan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Pilih Ekstrakurikuler <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEkskulId}
                  onChange={e => {
                    setSelectedEkskulId(e.target.value);
                    const selected = ekskulList.find(x => x.id === e.target.value);
                    if (selected?.monthlyFee) {
                      setAmount(selected.monthlyFee);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                >
                  {ekskulList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.ekskulName} (Rp {(item.monthlyFee || 50000).toLocaleString('id-ID')}/bln)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Bulan Iuran yang Dibayar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={monthKey}
                  onChange={e => setMonthKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                >
                  {ACADEMIC_MONTHS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.monthName} {m.year} {m.key === '2026-09' ? '(Bulan Ini)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Nominal & Tanggal Bayar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Transfer / Pembayaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* 3. Metode Pembayaran & Nama Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                >
                  <option value="Transfer Bank (BSI / Bank Syariah)">Transfer Bank (BSI / Bank Syariah)</option>
                  <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                  <option value="Transfer Bank BRI / BNI">Transfer Bank BRI / BNI</option>
                  <option value="QRIS / Dompet Digital (GoPay, OVO, Dana)">QRIS / Dompet Digital</option>
                  <option value="Tunai / Titip Santri ke Pembina">Tunai / Titip Santri ke Pembina</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Nama Pengirim / Pemilik Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Contoh: Ayahanda / Hj. Siti"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* 4. Unggah Foto Bukti Transfer / Resi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  Foto / Screenshot Bukti Transfer (Opsional tapi disarankan)
                </span>
                {proofImage && (
                  <button
                    type="button"
                    onClick={() => setProofImage('')}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus Foto
                  </button>
                )}
              </label>

              {proofImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex items-center justify-center">
                  <img
                    src={proofImage}
                    alt="Bukti Transfer"
                    className="max-h-48 rounded-xl object-contain shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 text-center cursor-pointer transition-all space-y-1"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Klik untuk memilih foto resi / screenshot m-banking
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Format JPG, PNG, atau WEBP (Maksimal 2.5 MB)
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* 5. Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Catatan Tambahan untuk Pembina / Koordinator (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Sudah ditransfer tadi pagi melalui rekening BSI atas nama Ayah..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim Data...' : 'Kirim Konfirmasi ke Sistem'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                title="Kirim detail ke WhatsApp Koordinator"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </form>

          {/* Section: Riwayat Konfirmasi yang Telah Diajukan */}
          {santriClaims.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Riwayat Konfirmasi Pembayaran Ananda ({santriClaims.length})
                </h4>
              </div>

              <div className="space-y-2.5">
                {santriClaims.map(claim => {
                  const isPending = claim.status === 'PENDING';
                  const isVerified = claim.status === 'VERIFIED';
                  const isRejected = claim.status === 'REJECTED';

                  return (
                    <div
                      key={claim.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        isVerified
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : isRejected
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {claim.ekskulName} &bull; {claim.monthLabel}
                          </span>
                          <span className="font-mono font-bold text-blue-700">
                            Rp {claim.amount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600">
                          Metode: <strong className="text-slate-800">{claim.paymentMethod}</strong> &bull; Pengirim: <strong className="text-slate-800">{claim.senderName}</strong>
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Diajukan pada: {new Date(claim.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {claim.notes && (
                          <p className="text-[11px] text-slate-600 italic">
                            &quot;{claim.notes}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] border border-emerald-300 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Terverifikasi Lunas
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] border border-rose-300 shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Perlu Dicek Ulang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-300 shadow-xs animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Menunggu Verifikasi
                          </span>
                        )}

                        {claim.proofImage && (
                          <a
                            href={claim.proofImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 text-[10px] font-bold"
                            title="Lihat Bukti Transfer"
                          >
                            Resi
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kesiswaan & Ekstrakurikuler Al Fajar</span>
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
