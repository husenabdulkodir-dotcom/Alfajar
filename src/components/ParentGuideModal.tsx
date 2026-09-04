import React from 'react';
import { X, Printer, Fingerprint, Lock, ShieldCheck, HelpCircle, User, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

interface ParentGuideModalProps {
  onClose: () => void;
}

export const ParentGuideModal: React.FC<ParentGuideModalProps> = ({ onClose }) => {
  const [showPrintHint, setShowPrintHint] = React.useState(false);

  const handlePrintClick = () => {
    try {
      window.print();
      // Show hint anyway because print might fail silently in iframe
      setShowPrintHint(true);
      setTimeout(() => setShowPrintHint(false), 5000);
    } catch (err) {
      setShowPrintHint(true);
      setTimeout(() => setShowPrintHint(false), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-100 shrink-0 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Brosur Panduan Wali Santri</h2>
            <p className="text-sm text-slate-500 mt-1">
              Halaman ini menampilkan gambaran persis aplikasi asli. Anda dapat melakukan Screenshot / Cetak PDF halaman ini.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 relative">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all cursor-pointer no-print shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Poster (PDF)
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {showPrintHint && (
              <div className="absolute top-full mt-2 right-0 bg-slate-800 text-white text-xs p-3 rounded-xl shadow-lg w-64 animate-fadeIn no-print z-10 text-right">
                <p>Jika dialog cetak tidak muncul, silakan tekan <strong>Ctrl + P</strong> (Windows) atau <strong>Cmd + P</strong> (Mac). Di HP, gunakan menu <strong>Share &gt; Print</strong>.</p>
                <p className="mt-1 text-blue-300 italic">Disarankan membuka aplikasi di Tab Baru browser Anda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-8 overflow-y-auto bg-slate-50 printable-guide flex-1">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-emerald-700 uppercase tracking-tight">
              Panduan Portal Wali Santri
            </h1>
            <h2 className="text-lg font-medium text-slate-600 mt-2">
              Sistem Poin & Kedisiplinan Al Fajar Islamic School
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* LEFT COLUMN: LOGIN SCREEN MOCK */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold">1</span>
                <h3 className="text-xl font-bold text-slate-800">Cara Masuk (Login)</h3>
              </div>

              {/* The Mock UI */}
              <div className="relative border-4 border-slate-200 rounded-3xl overflow-hidden bg-white p-6 shadow-sm">
                
                {/* Badge 1 */}
                <div className="absolute top-[108px] left-3 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">A</span>
                </div>
                {/* Badge 2 */}
                <div className="absolute top-[220px] left-3 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">B</span>
                </div>
                {/* Badge 3 */}
                <div className="absolute bottom-6 left-3 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">C</span>
                </div>

                <div className="text-center mb-6 pl-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Portal Wali Santri</h2>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1 mb-6 pl-4">
                  <div className="flex-1 text-center py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-slate-800 border border-slate-200">
                    Gunakan NIS
                  </div>
                  <div className="flex-1 text-center py-2 text-sm font-medium text-slate-500">
                    Gunakan Kode PIN
                  </div>
                </div>

                <div className="space-y-4 mb-6 pl-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Nomor Induk Santri (NIS)</label>
                    <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm">
                      Ketik NIS Santri (Contoh: 202607001)
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Ingat sesi di perangkat ini</span>
                  </div>
                </div>

                <div className="w-full ml-4 bg-emerald-600 text-white py-3 rounded-xl text-center font-bold text-sm shadow-md mb-8" style={{ width: 'calc(100% - 1rem)' }}>
                  Buka Rapor & Catatan Poin Ananda
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 ml-4">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Bantuan & Layanan</p>
                    <div className="mt-2 inline-block px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                      Hubungi WA Kesiswaan (0895-3204-61884)
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">A</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Pilih Metode Masuk</h4>
                    <p className="text-xs text-slate-600 mt-1">Anda bisa memilih login menggunakan Nomor Induk Santri (NIS) ATAU menggunakan 6 digit Kode PIN resmi dari sekolah.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">B</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Centang Ingat Sesi</h4>
                    <p className="text-xs text-slate-600 mt-1">Centang kotak ini agar Anda tidak perlu login berulang kali saat membuka portal di HP yang sama.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">C</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Tombol Bantuan Kesiswaan</h4>
                    <p className="text-xs text-slate-600 mt-1">Jika Anda lupa NIS/PIN, tekan tombol ini untuk langsung terhubung dengan admin sekolah via WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DASHBOARD SCREEN MOCK */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold">2</span>
                <h3 className="text-xl font-bold text-slate-800">Membaca Rapor & Riwayat</h3>
              </div>

              {/* The Mock UI */}
              <div className="relative border-4 border-slate-200 rounded-3xl overflow-hidden bg-slate-50 shadow-sm h-full flex flex-col min-h-[500px]">
                
                {/* Badge D */}
                <div className="absolute top-2 right-4 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">D</span>
                </div>
                {/* Badge E */}
                <div className="absolute top-[80px] right-4 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">E</span>
                </div>
                {/* Badge F */}
                <div className="absolute top-[370px] right-6 z-10 flex items-center print:hidden">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold ring-4 ring-white shadow-lg animate-bounce">F</span>
                </div>

                <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 pr-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-700">Akun Terverifikasi</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg"><RefreshCw className="w-4 h-4 text-slate-600" /></div>
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg flex items-center gap-1">
                      <LogOut className="w-4 h-4" /> <span className="text-xs font-bold">Keluar</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pr-6 overflow-hidden">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-4 shadow-sm relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">Ahmad Fulan</h3>
                        <p className="text-xs text-slate-500">Kelas 10A • NIS: 202607001</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        Status Aman
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 bg-[#25D366] text-white text-xs font-bold py-2 rounded-xl text-center">
                        Bagikan ke WA
                      </div>
                      <div className="px-3 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-xl flex items-center">
                        <Printer className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">
                      <p className="text-[10px] text-emerald-600 font-bold mb-1">PRESTASI</p>
                      <p className="text-lg font-bold text-emerald-700">+15</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl text-center">
                      <p className="text-[10px] text-rose-600 font-bold mb-1">PELANGGARAN</p>
                      <p className="text-lg font-bold text-rose-700">-5</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl text-center">
                      <p className="text-[10px] text-blue-600 font-bold mb-1">TOTAL POIN</p>
                      <p className="text-lg font-bold text-blue-700">10</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Kebaikan</span>
                      <span className="text-[10px] text-slate-400">12 Sep 2026</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium mb-3">Membantu membersihkan masjid sekolah</p>
                    
                    <div className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-lg text-center font-bold text-xs">
                      ✔ Saya Sudah Membaca
                    </div>
                  </div>
                </div>

              </div>

              {/* Legend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">D</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Tombol Keluar & Refresh</h4>
                    <p className="text-xs text-slate-600 mt-1">Gunakan tombol merah untuk <b>Keluar (Logout)</b> dengan aman. Tombol Putar (Refresh) untuk menyegarkan data poin terbaru.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">E</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Bagikan Rapor & Cetak</h4>
                    <p className="text-xs text-slate-600 mt-1">Anda dapat membagikan ringkasan poin ini ke pasangan/keluarga via WhatsApp, atau menyimpannya dalam bentuk PDF.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">F</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Konfirmasi Wali (Penting)</h4>
                    <p className="text-xs text-slate-600 mt-1">Tekan tombol biru <b>"Saya Sudah Membaca"</b> pada catatan poin ananda sebagai bukti kepada pihak sekolah bahwa Anda telah melihatnya.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
