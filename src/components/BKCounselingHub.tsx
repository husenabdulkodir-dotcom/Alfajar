import React, { useState, useMemo, useEffect } from 'react';
import {
  Santri,
  PointRecord,
  BKCounselingNote,
  BKUrgencyLevel,
  BKSessionStatus,
  BKProblemType
} from '../types';
import {
  BK_QUESTIONNAIRES,
  BKQuestionItem
} from '../utils/bkQuestionnaireData';
import {
  loadBKQuestionnaires,
  QuestionnaireBank
} from '../utils/storage';
import { BKScheduleManager } from './BKScheduleManager';
import { BKQuestionnaireEditorModal } from './BKQuestionnaireEditorModal';
import {
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Sparkles,
  Printer,
  Copy,
  Check,
  Calendar,
  User,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Download,
  Loader2,
  FileSpreadsheet,
  BookOpen,
  CheckCircle2,
  Info,
  Layers,
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface BKCounselingHubProps {
  santriList: Santri[];
  records: PointRecord[];
  bkNotes: BKCounselingNote[];
  academicYear: string;
  onOpenNewBKModal: (santriId?: string) => void;
  onEditBKNote: (note: BKCounselingNote) => void;
  onDeleteBKNote: (noteId: string) => void;
  onSelectSantriDetail: (santri: Santri) => void;
}

type BKTab = 'jadwal_rutin' | 'daftar_konseling' | 'laporan_evaluasi' | 'format_pertanyaan';

export const BKCounselingHub: React.FC<BKCounselingHubProps> = ({
  santriList,
  records,
  bkNotes,
  academicYear,
  onOpenNewBKModal,
  onEditBKNote,
  onDeleteBKNote,
  onSelectSantriDetail
}) => {
  const [activeTab, setActiveTab] = useState<BKTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sistem_poin_bk_active_tab') as BKTab;
      if (saved && ['jadwal_rutin', 'daftar_konseling', 'laporan_evaluasi', 'format_pertanyaan'].includes(saved)) {
        return saved;
      }
    }
    return 'daftar_konseling';
  });

  const handleTabChange = (tab: BKTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sistem_poin_bk_active_tab', tab);
    }
  };

  // Dynamic Questionnaire Bank State
  const [questionnaireBank, setQuestionnaireBank] = useState<QuestionnaireBank>(loadBKQuestionnaires());
  const [isQuestionnaireEditorOpen, setIsQuestionnaireEditorOpen] = useState(false);

  useEffect(() => {
    const handleSyncBank = () => {
      setQuestionnaireBank(loadBKQuestionnaires());
    };
    window.addEventListener('sistem_poin_bk_questionnaires_updated', handleSyncBank);
    return () => window.removeEventListener('sistem_poin_bk_questionnaires_updated', handleSyncBank);
  }, []);

  // Filter States for Tab 2 (Daftar Konseling)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');

  // Filter States for Tab 3 (Laporan Evaluasi Semester)
  const [evalAcademicYear, setEvalAcademicYear] = useState<string>(academicYear);
  const [evalSemester, setEvalSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [evalOnlyProblematic, setEvalOnlyProblematic] = useState<boolean>(false);

  // States for Tab 4 (Format Pertanyaan Wawancara BK)
  const [activeQuestionnaireLevel, setActiveQuestionnaireLevel] = useState<'SMP' | 'SMA'>('SMP');
  const [selectedQuestionnaireCategory, setSelectedQuestionnaireCategory] = useState<string>('ALL');
  const [copiedAllQuestions, setCopiedAllQuestions] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // AI Master Semester Report State
  const [isGeneratingSemesterAi, setIsGeneratingSemesterAi] = useState<boolean>(false);
  const [semesterAiReport, setSemesterAiReport] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedFullReport, setCopiedFullReport] = useState(false);

  // Available Classes from Santri List
  const availableClasses = useMemo(() => {
    const classList = Array.from(new Set(santriList.map(s => s.class).filter(Boolean)));
    return classList.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [santriList]);

  // Santri Map for rapid lookup
  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach(s => map.set(s.id, s));
    return map;
  }, [santriList]);

  // Filtered Notes for Tab 1
  const filteredNotes = useMemo(() => {
    return bkNotes.filter(note => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = note.santriName.toLowerCase().includes(q);
        const matchClass = note.santriClass.toLowerCase().includes(q);
        const matchProblem = note.problemDescription.toLowerCase().includes(q);
        const matchCounselor = note.counselorName.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchProblem && !matchCounselor) return false;
      }
      // Class
      if (selectedClass !== 'ALL' && note.santriClass !== selectedClass) return false;
      // Urgency
      if (selectedUrgency !== 'ALL' && note.urgencyLevel !== selectedUrgency) return false;
      // Status
      if (selectedStatus !== 'ALL' && note.status !== selectedStatus) return false;
      // Semester
      if (selectedSemester !== 'ALL' && note.semester !== selectedSemester) return false;

      return true;
    }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [bkNotes, searchQuery, selectedClass, selectedUrgency, selectedStatus, selectedSemester]);

  // Filtered Records for Semester Evaluation (Tab 2) - Optimized O(N + M)
  const semesterEvaluations = useMemo(() => {
    // 1. Get all notes for this semester & academic year
    const notesInSemester = bkNotes.filter(
      n => n.academicYear === evalAcademicYear && n.semester === evalSemester
    );

    // Group notes by santri
    const groupedNotes = new Map<string, BKCounselingNote[]>();
    for (const n of notesInSemester) {
      let arr = groupedNotes.get(n.santriId);
      if (!arr) {
        arr = [];
        groupedNotes.set(n.santriId, arr);
      }
      arr.push(n);
    }

    // Index records for this semester & academic year by santriId in a single pass
    const recordsInSemesterBySantri = new Map<string, PointRecord[]>();
    for (const r of records) {
      if (r.academicYear === evalAcademicYear && r.semester === evalSemester) {
        let list = recordsInSemesterBySantri.get(r.santriId);
        if (!list) {
          list = [];
          recordsInSemesterBySantri.set(r.santriId, list);
        }
        list.push(r);
      }
    }

    // 2. Map all santri who either have BK notes in this semester OR have severe violations in this semester
    const results: {
      santri: Santri;
      notes: BKCounselingNote[];
      totalViolations: number;
      totalGoodDeeds: number;
      netPoints: number;
      heavyViolationsCount: number;
      mostCriticalUrgency: BKUrgencyLevel;
      isCriticalProblem: boolean;
    }[] = [];

    for (const s of santriList) {
      const sNotes = groupedNotes.get(s.id) || [];
      const sRecords = recordsInSemesterBySantri.get(s.id) || [];
      
      let sViolationsCount = 0;
      let sGoodDeedsCount = 0;
      let netPoints = 0;
      let heavyViolationsCount = 0;

      for (const r of sRecords) {
        if (r.type === 'Pelanggaran') {
          sViolationsCount++;
          netPoints += r.points; // r.points is negative for Pelanggaran
        } else if (r.type === 'Kebaikan') {
          sGoodDeedsCount++;
          netPoints += r.points; // r.points is positive for Kebaikan
        }

        if (r.isHeavyViolation || r.category === 'Berat') {
          heavyViolationsCount++;
        }
      }

      const hasNotes = sNotes.length > 0;
      const isProblematic = netPoints < 0 || heavyViolationsCount > 0 || sViolationsCount >= 3;

      if (!evalOnlyProblematic || hasNotes || isProblematic) {
        // Determine most critical urgency level from notes
        let mostCritical: BKUrgencyLevel = 'Rendah';
        if (sNotes.some(n => n.urgencyLevel === 'Kritis (Perlu Tindak Lanjut)')) {
          mostCritical = 'Kritis (Perlu Tindak Lanjut)';
        } else if (sNotes.some(n => n.urgencyLevel === 'Tinggi')) {
          mostCritical = 'Tinggi';
        } else if (sNotes.some(n => n.urgencyLevel === 'Sedang')) {
          mostCritical = 'Sedang';
        } else if (isProblematic) {
          mostCritical = heavyViolationsCount > 0 || netPoints <= -50 ? 'Kritis (Perlu Tindak Lanjut)' : 'Sedang';
        }

        results.push({
          santri: s,
          notes: sNotes.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()),
          totalViolations: sViolationsCount,
          totalGoodDeeds: sGoodDeedsCount,
          netPoints,
          heavyViolationsCount,
          mostCriticalUrgency: mostCritical,
          isCriticalProblem: isProblematic || sNotes.some(n => n.urgencyLevel === 'Kritis (Perlu Tindak Lanjut)')
        });
      }
    }

    // Sort by criticality first, then net points ascending
    return results.sort((a, b) => {
      if (a.isCriticalProblem && !b.isCriticalProblem) return -1;
      if (!a.isCriticalProblem && b.isCriticalProblem) return 1;
      return a.netPoints - b.netPoints;
    });
  }, [santriList, records, bkNotes, evalAcademicYear, evalSemester, evalOnlyProblematic]);

  // Handle AI Semester Master Summary Generation
  const handleGenerateSemesterAiReport = async () => {
    if (semesterEvaluations.length === 0) {
      alert('Tidak ada data santri yang dapat dievaluasi pada semester ini.');
      return;
    }

    setIsGeneratingSemesterAi(true);
    try {
      const payload = semesterEvaluations.slice(0, 15).map(item => ({
        santriName: item.santri.name,
        santriClass: item.santri.class,
        netPoints: item.netPoints,
        totalViolations: item.totalViolations,
        heavyViolationsCount: item.heavyViolationsCount,
        urgency: item.mostCriticalUrgency,
        bkNotesCount: item.notes.length,
        bkSummaries: item.notes.map(n => ({
          date: n.sessionDate,
          type: n.counselingType,
          status: n.status,
          problem: n.problemDescription,
          evaluationSnippet: n.aiAnalysis?.evaluationReportSnippet || n.actionPlan
        }))
      }));

      const res = await fetch('/api/ai-bk-semester-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: evalAcademicYear,
          semester: evalSemester,
          santriRecordsWithBK: payload
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSemesterAiReport(data.reportText);
      } else {
        alert('Gagal membuat laporan AI: ' + (data.error || 'Terjadi kesalahan sistem.'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghubungi layanan AI.');
    } finally {
      setIsGeneratingSemesterAi(false);
    }
  };

  // Copy evaluation snippet
  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Copy full executive report
  const handleCopyFullReport = () => {
    if (!semesterAiReport) return;
    navigator.clipboard.writeText(semesterAiReport);
    setCopiedFullReport(true);
    setTimeout(() => setCopiedFullReport(false), 2000);
  };

  // Export to Excel for Meeting Recap
  const handleExportEvaluationExcel = () => {
    const rows = semesterEvaluations.map((item, idx) => {
      const latestNote = item.notes[0];
      return {
        'No': idx + 1,
        'Nama Santri': item.santri.name,
        'Kelas': item.santri.class,
        'NIS': item.santri.nis || '-',
        'Poin Net Semester': item.netPoints,
        'Total Pelanggaran': item.totalViolations,
        'Pelanggaran Berat': item.heavyViolationsCount,
        'Total Sesi BK': item.notes.length,
        'Tingkat Urgensi': item.mostCriticalUrgency,
        'Status Pembinaan': latestNote ? latestNote.status : 'Perlu Bimbingan',
        'Latar Masalah': latestNote ? latestNote.problemDescription : '-',
        'Draf Evaluasi Kesiswaan': latestNote?.aiAnalysis?.evaluationReportSnippet || latestNote?.actionPlan || 'Dalam pemantauan disiplin semester'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `BK_Evaluasi_${evalSemester}`);
    XLSX.writeFile(workbook, `Rekap_Evaluasi_BK_Semester_${evalSemester}_${evalAcademicYear.replace('/', '_')}.xlsx`);
  };

  // Format Pertanyaan Helpers
  const activeQuestionnaire = questionnaireBank[activeQuestionnaireLevel] || BK_QUESTIONNAIRES[activeQuestionnaireLevel];
  const questionnaireCategories = useMemo(() => {
    const cats = Array.from(new Set(activeQuestionnaire.questions.map(q => q.category)));
    return ['ALL', ...cats];
  }, [activeQuestionnaire]);

  const filteredQuestions = useMemo(() => {
    if (selectedQuestionnaireCategory === 'ALL') return activeQuestionnaire.questions;
    return activeQuestionnaire.questions.filter(q => q.category === selectedQuestionnaireCategory);
  }, [activeQuestionnaire, selectedQuestionnaireCategory]);

  const handleCopyAllQuestions = () => {
    const header = `FORMAT PERTANYAAN WAWANCARA BIMBINGAN KONSELING (BK)\n${activeQuestionnaire.title.toUpperCase()}\n${activeQuestionnaire.subtitle}\n\nFokus: ${activeQuestionnaire.focusArea}\n\n`;
    const list = activeQuestionnaire.questions
      .map((q, idx) => `${idx + 1}. [${q.category}]\n   Pertanyaan: "${q.question}"\n   Tujuan BK: ${q.purpose}\n   Tips Konselor: ${q.guidanceTip || '-'}`)
      .join('\n\n');

    navigator.clipboard.writeText(`${header}${list}`);
    setCopiedAllQuestions(true);
    setTimeout(() => setCopiedAllQuestions(false), 2500);
  };

  const handleCopySingleQuestion = (q: BKQuestionItem) => {
    const text = `[Pertanyaan BK - ${activeQuestionnaireLevel}]\nTopik: ${q.category}\nPertanyaan: ${q.question}\nTujuan: ${q.purpose}`;
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(q.id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  // Stats calculation
  const totalNotes = bkNotes.length;
  const criticalNotesCount = bkNotes.filter(
    n => n.urgencyLevel === 'Kritis (Perlu Tindak Lanjut)' || n.urgencyLevel === 'Tinggi'
  ).length;
  const resolvedCount = bkNotes.filter(n => n.status === 'Selesai' || n.status === 'Progres Membaik').length;
  const needMeetingCount = bkNotes.filter(
    n => n.status === 'Diagendakan Rapat Kesiswaan' || n.status === 'Perlu Pemanggilan Ortu'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Intro Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Bimbingan Konseling (BK) & Check-in Siswa Full Day
              </h2>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Layanan Bimbingan Sekolah Full Day
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pendampingan holistik untuk <strong className="text-emerald-700">seluruh siswa</strong> SMP & SMA melalui jadwal check-in rutin berkala, instrumen evaluasi adaptasi belajar full day, serta draf laporan resmi untuk rapat dewan guru kesiswaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenNewBKModal()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 border border-purple-600 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Sesi Bimbingan Baru</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Total Sesi Bimbingan</span>
            <div className="text-xl font-bold text-slate-900">{totalNotes} <span className="text-xs font-normal text-slate-500">sesi</span></div>
          </div>

          <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> Perlu Perhatian Khusus
            </span>
            <div className="text-xl font-bold text-rose-700">{criticalNotesCount} <span className="text-xs font-normal text-rose-600">siswa</span></div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> Progres Positif / Selesai
            </span>
            <div className="text-xl font-bold text-emerald-700">{resolvedCount} <span className="text-xs font-normal text-emerald-600">sesi</span></div>
          </div>

          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-700" /> Perlu Kolaborasi / Ortu
            </span>
            <div className="text-xl font-bold text-amber-800">{needMeetingCount} <span className="text-xs font-normal text-amber-700">kasus</span></div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleTabChange('daftar_konseling')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'daftar_konseling'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Daftar Catatan Konseling ({filteredNotes.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('jadwal_rutin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'jadwal_rutin'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>Jadwal & Cakupan Check-in Rutin</span>
          </button>

          <button
            onClick={() => handleTabChange('laporan_evaluasi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'laporan_evaluasi'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Laporan Evaluasi Per-Semester (Rapat Guru)</span>
          </button>

          <button
            onClick={() => handleTabChange('format_pertanyaan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'format_pertanyaan'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Format Wawancara BK (SMP & SMA)</span>
          </button>
        </div>
      </div>

      {/* TAB 0: JADWAL & CAKUPAN CHECK-IN RUTIN SISWA */}
      {activeTab === 'jadwal_rutin' && (
        <BKScheduleManager
          santriList={santriList}
          records={records}
          bkNotes={bkNotes}
          academicYear={academicYear}
          onOpenNewBKModal={onOpenNewBKModal}
          onSelectSantriDetail={onSelectSantriDetail}
        />
      )}

      {/* TAB 1: DAFTAR CATATAN KONSELING BK */}
      {activeTab === 'daftar_konseling' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri, kelas, masalah, atau konselor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Filter Kelas */}
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>

              {/* Filter Urgensi */}
              <select
                value={selectedUrgency}
                onChange={e => setSelectedUrgency(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">Semua Urgensi</option>
                <option value="Kritis (Perlu Tindak Lanjut)">Kritis</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>

              {/* Filter Status */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="Dalam Pantauan">Dalam Pantauan</option>
                <option value="Progres Membaik">Progres Membaik</option>
                <option value="Selesai">Selesai</option>
                <option value="Perlu Pemanggilan Ortu">Perlu Panggil Ortu</option>
                <option value="Diagendakan Rapat Kesiswaan">Rapat Kesiswaan</option>
              </select>

              {/* Filter Semester */}
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">Semua Semester</option>
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>

          {/* List of BK Notes */}
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
              <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-slate-900 font-bold text-sm">Belum Ada Catatan Konseling BK yang Cocok</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan tambahkan catatan konseling baru saat melakukan bimbingan santri bermasalah atau ubah filter pencarian.
              </p>
              <button
                onClick={() => onOpenNewBKModal()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Catatan Konseling Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredNotes.map(note => {
                const targetSantri = santriMap.get(note.santriId);
                const isUrgent = note.urgencyLevel === 'Kritis (Perlu Tindak Lanjut)' || note.urgencyLevel === 'Tinggi';
                const hasAnswers = note.questionnaireAnswers && Object.keys(note.questionnaireAnswers).length > 0;

                return (
                  <div
                    key={note.id}
                    className="bg-white border border-slate-200 hover:border-purple-300 shadow-sm transition-all rounded-2xl p-5 space-y-4"
                  >
                    {/* Note Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-purple-700 text-xs">
                          {note.santriName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => targetSantri && onSelectSantriDetail(targetSantri)}
                              className="font-bold text-slate-900 hover:text-purple-700 transition-colors cursor-pointer text-sm"
                            >
                              {note.santriName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Kelas {note.santriClass}
                            </span>
                            {note.counselingLevel && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                note.counselingLevel === 'SMP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                Format {note.counselingLevel}
                              </span>
                            )}
                            {hasAnswers && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 text-purple-600" /> Kuisioner Terisi ({Object.keys(note.questionnaireAnswers!).length} soal)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Sesi: {new Date(note.sessionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span>&bull;</span>
                            <span>Semester {note.semester} ({note.academicYear})</span>
                            <span>&bull;</span>
                            <span>Konselor: {note.counselorName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {note.urgencyLevel}
                        </span>

                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {note.status}
                        </span>

                        <button
                          onClick={() => onEditBKNote(note)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                          title="Edit Catatan BK"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus catatan BK untuk ${note.santriName}?`)) {
                              onDeleteBKNote(note.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Left: Problem & Notes */}
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Pokok Masalah ({note.counselingType})
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {note.problemDescription}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Catatan Proses Bimbingan Konseling
                          </span>
                          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {note.counselingNotes}
                          </p>
                        </div>
                      </div>

                      {/* Right: Commitment, Action Plan, & AI Snippet */}
                      <div className="space-y-3">
                        {note.studentCommitment && (
                          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                              Komitmen & Pengakuan Santri
                            </span>
                            <p className="text-slate-800 leading-relaxed italic font-serif">
                              "{note.studentCommitment}"
                            </p>
                          </div>
                        )}

                        {note.actionPlan && (
                          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                              Rencana Tindak Lanjut & Monitoring
                            </span>
                            <p className="text-slate-800 leading-relaxed">
                              {note.actionPlan}
                            </p>
                            {note.followUpDate && (
                              <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Target Evaluasi: {new Date(note.followUpDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Summary Box */}
                        {note.aiAnalysis?.evaluationReportSnippet && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-600" /> Draf Laporan Evaluasi Semester (AI)
                              </span>
                              <button
                                onClick={() => handleCopySnippet(note.aiAnalysis!.evaluationReportSnippet, note.id)}
                                className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                              >
                                {copiedSnippetId === note.id ? 'Tersalin!' : 'Salin Draf'}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-800 leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-purple-100 shadow-xs">
                              "{note.aiAnalysis.evaluationReportSnippet}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LAPORAN EVALUASI PER-SEMESTER (RAPAT DEWAN GURU) */}
      {activeTab === 'laporan_evaluasi' && (
        <div className="space-y-6">
          {/* Filter & Action Bar for Semester Evaluation */}
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={evalAcademicYear}
                  onChange={e => setEvalAcademicYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white w-32 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Semester</label>
                <select
                  value={evalSemester}
                  onChange={e => setEvalSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white font-medium"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div className="pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={evalOnlyProblematic}
                    onChange={e => setEvalOnlyProblematic(e.target.checked)}
                    className="rounded bg-white border-slate-300 text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Hanya Tampilkan Santri Bermasalah / Poin Minus</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerateSemesterAiReport}
                disabled={isGeneratingSemesterAi || semesterEvaluations.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 border border-purple-600 cursor-pointer"
              >
                {isGeneratingSemesterAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyusun Laporan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Notulensi Rapat AI</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportEvaluationExcel}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>

          {/* AI Master Executive Report Banner */}
          {semesterAiReport && (
            <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3 print:hidden shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Executive Summary & Notulensi Evaluasi Semester (AI Kesiswaan & BK)
                  </h3>
                </div>
                <button
                  onClick={handleCopyFullReport}
                  className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1 border border-purple-200 cursor-pointer shadow-xs"
                >
                  {copiedFullReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFullReport ? 'Tersalin!' : 'Salin Semua'}</span>
                </button>
              </div>
              <div className="p-4 bg-white rounded-xl border border-purple-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans shadow-xs">
                {semesterAiReport}
              </div>
            </div>
          )}

          {/* Printable Report Header & Evaluation Table */}
          <div className="bg-white print:bg-white border border-slate-200 print:border-none shadow-sm rounded-2xl p-6 print:p-0 space-y-6">
            <div className="border-b border-slate-200 print:border-black pb-4 text-center space-y-1">
              <h2 className="text-lg font-bold text-slate-900 print:text-black uppercase tracking-wide">
                LAPORAN EVALUASI & CATATAN BIMBINGAN KONSELING KESISWAAN
              </h2>
              <p className="text-xs text-slate-600 print:text-gray-800">
                AL FAJAR ISLAMIC SCHOOL &bull; SEMESTER {evalSemester.toUpperCase()} TAHUN AJARAN {evalAcademicYear}
              </p>
              <p className="text-[11px] text-slate-500 print:text-gray-600 italic">
                Dokumen Rahasia - Khusus Kesiswaan, Dewan Guru, & Guru BK
              </p>
            </div>

            {/* Table of Problematic Students & BK Summaries */}
            {semesterEvaluations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada data santri yang memenuhi kriteria evaluasi pada Semester {evalSemester} ({evalAcademicYear}).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 print:border-black/30 bg-slate-50 print:bg-gray-100 text-slate-700 print:text-black font-bold">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 min-w-[160px]">Nama Santri & Kelas</th>
                      <th className="p-3 text-center min-w-[90px]">Poin Minus</th>
                      <th className="p-3 text-center min-w-[80px]">Sesi BK</th>
                      <th className="p-3 min-w-[200px]">Riwayat Masalah & Catatan BK</th>
                      <th className="p-3 min-w-[250px]">Draf Evaluasi Kesiswaan / Rekomendasi Rapat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-black/20 text-slate-800 print:text-black">
                    {semesterEvaluations.map((item, idx) => {
                      const latestNote = item.notes[0];
                      return (
                        <tr key={item.santri.id} className="hover:bg-slate-50/80 print:hover:bg-transparent align-top">
                          <td className="p-3 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 print:text-black">{item.santri.name}</div>
                            <div className="text-[11px] text-slate-500 print:text-gray-700">
                              Kelas {item.santri.class} &bull; NIS: {item.santri.nis || '-'}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                item.isCriticalProblem
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 print:bg-rose-100 print:text-rose-800'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200 print:bg-amber-100 print:text-amber-800'
                              }`}>
                                {item.mostCriticalUrgency}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            <div className={`font-bold ${item.netPoints < 0 ? 'text-rose-600 print:text-rose-700' : 'text-emerald-600 print:text-emerald-700'}`}>
                              {item.netPoints > 0 ? `+${item.netPoints}` : item.netPoints}
                            </div>
                            <div className="text-[10px] text-slate-500 print:text-gray-600">
                              {item.totalViolations} Pelanggaran
                              {item.heavyViolationsCount > 0 && (
                                <span className="text-rose-600 font-bold block">({item.heavyViolationsCount} Berat)</span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            <span className="font-semibold text-slate-900 print:text-black">
                              {item.notes.length} kali
                            </span>
                            {latestNote && (
                              <div className="text-[10px] text-slate-500 print:text-gray-600 mt-0.5">
                                Terakhir: {new Date(latestNote.sessionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' })}
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            {item.notes.length > 0 ? (
                              <div className="space-y-1.5">
                                {item.notes.slice(0, 2).map((n, nIdx) => (
                                  <div key={nIdx} className="text-[11px] leading-relaxed">
                                    <span className="font-semibold text-purple-700 print:text-purple-900">[{n.counselingType}]: </span>
                                    <span>{n.problemDescription}</span>
                                  </div>
                                ))}
                                {item.notes.length > 2 && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    +{item.notes.length - 2} sesi konseling lainnya...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Belum ada sesi konseling BK formal</span>
                            )}
                          </td>

                          <td className="p-3">
                            {latestNote?.aiAnalysis?.evaluationReportSnippet ? (
                              <div className="space-y-1.5">
                                <p className="text-[11px] leading-relaxed text-slate-800 print:text-black bg-slate-50 print:bg-gray-50 p-2 rounded-lg border border-slate-200 print:border-gray-200 font-sans">
                                  "{latestNote.aiAnalysis.evaluationReportSnippet}"
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 print:text-gray-600">
                                  <span>Status: <strong className="text-slate-900 print:text-black">{latestNote.status}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopySnippet(latestNote.aiAnalysis!.evaluationReportSnippet, item.santri.id)}
                                    className="print:hidden text-purple-600 hover:text-purple-800 hover:underline cursor-pointer font-semibold"
                                  >
                                    {copiedSnippetId === item.santri.id ? 'Tersalin!' : 'Salin Teks'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-600 print:text-black">
                                {latestNote?.actionPlan || 'Perlu pemantauan disiplin & evaluasi sikap di semester berikutnya.'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Footer for Print / Official Report */}
            <div className="pt-8 border-t border-slate-200 print:border-black grid grid-cols-3 gap-6 text-center text-xs text-slate-700 print:text-black mt-8">
              <div className="space-y-16">
                <div>Mengetahui,<br /><strong>Pimpinan / Kepala Sekolah Al Fajar Islamic School</strong></div>
                <div>( .................................................. )</div>
              </div>

              <div className="space-y-16">
                <div>Ditinjau Oleh,<br /><strong>Kepala Bagian Kesiswaan</strong></div>
                <div>( .................................................. )</div>
              </div>

              <div className="space-y-16">
                <div>Penyusun Laporan,<br /><strong>Guru Bimbingan Konseling (BK)</strong></div>
                <div>( <u>Ust. Abdul Kodir</u> )</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORMAT & PANDUAN PERTANYAAN WAWANCARA BK (SMP & SMA) */}
      {activeTab === 'format_pertanyaan' && (
        <div className="space-y-6">
          {/* Level Switcher & Action Toolbar */}
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Instrumen Wawancara:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setActiveQuestionnaireLevel('SMP');
                      setSelectedQuestionnaireCategory('ALL');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeQuestionnaireLevel === 'SMP'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tingkat SMP (Adaptasi & Emosi)</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveQuestionnaireLevel('SMA');
                      setSelectedQuestionnaireCategory('ALL');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeQuestionnaireLevel === 'SMA'
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tingkat SMA (Minat & Karir)</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {activeQuestionnaire.focusArea}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsQuestionnaireEditorOpen(true)}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Kustomisasi, tambah, atau sesuaikan butir pertanyaan wawancara"
              >
                <Edit2 className="w-4 h-4 text-purple-600" />
                <span>Kustomisasi Butir Soal</span>
              </button>

              <button
                onClick={handleCopyAllQuestions}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Salin seluruh format pertanyaan ke clipboard"
              >
                {copiedAllQuestions ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAllQuestions ? 'Soal Tersalin!' : 'Salin Semua Soal'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Cetak format instrumen wawancara BK"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Cetak Lembar Instrumen</span>
              </button>

              <button
                onClick={() => onOpenNewBKModal()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 border border-purple-600 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai Konseling Siswa</span>
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Dimensi:</span>
            {questionnaireCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedQuestionnaireCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedQuestionnaireCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'Semua Topik (11 Soal)' : cat}
              </button>
            ))}
          </div>

          {/* Questions Cards List (Screen View) */}
          <div className="grid grid-cols-1 gap-4 print:hidden">
            {filteredQuestions.map((q, index) => {
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 hover:border-purple-300 shadow-sm transition-all rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center border border-purple-200">
                          {activeQuestionnaire.questions.findIndex(item => item.id === q.id) + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                          {q.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeQuestionnaire.badgeColor}`}>
                          {activeQuestionnaireLevel}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 pt-1">
                        "{q.question}"
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-purple-700">Tujuan Asesmen BK:</strong> {q.purpose}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopySingleQuestion(q)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                        title="Salin pertanyaan ini"
                      >
                        {copiedQuestionId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Lihat detail panduan & tips konselor"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Guidance Box (Always or when expanded) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                      <span className="font-bold text-amber-800 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-600" /> Tips Penggalian Bagi Guru BK:
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {q.guidanceTip}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Contoh Indikator Respon Santri:
                      </span>
                      <p className="text-slate-800 leading-relaxed italic">
                        "{q.placeholderResponse}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printable Layout Sheet (Only visible during print) */}
          <div className="hidden print:block space-y-6 text-black">
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <h1 className="text-base font-bold uppercase tracking-wide">
                LEMBAR INSTRUMEN WAWANCARA BIMBINGAN KONSELING (BK)
              </h1>
              <h2 className="text-sm font-semibold">
                {activeQuestionnaire.title.toUpperCase()} — {activeQuestionnaire.subtitle.toUpperCase()}
              </h2>
              <p className="text-xs italic">
                Bagian Kesiswaan & Bimbingan Konseling Al Fajar Islamic School
              </p>
            </div>

            {/* Student Biodata Field */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-black p-3">
              <div>
                <div><strong>Nama Santri:</strong> ............................................................</div>
                <div className="mt-1"><strong>NIS / Kelas:</strong> ............................................................</div>
              </div>
              <div>
                <div><strong>Tanggal Sesi:</strong> ............................................................</div>
                <div className="mt-1"><strong>Konselor BK:</strong> <u>Ust. Abdul Kodir</u></div>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-4 pt-2">
              {activeQuestionnaire.questions.map((q, idx) => (
                <div key={q.id} className="border border-black p-3 space-y-1 text-xs break-inside-avoid">
                  <div className="font-bold">
                    {idx + 1}. [{q.category}]
                  </div>
                  <div className="font-semibold text-[13px] pl-4">
                    "{q.question}"
                  </div>
                  <div className="text-[11px] text-gray-700 italic pl-4">
                    Tujuan BK: {q.purpose}
                  </div>
                  <div className="mt-2 pt-2 border-t border-dotted border-gray-400 min-h-[45px] text-[11px] text-gray-500">
                    Catatan / Jawaban Santri:
                  </div>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-12 text-center text-xs break-inside-avoid">
              <div className="space-y-16">
                <div>Siswa yang Dibimbing,</div>
                <div>( .................................................. )</div>
              </div>
              <div className="space-y-16">
                <div>Guru BK / Kesiswaan,</div>
                <div>( <u>Guru BK & Kesiswaan</u> )</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Editor Modal */}
      <BKQuestionnaireEditorModal
        isOpen={isQuestionnaireEditorOpen}
        onClose={() => setIsQuestionnaireEditorOpen(false)}
        bank={questionnaireBank}
        onUpdateBank={setQuestionnaireBank}
        activeLevel={activeQuestionnaireLevel}
      />
    </div>
  );
};
