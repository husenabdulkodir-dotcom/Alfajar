import React, { useState, useEffect } from 'react';
import { Santri, PointRecord } from '../types';
import { calculateNetPoints, getHeavyViolations } from '../utils/helpers';
import { Bot, Sparkles, X, Loader2, Copy, Check, ShieldAlert } from 'lucide-react';

interface AiCounselorModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri | null;
  records: PointRecord[];
  academicYear: string;
}

export const AiCounselorModal: React.FC<AiCounselorModalProps> = ({
  isOpen,
  onClose,
  santri,
  records,
  academicYear
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const netPoints = santri ? calculateNetPoints(santri.id, records, academicYear) : 0;
  const heavyViolations = santri ? getHeavyViolations(santri.id, records) : [];
  const santriRecords = santri ? records.filter(r => r.santriId === santri.id) : [];

  const handleGenerateAdvice = async () => {
    if (!santri) return;
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/ai-counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriName: santri.name,
          class: santri.class,
          netPoints,
          heavyViolations,
          recentRecords: santriRecords.slice(0, 5)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memanggil layanan AI.');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && santri) {
      handleGenerateAdvice();
    }
  }, [isOpen, santri?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !santri) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        <div className="p-4 bg-[#0A0A0B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center border border-blue-400/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                AI Konselor Kesiswaan
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </h3>
              <p className="text-[11px] text-gray-400">
                Rekomendasi Pembinaan Islami untuk {santri.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-gray-300 font-semibold">
                Sedang Menganalisa Riwayat Poin & Merumuskan Nasihat Konseling...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-rose-300">
              <p className="font-bold">Gagal Membuat Rekomendasi AI</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={handleGenerateAdvice}
                className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-gray-400">Hasil Analisa Rekomendasi:</span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-[#0A0A0B] border border-white/10 hover:border-white/20 text-gray-300 rounded-lg font-semibold text-xs flex items-center gap-1 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin Nasihat'}
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-200 leading-relaxed whitespace-pre-wrap bg-[#0A0A0B] p-4 rounded-xl border border-white/10">
                {result}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#0A0A0B] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl border border-blue-400/30"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
