import React, { useState } from 'react';
import { BKQuestionItem, BK_QUESTIONNAIRES, QuestionnaireBank } from '../utils/bkQuestionnaireData';
import { saveBKQuestionnaires, resetBKQuestionnaires } from '../utils/storage';
import { cloudSaveBKQuestionnaires } from '../utils/firebaseSync';
import { X, Plus, Edit2, Trash2, RotateCcw, Check, BookOpen, AlertCircle } from 'lucide-react';

interface BKQuestionnaireEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionnaireBank;
  onUpdateBank: (newBank: QuestionnaireBank) => void;
  activeLevel: 'SMP' | 'SMA';
}

export const BKQuestionnaireEditorModal: React.FC<BKQuestionnaireEditorModalProps> = ({
  isOpen,
  onClose,
  bank,
  onUpdateBank,
  activeLevel
}) => {
  const [editingQuestion, setEditingQuestion] = useState<BKQuestionItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [category, setCategory] = useState('Adaptasi Belajar Full Day');
  const [questionText, setQuestionText] = useState('');
  const [objective, setObjective] = useState('');
  const [guidanceTip, setGuidanceTip] = useState('');

  if (!isOpen) return null;

  const currentList = bank[activeLevel]?.questions || [];

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setIsAddingNew(true);
    setCategory(activeLevel === 'SMA' ? 'Manajemen Waktu & Stamina' : 'Adaptasi Belajar Full Day');
    setQuestionText('');
    setObjective('');
    setGuidanceTip('');
  };

  const handleOpenEdit = (q: BKQuestionItem) => {
    setIsAddingNew(false);
    setEditingQuestion(q);
    setCategory(q.category);
    setQuestionText(q.question);
    setObjective(q.purpose || (q as any).counselorObjective || '');
    setGuidanceTip(q.guidanceTip || '');
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const currentConfig = bank[activeLevel] || BK_QUESTIONNAIRES[activeLevel];
    let updatedQuestions: BKQuestionItem[];

    if (editingQuestion) {
      updatedQuestions = currentConfig.questions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            category,
            question: questionText,
            purpose: objective || q.purpose || 'Menggali kondisi siswa',
            guidanceTip
          };
        }
        return q;
      });
    } else {
      const newQ: BKQuestionItem = {
        id: `q_custom_${Date.now()}`,
        category,
        question: questionText,
        purpose: objective || 'Menggali dinamika siswa',
        guidanceTip: guidanceTip || 'Tanyakan dengan santai dan apresiatif'
      };
      updatedQuestions = [...currentConfig.questions, newQ];
    }

    const newBank: QuestionnaireBank = {
      ...bank,
      [activeLevel]: {
        ...currentConfig,
        questions: updatedQuestions
      }
    };

    onUpdateBank(newBank);
    saveBKQuestionnaires(newBank);
    cloudSaveBKQuestionnaires(newBank);
    setEditingQuestion(null);
    setIsAddingNew(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!confirm('Yakin ingin menghapus butir instrumen pertanyaan ini?')) return;
    const currentConfig = bank[activeLevel] || BK_QUESTIONNAIRES[activeLevel];
    const updatedQuestions = currentConfig.questions.filter(q => q.id !== id);

    const newBank: QuestionnaireBank = {
      ...bank,
      [activeLevel]: {
        ...currentConfig,
        questions: updatedQuestions
      }
    };

    onUpdateBank(newBank);
    saveBKQuestionnaires(newBank);
    cloudSaveBKQuestionnaires(newBank);
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
      setIsAddingNew(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!confirm('Kembalikan butir instrumen ke format bawaan standar sekolah full day? Perubahan kustom akan dihapus.')) return;
    const def = resetBKQuestionnaires();
    onUpdateBank(def);
    cloudSaveBKQuestionnaires(def);
    setEditingQuestion(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kustomisasi Instrumen Wawancara BK (Tingkat {activeLevel})
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan butir pertanyaan agar relevan dengan kultur dan fokus bimbingan sekolah full day Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset ke format bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: List of Questions */}
          <div className="md:col-span-6 p-4 overflow-y-auto space-y-3 border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                Daftar Pertanyaan ({currentList.length} butir)
              </span>
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Soal</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentList.map((q, idx) => {
                const isSelected = editingQuestion?.id === q.id;
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        {idx + 1}. {q.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-900 font-medium mt-1.5 leading-snug">
                      "{q.question}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Form to Add/Edit */}
          <div className="md:col-span-6 p-5 overflow-y-auto bg-slate-50/50">
            {isAddingNew || editingQuestion ? (
              <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingQuestion ? 'Edit Butir Pertanyaan' : 'Tambah Pertanyaan Kustom Baru'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsAddingNew(false);
                    }}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Kategori / Dimensi Bimbingan</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Contoh: Adaptasi Belajar Full Day, Relasi Teman, Minat Karir"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Kalimat Pertanyaan untuk Siswa <span className="text-rose-500">*</span></label>
                  <textarea
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan pertanyaan hangat, terbuka, dan ramah yang diajukan langsung ke siswa..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Tujuan Psikologis / Observasi Konselor</label>
                  <textarea
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    rows={2}
                    placeholder="Apa yang ingin diobservasi dari respon siswa (misal: tingkat kelelahan, kejujuran, motivasi)..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Tips & Panduan Cara Bertanya Konselor</label>
                  <input
                    type="text"
                    value={guidanceTip}
                    onChange={e => setGuidanceTip(e.target.value)}
                    placeholder="Contoh: Mulai dengan tersenyum, hindari nada menyudutkan..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    {editingQuestion ? 'Simpan Perubahan Pertanyaan' : 'Tambahkan Pertanyaan ke Bank'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <p className="text-xs max-w-xs text-slate-500">
                  Pilih butir pertanyaan di sebelah kiri untuk mengedit atau klik <strong className="text-slate-700">"Tambah Soal"</strong> untuk membuat butir instrumen baru.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Perubahan otomatis tersimpan secara lokal dan langsung sinkron ke formulir sesi bimbingan.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
