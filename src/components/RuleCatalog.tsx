import React, { useState } from 'react';
import { RuleItem, EntryType, CategoryType } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit,
  FileText,
  FileSpreadsheet,
  Upload,
  Download,
  ClipboardPaste,
  ShieldAlert,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { getCategoryFromPoints } from '../utils/helpers';
import { RuleImportExportModal } from './RuleImportExportModal';
import { exportRulesToExcel, exportRulesToWord } from '../utils/ruleExportImport';

interface RuleCatalogProps {
  rules: RuleItem[];
  onSaveRules: (updatedRules: RuleItem[]) => void;
}

export const RuleCatalog: React.FC<RuleCatalogProps> = ({ rules, onSaveRules }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Pelanggaran' | 'Kebaikan'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CategoryType>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Modal form states
  const [type, setType] = useState<EntryType>('Pelanggaran');
  const [category, setCategory] = useState<CategoryType>('Ringan');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(5);
  const [punishmentOrReward, setPunishmentOrReward] = useState('');
  const [description, setDescription] = useState('');

  // Stats calculation
  const totalRules = rules.length;
  const ringanRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Ringan');
  const sedangRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Sedang');
  const beratRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Berat');
  const kebaikanRules = rules.filter(r => r.type === 'Kebaikan');

  // Filter rules
  const filteredRules = rules.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.defaultPunishmentOrReward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setType('Pelanggaran');
    setCategory('Ringan');
    setTitle('');
    setPoints(5);
    setPunishmentOrReward('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: RuleItem) => {
    setEditingRule(rule);
    setType(rule.type);
    setCategory(rule.category);
    setTitle(rule.title);
    setPoints(Math.abs(rule.defaultPoints));
    setPunishmentOrReward(rule.defaultPunishmentOrReward);
    setDescription(rule.description || '');
    setIsModalOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aturan standar ini dari katalog?')) {
      onSaveRules(rules.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul aturan wajib diisi.');
      return;
    }

    const calculatedPoints = type === 'Pelanggaran' ? -Math.abs(points) : Math.abs(points);

    if (editingRule) {
      const updated = rules.map(r =>
        r.id === editingRule.id
          ? {
              ...r,
              type,
              category,
              title: title.trim(),
              defaultPoints: calculatedPoints,
              defaultPunishmentOrReward: punishmentOrReward.trim(),
              description: description.trim()
            }
          : r
      );
      onSaveRules(updated);
    } else {
      const newRule: RuleItem = {
        id: `r-${Date.now()}`,
        type,
        category,
        title: title.trim(),
        defaultPoints: calculatedPoints,
        defaultPunishmentOrReward: punishmentOrReward.trim(),
        description: description.trim()
      };
      onSaveRules([...rules, newRule]);
    }

    setIsModalOpen(false);
  };

  // Handle batch import from modal
  const handleImportRules = (newRules: RuleItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      onSaveRules(newRules);
    } else {
      // Append mode: merge with existing, avoid exact title duplication by updating
      const existingMap = new Map(rules.map(r => [r.title.toLowerCase().trim(), r]));
      const appendedList = [...rules];

      newRules.forEach(newR => {
        const key = newR.title.toLowerCase().trim();
        if (existingMap.has(key)) {
          // Update existing
          const idx = appendedList.findIndex(r => r.title.toLowerCase().trim() === key);
          if (idx !== -1) {
            appendedList[idx] = { ...appendedList[idx], ...newR, id: appendedList[idx].id };
          }
        } else {
          appendedList.push(newR);
        }
      });

      onSaveRules(appendedList);
    }
  };

  return (
    <div className="space-y-5">
      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setTypeFilter('Pelanggaran');
            setCategoryFilter('Ringan');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            typeFilter === 'Pelanggaran' && categoryFilter === 'Ringan'
              ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
              : 'border-white/10 bg-[#161618] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400">Pelanggaran Ringan</span>
            <span className="text-[10px] text-gray-400 font-mono">-5 s/d -15</span>
          </div>
          <p className="text-xl font-black text-white mt-1">{ringanRules.length} <span className="text-xs font-normal text-gray-400">Aturan</span></p>
        </button>

        <button
          onClick={() => {
            setTypeFilter('Pelanggaran');
            setCategoryFilter('Sedang');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            typeFilter === 'Pelanggaran' && categoryFilter === 'Sedang'
              ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
              : 'border-white/10 bg-[#161618] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400">Pelanggaran Sedang</span>
            <span className="text-[10px] text-gray-400 font-mono">-20 s/d -25</span>
          </div>
          <p className="text-xl font-black text-white mt-1">{sedangRules.length} <span className="text-xs font-normal text-gray-400">Aturan</span></p>
        </button>

        <button
          onClick={() => {
            setTypeFilter('Pelanggaran');
            setCategoryFilter('Berat');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            typeFilter === 'Pelanggaran' && categoryFilter === 'Berat'
              ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
              : 'border-white/10 bg-[#161618] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400">Pelanggaran Berat</span>
            <span className="text-[10px] text-gray-400 font-mono">&le; -30 / SP</span>
          </div>
          <p className="text-xl font-black text-white mt-1">{beratRules.length} <span className="text-xs font-normal text-gray-400">Aturan</span></p>
        </button>

        <button
          onClick={() => {
            setTypeFilter('Kebaikan');
            setCategoryFilter('ALL');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            typeFilter === 'Kebaikan'
              ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
              : 'border-white/10 bg-[#161618] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400">Apresiasi & Prestasi</span>
            <span className="text-[10px] text-gray-400 font-mono">+ Poin Plus</span>
          </div>
          <p className="text-xl font-black text-white mt-1">{kebaikanRules.length} <span className="text-xs font-normal text-gray-400">Aturan</span></p>
        </button>
      </div>

      {/* Header Bar with Action Controls */}
      <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Katalog Aturan Pelanggaran & Poin Apresiasi Standar
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pedoman poin resmi Kesiswaan: Ringan (-5 s/d -15), Sedang (-20 s/d -25), Berat (&le; -30), dan Apresiasi (+).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Export Word */}
            <button
              onClick={() => exportRulesToWord(filteredRules)}
              title="Salin dan download pedoman peraturan ke Dokumen Word (.doc / .docx)"
              className="px-3 py-2 bg-[#0A0A0B] hover:bg-blue-950/40 text-blue-300 font-semibold text-xs rounded-xl border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Salin ke Word
            </button>

            {/* Quick Export Excel */}
            <button
              onClick={() => exportRulesToExcel(filteredRules)}
              title="Salin dan download pedoman peraturan ke Spreadsheet Excel (.xlsx)"
              className="px-3 py-2 bg-[#0A0A0B] hover:bg-emerald-950/40 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Salin ke Excel
            </button>

            {/* Open Full Export & Import Modal */}
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              title="Buka menu lengkap ekspor/impor dan salin peraturan dari Word atau Excel"
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              Salin / Impor dari Word & Excel
            </button>

            {/* Add Manual Rule */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border border-blue-400/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Aturan Baru
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari aturan, sanksi, atau penjelasan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'ALL' | 'Pelanggaran' | 'Kebaikan')}
            className="py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis (Pelanggaran & Kebaikan)</option>
            <option value="Pelanggaran">Pelanggaran (Poin Minus)</option>
            <option value="Kebaikan">Kebaikan (Poin Plus)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as 'ALL' | CategoryType)}
            className="py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori (Ringan, Sedang, Berat)</option>
            <option value="Ringan">Kategori Ringan (-5 s/d -15)</option>
            <option value="Sedang">Kategori Sedang (-20 s/d -25)</option>
            <option value="Berat">Kategori Berat (&le; -30 / SP)</option>
          </select>
        </div>

        {/* Quick Filter Reset */}
        {(searchTerm || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg">
            <span>Menampilkan <strong>{filteredRules.length}</strong> dari <strong>{rules.length}</strong> butir aturan</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRules.map(rule => {
          const isPlus = rule.type === 'Kebaikan';
          const isHeavy = rule.category === 'Berat';
          const isMedium = rule.category === 'Sedang';

          return (
            <div
              key={rule.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-[#161618] hover:border-white/20 ${
                isHeavy && !isPlus
                  ? 'border-rose-500/40 shadow-sm shadow-rose-950/20'
                  : isMedium && !isPlus
                  ? 'border-amber-500/30'
                  : isPlus
                  ? 'border-emerald-500/20 shadow-sm shadow-emerald-950/20'
                  : 'border-white/5'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isPlus
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isHeavy
                        ? 'bg-rose-600 text-white'
                        : isMedium
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    [{rule.category}] {rule.type}
                  </span>

                  <span
                    className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                      isPlus
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isHeavy
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isMedium
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isPlus ? `+${rule.defaultPoints}` : `${rule.defaultPoints}`} Poin
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white leading-snug">
                  {rule.title}
                </h3>

                <p className="text-xs text-gray-300">
                  <strong className="text-gray-400 font-semibold">{isPlus ? 'Default Apresiasi:' : 'Standar Sanksi:'}</strong>{' '}
                  {rule.defaultPunishmentOrReward || '-'}
                </p>

                {rule.description && (
                  <p className="text-[11px] text-gray-400 italic bg-[#0A0A0B] border border-white/5 p-2 rounded-lg">
                    {rule.description}
                  </p>
                )}
              </div>

              {/* Edit / Delete actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(rule)}
                  className="px-2.5 py-1 text-xs text-gray-400 hover:text-blue-400 font-semibold flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="p-8 text-center bg-[#161618] border border-white/10 rounded-2xl space-y-3">
          <BookOpen className="w-10 h-10 text-gray-500 mx-auto" />
          <p className="text-sm font-semibold text-gray-300">Tidak ada aturan yang cocok dengan filter pencarian.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="px-3 py-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 rounded-xl border border-blue-500/20"
            >
              Tampilkan Semua Aturan
            </button>
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="px-3 py-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              Impor Peraturan dari Excel / Word
            </button>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">
              {editingRule ? 'Edit Aturan Standar' : 'Tambah Aturan Standar Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Jenis:</label>
                  <select
                    value={type}
                    onChange={e => {
                      const newType = e.target.value as EntryType;
                      setType(newType);
                      const signP = newType === 'Pelanggaran' ? -Math.abs(points) : Math.abs(points);
                      setCategory(getCategoryFromPoints(signP, newType));
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pelanggaran">Pelanggaran (Minus)</option>
                    <option value="Kebaikan">Kebaikan (Plus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Kategori:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CategoryType)}
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ringan">Ringan ({type === 'Pelanggaran' ? '-5 s/d -15' : '1 - 10'})</option>
                    <option value="Sedang">Sedang ({type === 'Pelanggaran' ? '-20 s/d -25' : '11 - 20'})</option>
                    <option value="Berat">Berat ({type === 'Pelanggaran' ? '-30 s/d Seterusnya' : '> 20'})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Nama Aturan / Pelanggaran:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Merusak Fasilitas Sekolah"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-300 font-semibold">Standar Bobot Poin ({type === 'Pelanggaran' ? 'Minus' : 'Plus'}):</label>
                  {type === 'Pelanggaran' && (
                    <span className="text-[10px] text-gray-400">
                      Ringan (-5 s/d -15), Sedang (-20 s/d -25), Berat (&le; -30)
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  value={points}
                  onChange={e => {
                    const pVal = Number(e.target.value);
                    setPoints(pVal);
                    const signP = type === 'Pelanggaran' ? -Math.abs(pVal) : Math.abs(pVal);
                    setCategory(getCategoryFromPoints(signP, type));
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Standar Hukuman / Reward:</label>
                <input
                  type="text"
                  placeholder="Contoh: Mengganti barang rusak & sanksi piket"
                  value={punishmentOrReward}
                  onChange={e => setPunishmentOrReward(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Penjelasan / Kriteria Khusus:</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan kapan aturan ini berlaku..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-gray-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow border border-blue-400/30"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule Import & Export Modal (Word & Excel) */}
      <RuleImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        rules={rules}
        onImportRules={handleImportRules}
      />
    </div>
  );
};
