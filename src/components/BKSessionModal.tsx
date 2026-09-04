import React, { useState, useEffect } from 'react';
import {
  Santri,
  PointRecord,
  BKCounselingNote,
  BKProblemType,
  BKUrgencyLevel,
  BKSessionStatus,
  BKAIAnalysis
} from '../types';
import {
  BK_QUESTIONNAIRES,
  detectLevelFromClass,
  BKQuestionItem,
  loadBKQuestionnaires
} from '../utils/bkQuestionnaireData';
import {
  X,
  Sparkles,
  HeartHandshake,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  Loader2,
  Lock,
  ArrowRight,
  Info,
  HelpCircle,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Printer,
  Edit3,
  ListFilter
} from 'lucide-react';

interface BKSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  records: PointRecord[];
  academicYear: string;
  initialSantriId?: string;
  editNote?: BKCounselingNote | null;
  onSaveNote: (note: BKCounselingNote) => void;
}

const PROBLEM_TYPES: BKProblemType[] = [
  'Bimbingan Rutin Terjadwal (Check-in Berkala)',
  'Konsultasi Minat, Bakat & Karir',
  'Bimbingan Belajar & Manajemen Waktu Full Day',
  'Sosial & Hubungan Teman Sebaya',
  'Pribadi & Kesejahteraan Siswa',
  'Kedisiplinan & Tata Tertib Sekolah',
  'Pembinaan Khusus / Kasus Khusus',
  'Spiritualitas & Pembiasaan Karakter',
  // Opsi Tambahan
  'Kedisiplinan & Tata Tertib',
  'Pribadi & Emosi',
  'Akademik & Minat Belajar',
  'Sosial & Pergaulan Santri',
  'Keluarga & Adaptasi Sekolah',
  'Pelanggaran Berat & Kasus Khusus',
  'Ibadah & Spiritual'
];

const URGENCY_LEVELS: { level: BKUrgencyLevel; color: string; desc: string }[] = [
  { level: 'Rutin (Bimbingan Berkala)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', desc: 'Jadwal rutin berkala / check-in seluruh siswa' },
  { level: 'Rendah', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', desc: 'Konsultasi ringan / pengembangan potensi diri' },
  { level: 'Sedang', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', desc: 'Perlu bimbingan dan arahan berkala' },
  { level: 'Tinggi', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', desc: 'Hambatan berulang / butuh pendampingan intensif' },
  { level: 'Kritis (Perlu Tindak Lanjut)', color: 'text-red-400 bg-red-500/10 border-red-500/30', desc: 'Kasus khusus / butuh koordinasi wali & pimpinan' }
];

const STATUS_LIST: BKSessionStatus[] = [
  'Dalam Pantauan',
  'Progres Membaik',
  'Selesai',
  'Perlu Pemanggilan Ortu',
  'Diagendakan Rapat Kesiswaan'
];

export const BKSessionModal: React.FC<BKSessionModalProps> = ({
  isOpen,
  onClose,
  santriList,
  records,
  academicYear,
  initialSantriId,
  editNote,
  onSaveNote
}) => {
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [counselorName, setCounselorName] = useState<string>('Guru BK & Kesiswaan');
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [counselingType, setCounselingType] = useState<BKProblemType>('Bimbingan Rutin Terjadwal (Check-in Berkala)');
  const [urgencyLevel, setUrgencyLevel] = useState<BKUrgencyLevel>('Rutin (Bimbingan Berkala)');
  const [status, setStatus] = useState<BKSessionStatus>('Selesai');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [counselingNotes, setCounselingNotes] = useState<string>('');
  const [studentCommitment, setStudentCommitment] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<BKAIAnalysis | undefined>(undefined);

  // Questionnaire States
  const [counselingLevel, setCounselingLevel] = useState<'SMP' | 'SMA'>('SMP');
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [questionnaireBank, setQuestionnaireBank] = useState(() => loadBKQuestionnaires());

  useEffect(() => {
    if (isOpen) {
      setQuestionnaireBank(loadBKQuestionnaires());
    }
  }, [isOpen]);

  // AI Loading & Error State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiViewMode, setAiViewMode] = useState<'all' | 'internal' | 'parent'>('all');
  const [copiedAiReport, setCopiedAiReport] = useState<boolean>(false);

  const handleCopyAiFormattedReport = () => {
    if (!aiAnalysis) return;
    const report = aiAnalysis.formattedReport || `==================================================
LAPORAN AI ENGINE BK & KESISWAAN - AL FAJAR ISLAMIC SCHOOL
Santri: ${currentSantri?.name || '-'} (${counselingLevel}) | Semester ${semester} ${academicYear}
==================================================

[ANALISIS INSTRUMEN SANTRI]
- Ringkasan Kondisi: ${aiAnalysis.instrumentAnalysis?.conditionSummary || aiAnalysis.summaryText}
- Tingkat Urgensi: ${aiAnalysis.instrumentAnalysis?.urgencyLevel || urgencyLevel}

[CATATAN INTERNAL BK & KESISWAAN - RAHASIA]
- Status Kasus: ${aiAnalysis.internalBK?.caseStatus || status}
- Analisis Detail & Catatan Sensitif: ${aiAnalysis.internalBK?.detailedAnalysisAndSensitiveNotes || aiAnalysis.psychologicalFactors}
- Rencana Intervensi Sekolah: ${aiAnalysis.internalBK?.schoolInterventionPlan || aiAnalysis.followUpRecommendations?.join(', ')}

[TAMPILAN WALI SANTRI - STRICT PRIVACY]
- Status Progres: ${aiAnalysis.parentView?.progressStatus || 'Progres Membaik'}
- Ringkasan Perkembangan: ${aiAnalysis.parentView?.developmentSummary || aiAnalysis.evaluationReportSnippet}
- Saran Pendampingan di Rumah:
${aiAnalysis.parentView?.homeAssistanceTips?.map((t, i) => `  ${i + 1}. ${t}`).join('\n') || '- Lakukan pendampingan hangat di rumah.'}

[PERTANYAAN EVALUASI GURU BK]
${aiAnalysis.counselorEvaluationQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || '- Terus lakukan observasi interaksi di kelas.'}`;

    navigator.clipboard.writeText(report);
    setCopiedAiReport(true);
    setTimeout(() => setCopiedAiReport(false), 2500);
  };

  // Populate form on edit or open
  useEffect(() => {
    if (editNote) {
      setSelectedSantriId(editNote.santriId);
      setCounselorName(editNote.counselorName || 'Ust. Abdul Kodir (Guru BK & Kesiswaan)');
      setSessionDate(editNote.sessionDate);
      setSemester(editNote.semester);
      setCounselingType(editNote.counselingType);
      setUrgencyLevel(editNote.urgencyLevel);
      setStatus(editNote.status);
      setProblemDescription(editNote.problemDescription);
      setCounselingNotes(editNote.counselingNotes);
      setStudentCommitment(editNote.studentCommitment);
      setActionPlan(editNote.actionPlan);
      setFollowUpDate(editNote.followUpDate || '');
      setAiAnalysis(editNote.aiAnalysis);
      setCounselingLevel(editNote.counselingLevel || detectLevelFromClass(editNote.santriClass));
      setQuestionnaireAnswers(editNote.questionnaireAnswers || {});
      if (editNote.questionnaireAnswers && Object.keys(editNote.questionnaireAnswers).length > 0) {
        setIsQuestionnaireOpen(true);
      }
    } else {
      const initialId = initialSantriId || (santriList.length > 0 ? santriList[0].id : '');
      setSelectedSantriId(initialId);
      setCounselorName('Guru BK & Kesiswaan');
      setSessionDate(new Date().toISOString().slice(0, 10));
      setSemester('Ganjil');
      setCounselingType('Bimbingan Rutin Terjadwal (Check-in Berkala)');
      setUrgencyLevel('Rutin (Bimbingan Berkala)');
      setStatus('Selesai');
      setProblemDescription('');
      setCounselingNotes('');
      setStudentCommitment('');
      setActionPlan('');
      setFollowUpDate('');
      setAiAnalysis(undefined);
      setQuestionnaireAnswers({});
      setIsQuestionnaireOpen(false);

      const foundSantri = santriList.find(s => s.id === initialId);
      if (foundSantri) {
        setCounselingLevel(detectLevelFromClass(foundSantri.class));
      } else {
        setCounselingLevel('SMP');
      }
    }
    setAiError(null);
  }, [isOpen, editNote, initialSantriId, santriList]);

  // Handle santri change and auto-detect level
  const handleSantriChange = (newSantriId: string) => {
    setSelectedSantriId(newSantriId);
    const target = santriList.find(s => s.id === newSantriId);
    if (target) {
      const detected = detectLevelFromClass(target.class);
      setCounselingLevel(detected);
    }
  };

  if (!isOpen) return null;

  const currentSantri = santriList.find(s => s.id === selectedSantriId);

  // Santri records in this academic year
  const santriRecords = records.filter(r => r.santriId === selectedSantriId && r.academicYear === academicYear);
  const violations = santriRecords.filter(r => r.type === 'Pelanggaran');
  const goodDeeds = santriRecords.filter(r => r.type === 'Kebaikan');
  const netPoints = goodDeeds.reduce((acc, r) => acc + r.points, 0) + violations.reduce((acc, r) => acc + r.points, 0);
  const heavyCount = santriRecords.filter(r => r.isHeavyViolation || r.category === 'Berat').length;

  const activeQuestionnaireConfig = questionnaireBank[counselingLevel] || BK_QUESTIONNAIRES[counselingLevel];

  // Helper to compile questionnaire text and structured items
  const getCompiledQuestionnaireData = () => {
    const questions = activeQuestionnaireConfig.questions;
    const answered = questions.filter(q => (questionnaireAnswers[q.id] || '').trim() !== '');
    if (answered.length === 0) return { compiledText: '', items: [] };

    const items = answered.map(q => {
      const val = questionnaireAnswers[q.id] || '';
      // Check if scale is stored in format "[Skala: X/5] ..."
      const scaleMatch = val.match(/\[Skala:\s*(\d)\/5\]/);
      const scale = scaleMatch ? parseInt(scaleMatch[1], 10) : undefined;
      const cleanText = val.replace(/\[Skala:\s*\d\/5\]\s*/, '').trim();

      return {
        questionId: q.id,
        category: q.category,
        question: q.question,
        scale,
        answer: cleanText || val
      };
    });

    const compiledText = answered
      .map((q, idx) => {
        const item = items[idx];
        const scaleStr = item.scale ? ` (Skala Skor: ${item.scale}/5)` : '';
        return `[${idx + 1}. ${q.category}${scaleStr}]\nQ: ${q.question}\nA: ${questionnaireAnswers[q.id]}`;
      })
      .join('\n\n');

    return { compiledText, items };
  };

  const getCompiledQuestionnaireText = () => {
    return getCompiledQuestionnaireData().compiledText;
  };

  // Helper to update question scale and text together
  const handleSetQuestionScale = (qId: string, scaleNum: number) => {
    const currentVal = questionnaireAnswers[qId] || '';
    const cleanText = currentVal.replace(/\[Skala:\s*\d\/5\]\s*/, '').trim();
    const newVal = cleanText ? `[Skala: ${scaleNum}/5] ${cleanText}` : `[Skala: ${scaleNum}/5]`;
    setQuestionnaireAnswers(prev => ({ ...prev, [qId]: newVal }));
  };

  const handleSetQuestionText = (qId: string, textVal: string) => {
    const currentVal = questionnaireAnswers[qId] || '';
    const scaleMatch = currentVal.match(/\[Skala:\s*(\d)\/5\]/);
    if (scaleMatch) {
      const scalePrefix = scaleMatch[0];
      const newVal = textVal.trim() ? `${scalePrefix} ${textVal.trim()}` : scalePrefix;
      setQuestionnaireAnswers(prev => ({ ...prev, [qId]: newVal }));
    } else {
      setQuestionnaireAnswers(prev => ({ ...prev, [qId]: textVal }));
    }
  };

  // Insert question prompt into counselingNotes
  const handleInsertQuestionToNotes = (q: BKQuestionItem) => {
    const currentVal = questionnaireAnswers[q.id] || '';
    const insertion = `\n• [Wawancara BK: ${q.question}]\n  Respon Santri: ${currentVal || '...'}`;
    setCounselingNotes(prev => (prev ? `${prev}${insertion}` : insertion.trimStart()));
    setCopiedQuestionId(q.id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  // Sync filled questionnaire into counselingNotes
  const handleApplyAnswersToNotes = () => {
    const compiled = getCompiledQuestionnaireText();
    if (!compiled) {
      alert('Belum ada jawaban kuisioner yang terisi. Silakan isi jawaban di salah satu pertanyaan.');
      return;
    }

    const header = `--- Lembar Wawancara BK Terstruktur (${activeQuestionnaireConfig.title}) ---\n`;
    const combined = `${header}${compiled}`;

    setCounselingNotes(prev => {
      if (!prev) return combined;
      return `${prev}\n\n${combined}`;
    });
  };

  const handleGenerateAISummary = async () => {
    if (!currentSantri) return;
    const { compiledText, items } = getCompiledQuestionnaireData();

    if (!problemDescription && !counselingNotes && !compiledText) {
      setAiError('Mohon isi minimal Pokok Masalah, Catatan Proses Konseling, atau Jawaban Format Pertanyaan (Skala 1-5 / Teks) sebelum menjalankan AI Engine BK.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai-bk-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriName: currentSantri.name,
          santriClass: currentSantri.class,
          academicYear,
          semester,
          counselingType,
          urgencyLevel,
          counselingLevel,
          questionnaireText: compiledText,
          questionnaireItems: items,
          problemDescription,
          counselingNotes,
          studentCommitment,
          actionPlan,
          pointHistorySummary: {
            netPoints,
            totalViolations: violations.length,
            heavyViolations: heavyCount,
            recentViolations: violations.slice(0, 3).map(v => `${v.title} (${v.points} poin)`)
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menjalankan analisis AI Engine BK.');
      }

      setAiAnalysis(data.data);
    } catch (err: any) {
      console.error('Error running AI BK Engine:', err);
      setAiError(err.message || 'Terjadi kesalahan saat memproses analisis AI BK.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSantri) return;

    const notePayload: BKCounselingNote = {
      id: editNote ? editNote.id : `bk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      santriId: currentSantri.id,
      santriName: currentSantri.name,
      santriClass: currentSantri.class,
      santriNis: currentSantri.nis,
      sessionDate,
      counselorName: counselorName.trim() || 'Ust. Guru BK & Kesiswaan',
      counselingType,
      urgencyLevel,
      counselingLevel,
      questionnaireAnswers: Object.keys(questionnaireAnswers).length > 0 ? questionnaireAnswers : undefined,
      problemDescription,
      counselingNotes,
      studentCommitment,
      actionPlan,
      followUpDate: followUpDate || undefined,
      status,
      semester,
      academicYear,
      isPrivate: true,
      aiAnalysis,
      createdAt: editNote ? editNote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveNote(notePayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {editNote ? 'Edit Catatan Bimbingan Konseling (BK)' : 'Catat Sesi Bimbingan Konseling (BK) Baru'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Khusus Kesiswaan & BK
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Dokumentasi pembinaan, panduan wawancara santri SMP/SMA, dan analisis evaluasi semester AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Row 1: Santri Selection & Context Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Pilih Santri yang Dibimbing <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedSantriId}
                onChange={e => handleSantriChange(e.target.value)}
                disabled={!!editNote}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-60"
                required
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} - Kelas {s.class} (NIS: {s.nis || '-'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Guru BK / Konselor Pencatat
              </label>
              <input
                type="text"
                value={counselorName}
                onChange={e => setCounselorName(e.target.value)}
                placeholder="Nama Guru BK / Kesiswaan"
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Quick Santri Context Badge */}
          {currentSantri && (
            <div className="p-3.5 bg-[#16161A] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                  {currentSantri.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{currentSantri.name}</div>
                  <div className="text-gray-400 text-[11px]">
                    Kelas {currentSantri.class} &bull; Tingkat Terdeteksi:{' '}
                    <span className="font-bold text-purple-400">{counselingLevel}</span> &bull; Wali: {currentSantri.parentName} ({currentSantri.parentPhone})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg font-bold ${netPoints < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  Poin Net: {netPoints > 0 ? `+${netPoints}` : netPoints}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {violations.length} Pelanggaran ({heavyCount} Berat)
                </span>
              </div>
            </div>
          )}

          {/* GUIDED QUESTIONNAIRE SECTION (SMP & SMA INTERVIEW INSTRUMENT) */}
          <div className="bg-[#141418] border border-purple-500/20 rounded-2xl overflow-hidden transition-all shadow-md">
            {/* Header Accordion Bar */}
            <div className="p-4 bg-gradient-to-r from-purple-950/40 via-[#18181F] to-[#141418] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">
                      Panduan Format Pertanyaan Wawancara BK
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeQuestionnaireConfig.badgeColor}`}>
                      {counselingLevel === 'SMP' ? 'Tingkat SMP (Adaptasi & Emosi)' : 'Tingkat SMA (Minat & Karir)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    11 instrumen pertanyaan terstruktur untuk menggali akar masalah, emosi, dan orientasi masa depan santri
                  </p>
                </div>
              </div>

              {/* Controls: Level Toggle & Open/Close */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex bg-[#0D0D10] p-0.5 rounded-xl border border-white/10 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCounselingLevel('SMP')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      counselingLevel === 'SMP'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    SMP
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselingLevel('SMA')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      counselingLevel === 'SMA'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    SMA
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuestionnaireOpen(!isQuestionnaireOpen)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isQuestionnaireOpen ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Tutup Lembar Wawancara</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Buka Lembar Wawancara (11 Soal)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Questionnaire Body (When Expanded) */}
            {isQuestionnaireOpen && (
              <div className="p-4 sm:p-5 space-y-4 bg-[#111114]">
                <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-purple-300">
                      {activeQuestionnaireConfig.title} &bull; {activeQuestionnaireConfig.subtitle}
                    </p>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      {activeQuestionnaireConfig.focusArea}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleApplyAnswersToNotes}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-purple-400/30 cursor-pointer shadow"
                      title="Salin jawaban kuisioner yang terisi ke kolom Catatan Proses Konseling di bawah"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Terapkan ke Catatan Sesi</span>
                    </button>
                  </div>
                </div>

                {/* 11 Questions List with Input Response Boxes and Scale 1-5 Selector */}
                <div className="space-y-3 pt-1">
                  {activeQuestionnaireConfig.questions.map((q, index) => {
                    const isExpanded = expandedQuestionId === q.id;
                    const currentValue = questionnaireAnswers[q.id] || '';
                    const hasAnswer = currentValue.trim().length > 0;
                    const scaleMatch = currentValue.match(/\[Skala:\s*(\d)\/5\]/);
                    const currentScale = scaleMatch ? parseInt(scaleMatch[1], 10) : 0;
                    const textAnswer = currentValue.replace(/\[Skala:\s*\d\/5\]\s*/, '');
                    const isLowScale = currentScale === 1 || currentScale === 2;

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          hasAnswer
                            ? isLowScale
                              ? 'bg-amber-950/20 border-amber-500/40'
                              : 'bg-purple-950/15 border-purple-500/30'
                            : 'bg-[#16161A] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                                {q.category}
                              </span>
                              {currentScale > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                  isLowScale
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : currentScale === 3
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  Skala: {currentScale}/5
                                  {isLowScale && ' (Perlu Perhatian)'}
                                </span>
                              )}
                              {hasAnswer && (
                                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Terisi
                                </span>
                              )}
                            </div>

                            <p className="font-semibold text-sm text-white pt-0.5">
                              {q.question}
                            </p>

                            <p className="text-[11px] text-gray-400 italic">
                              <strong>Tujuan BK:</strong> {q.purpose}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleInsertQuestionToNotes(q)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-white/10 cursor-pointer"
                              title="Sisipkan pertanyaan ini langsung ke Catatan Konseling"
                            >
                              {copiedQuestionId === q.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Disisipkan</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-gray-400" />
                                  <span>Sisipkan</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                              title="Lihat tips penggalian & kolom respon"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Scale Rating & Answer Box */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                          {/* Scale 1-5 Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                            <span className="text-[11px] text-gray-300 font-medium">
                              Penilaian Skala Kondisi Santri (1-5):
                            </span>
                            <div className="flex items-center gap-1">
                              {[
                                { num: 1, label: '1 - Sangat Kurang / Berat', short: '1' },
                                { num: 2, label: '2 - Kurang / Butuh Bantuan', short: '2' },
                                { num: 3, label: '3 - Cukup / Sedang', short: '3' },
                                { num: 4, label: '4 - Baik / Nyaman', short: '4' },
                                { num: 5, label: '5 - Sangat Baik / Optimal', short: '5' }
                              ].map(s => {
                                const isSelected = currentScale === s.num;
                                return (
                                  <button
                                    key={s.num}
                                    type="button"
                                    onClick={() => handleSetQuestionScale(q.id, s.num)}
                                    title={s.label}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                      isSelected
                                        ? s.num <= 2
                                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                          : s.num === 3
                                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    {s.short}
                                  </button>
                                );
                              })}
                              {currentScale > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetQuestionScale(q.id, 0)}
                                  className="text-[10px] text-gray-500 hover:text-gray-300 ml-1 underline cursor-pointer"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>

                          {q.guidanceTip && (
                            <div className="p-2 bg-black/30 rounded-lg text-[11px] text-amber-300/90 flex items-start gap-1.5 border border-amber-500/15">
                              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span><strong>Tips Konselor:</strong> {q.guidanceTip}</span>
                            </div>
                          )}

                          <div className="relative">
                            <textarea
                              rows={2}
                              value={textAnswer}
                              onChange={e => handleSetQuestionText(q.id, e.target.value)}
                              placeholder={q.placeholderResponse ? `Catat respon / curhatan santri... Contoh: "${q.placeholderResponse}"` : "Catat respon / curhatan santri..."}
                              className="w-full bg-[#0D0D10] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Tanggal Sesi
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Semester & Tahun
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Ganjil">Semester Ganjil ({academicYear})</option>
                <option value="Genap">Semester Genap ({academicYear})</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Jenis Masalah / Bimbingan
              </label>
              <select
                value={counselingType}
                onChange={e => setCounselingType(e.target.value as BKProblemType)}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {PROBLEM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Tingkat Urgensi Kasus
              </label>
              <select
                value={urgencyLevel}
                onChange={e => setUrgencyLevel(e.target.value as BKUrgencyLevel)}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {URGENCY_LEVELS.map(u => (
                  <option key={u.level} value={u.level}>{u.level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Problem Description / Routine Topic & Counseling Notes */}
          {(() => {
            const isRoutineSession =
              counselingType.includes('Rutin') ||
              counselingType.includes('Minat') ||
              counselingType.includes('Manajemen') ||
              counselingType.includes('Kesejahteraan') ||
              urgencyLevel.includes('Rutin');

            return (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-300">
                      {isRoutineSession ? (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 1. Fokus Bimbingan Rutin / Topik Diskusi Berkala <span className="text-red-400">*</span>
                        </span>
                      ) : (
                        <span>1. Latar Belakang / Pokok Masalah yang Dihadapi <span className="text-red-400">*</span></span>
                      )}
                    </label>
                    <span className="text-[11px] text-gray-400 font-normal">
                      {isRoutineSession
                        ? 'Agenda pendampingan berkala (kesejahteraan belajar full day, minat bakat, relasi)'
                        : 'Pemicu pemanggilan atau keluhan awal siswa'}
                    </span>
                  </div>

                  {/* Quick routine topic chips */}
                  {isRoutineSession && (
                    <div className="flex flex-wrap gap-1.5 pt-1 pb-0.5">
                      {[
                        'Check-in Rutin Kesejahteraan Belajar Seharian',
                        'Manajemen Waktu PR Sore & Jam Tidur Malam',
                        'Konsultasi Minat, Bakat & Cita-cita Karir',
                        'Kenyamanan Pertemanan & Suasana Kelas Full Day'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            if (!problemDescription) {
                              setProblemDescription(chip);
                            } else if (!problemDescription.includes(chip)) {
                              setProblemDescription(prev => `${prev} • ${chip}`);
                            }
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-300 hover:text-purple-300 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={problemDescription}
                    onChange={e => setProblemDescription(e.target.value)}
                    rows={2}
                    placeholder={
                      isRoutineSession
                        ? "Contoh: Bimbingan rutin berkala semester ganjil. Siswa diajak berdialog santai mengenai adaptasi ritme belajar full day, kenyamanan kelas, dan minat ekstrakurikuler..."
                        : "Contoh: Siswa kerap terlambat, sering terlihat lesu di jam siang, atau mengalami akumulasi catatan kedisiplinan..."
                    }
                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300 flex items-center justify-between">
                    <span>
                      {isRoutineSession
                        ? '2. Catatan Proses Bimbingan & Dialog Siswa'
                        : '2. Catatan Proses Sesi Bimbingan Konseling & Dialog'}{' '}
                      <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      {isRoutineSession
                        ? 'Dinamika perbincangan, respon siswa atas instrumen, arahan positif BK'
                        : 'Metode pendekatan, dialog santri, respon wawancara'}
                    </span>
                  </label>
                  <textarea
                    value={counselingNotes}
                    onChange={e => setCounselingNotes(e.target.value)}
                    rows={4}
                    placeholder={
                      isRoutineSession
                        ? "Contoh: Wawancara bimbingan berlangsung hangat dan terbuka. Siswa merasa menikmati kegiatan belajar, namun perlu panduan mengatur waktu belajar mandiri di rumah setelah tiba sore hari. Diberikan motivasi adab belajar dan teknik relaksasi..."
                        : "Contoh: Dilakukan wawancara konseling empatik. Ditemukan akar masalah kelelahan akibat screen-time larut malam. Diberikan pengarahan dan komitmen bersama..."
                    }
                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>

                {/* Row 4: Student Commitment & Action Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      {isRoutineSession
                        ? '3. Refleksi & Rencana Pengembangan Diri Siswa'
                        : '3. Komitmen & Pengakuan Siswa'}
                    </label>
                    <textarea
                      value={studentCommitment}
                      onChange={e => setStudentCommitment(e.target.value)}
                      rows={2}
                      placeholder={
                        isRoutineSession
                          ? "Pernyataan refleksi siswa, komitmen disiplin jam tidur malam (maks 21.30), target nilai..."
                          : "Pernyataan kesanggupan siswa, janji perbaikan sikap, atau iktikad baik..."
                      }
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      {isRoutineSession
                        ? '4. Rencana Pendampingan & Pemantauan Lanjutan'
                        : '4. Rencana Tindak Lanjut & Monitoring'}
                    </label>
                    <textarea
                      value={actionPlan}
                      onChange={e => setActionPlan(e.target.value)}
                      rows={2}
                      placeholder={
                        isRoutineSession
                          ? "Jadwal check-in rutin berikutnya, komunikasi hangat dengan wali kelas atau orang tua..."
                          : "Rencana pembinaan lanjutan, kolaborasi dengan wali kelas / orang tua..."
                      }
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Status & Follow-up Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#16161A] border border-white/5 rounded-xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Status Kasus Saat Ini
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BKSessionStatus)}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Target Evaluasi / Follow-up Berikutnya (Opsional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* AI BK SUMMARY GENERATOR SECTION */}
          <div className="p-5 bg-gradient-to-br from-purple-950/30 via-[#16161A] to-[#121215] border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Asisten AI Guru BK & Evaluasi Semester
                  </h4>
                  <p className="text-xs text-gray-400">
                    Otomatis rangkum intisari sesi, analisis psikologis berdasarkan instrumen {counselingLevel}, & buat draf evaluasi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAISummary}
                disabled={isGeneratingAi || (!problemDescription && !counselingNotes && Object.keys(questionnaireAnswers).length === 0)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 shrink-0 border border-purple-400/30 cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Konseling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{aiAnalysis ? 'Regenerate Ringkasan AI' : 'Generate Ringkasan & Draf Evaluasi AI'}</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Results Box */}
            {aiAnalysis && (
              <div className="space-y-4 pt-3 border-t border-purple-500/20">
                {/* Header with Mode Filters and Quick Copy */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0D0D10] p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-purple-300">Tampilan Hak Akses:</span>
                    <div className="flex bg-[#16161A] p-0.5 rounded-lg border border-white/10 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setAiViewMode('all')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          aiViewMode === 'all'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Semua Bagian (Lengkap)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiViewMode('internal')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          aiViewMode === 'internal'
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Internal BK
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiViewMode('parent')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          aiViewMode === 'parent'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <User className="w-3 h-3" /> Wali Santri
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAiFormattedReport}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    title="Salin seluruh format laporan 4 bagian ke clipboard"
                  >
                    {copiedAiReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Laporan Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-300" />
                        <span>Salin Format Laporan</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1. ANALISIS INSTRUMEN SANTRI */}
                {(aiViewMode === 'all' || aiViewMode === 'internal') && (
                  <div className="p-4 bg-[#0D0D10] border border-purple-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-400" /> 1. [ANALISIS INSTRUMEN SANTRI]
                      </span>
                      {aiAnalysis.instrumentAnalysis?.urgencyLevel && (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          aiAnalysis.instrumentAnalysis.urgencyLevel.includes('Sangat Perlu') || aiAnalysis.instrumentAnalysis.urgencyLevel.includes('Tinggi')
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          Urgensi: {aiAnalysis.instrumentAnalysis.urgencyLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed space-y-1">
                      <p>
                        <strong className="text-gray-200">Ringkasan Kondisi Santri:</strong>{' '}
                        {aiAnalysis.instrumentAnalysis?.conditionSummary || aiAnalysis.summaryText}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. CATATAN INTERNAL BK & KESISWAAN */}
                {(aiViewMode === 'all' || aiViewMode === 'internal') && (
                  <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-rose-400" /> 2. [CATATAN INTERNAL BK & KESISWAAN]
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Rahasia &bull; Khusus Konselor
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {aiAnalysis.internalBK?.caseStatus && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-semibold">Status Kasus:</span>
                          <span className="px-2 py-0.5 rounded bg-black/40 text-rose-200 font-bold border border-rose-500/20">
                            {aiAnalysis.internalBK.caseStatus}
                          </span>
                        </div>
                      )}

                      <div className="p-3 bg-black/40 rounded-lg border border-rose-500/20 space-y-1">
                        <span className="text-[11px] font-bold text-rose-300">Analisis Detail & Catatan Sensitif:</span>
                        <p className="text-gray-200 leading-relaxed">
                          {aiAnalysis.internalBK?.detailedAnalysisAndSensitiveNotes || aiAnalysis.psychologicalFactors}
                        </p>
                      </div>

                      <div className="p-3 bg-black/40 rounded-lg border border-rose-500/20 space-y-1">
                        <span className="text-[11px] font-bold text-amber-300">Rencana Intervensi Sekolah:</span>
                        <p className="text-gray-200 leading-relaxed">
                          {aiAnalysis.internalBK?.schoolInterventionPlan || (aiAnalysis.followUpRecommendations?.join(' • ') || '-')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TAMPILAN WALI SANTRI (STRICT PRIVACY) */}
                {(aiViewMode === 'all' || aiViewMode === 'parent') && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-400" /> 3. [TAMPILAN WALI SANTRI - STRICT PRIVACY]
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Aman & Bersih Dari Masalah Sensitif
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-semibold">Status Progres:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {aiAnalysis.parentView?.progressStatus || 'Progres Membaik'}
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/20 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-300">Ringkasan Perkembangan:</span>
                        <p className="text-gray-200 leading-relaxed">
                          {aiAnalysis.parentView?.developmentSummary || aiAnalysis.evaluationReportSnippet}
                        </p>
                      </div>

                      {aiAnalysis.parentView?.homeAssistanceTips && aiAnalysis.parentView.homeAssistanceTips.length > 0 && (
                        <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/20 space-y-1.5">
                          <span className="text-[11px] font-bold text-sky-300">Saran Pendampingan di Rumah:</span>
                          <ol className="list-decimal pl-4 space-y-1 text-gray-200">
                            {aiAnalysis.parentView.homeAssistanceTips.map((tip, idx) => (
                              <li key={idx} className="leading-relaxed">{tip}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. PERTANYAAN EVALUASI GURU BK */}
                {(aiViewMode === 'all' || aiViewMode === 'internal') && (
                  <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-sky-400" /> 4. [PERTANYAAN EVALUASI GURU BK]
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Poin klarifikasi / verifikasi lapangan yang disarankan AI untuk dievaluasi oleh Guru BK bersama Wali Kelas:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-gray-200">
                      {(aiAnalysis.counselorEvaluationQuestions || [
                        'Bagaimana respon dan fokus santri saat jam pelajaran siang setelah sesi konseling?',
                        'Apakah santri sudah mulai menerapkan komitmen manajemen waktu istirahat malam di rumah?'
                      ]).map((q, idx) => (
                        <li key={idx} className="leading-relaxed">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer border border-purple-400/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editNote ? 'Perbarui Catatan BK' : 'Simpan Catatan Konseling BK'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
