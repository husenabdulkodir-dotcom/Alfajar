import React, { useState } from 'react';
import { Santri, RuleItem, PointRecord, EntryType, CategoryType } from '../types';
import { X, Search, Check, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { getCategoryFromPoints } from '../utils/helpers';
import { RoleBadge } from './RoleBadge';

interface QuickPointInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  rules: RuleItem[];
  academicYear: string;
  onSaveRecords: (newRecords: PointRecord[]) => void;
}

export const QuickPointInputModal: React.FC<QuickPointInputModalProps> = ({
  isOpen,
  onClose,
  santriList,
  rules,
  academicYear,
  onSaveRecords
}) => {
  if (!isOpen) return null;

  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [santriSearch, setSantriSearch] = useState('');
  
  const [entryType, setEntryType] = useState<EntryType>('Pelanggaran');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Ringan');
  const [points, setPoints] = useState<number>(-5);
  const [punishmentOrReward, setPunishmentOrReward] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('Ust. Ahmad (Kesiswaan)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Filter rules based on entryType
  const filteredRules = rules.filter(r => r.type === entryType);

  // Filter santri
  const filteredSantri = santriList.filter(s =>
    s.name.toLowerCase().includes(santriSearch.toLowerCase()) ||
    (s.nis && s.nis.includes(santriSearch)) ||
    s.class.toLowerCase().includes(santriSearch.toLowerCase()) ||
    (s.organizationRole && s.organizationRole.toLowerCase().includes(santriSearch.toLowerCase()))
  );

  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    if (!ruleId) return;

    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      setTitle(rule.title);
      setCategory(rule.category);
      setPoints(rule.defaultPoints);
      setPunishmentOrReward(rule.defaultPunishmentOrReward);
    }
  };

  const handleToggleSantri = (id: string) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(sId => sId !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredSantri.map(s => s.id);
    setSelectedSantriIds(Array.from(new Set([...selectedSantriIds, ...ids])));
  };

  const handleDeselectAll = () => {
    setSelectedSantriIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSantriIds.length === 0) {
      alert('Pilih minimal 1 santri untuk dicatat poinnya.');
      return;
    }
    if (!title.trim()) {
      alert('Nama pelanggaran/kebaikan wajib diisi.');
      return;
    }

    const newRecords: PointRecord[] = selectedSantriIds.map(sId => {
      const s = santriList.find(item => item.id === sId)!;
      const rec: PointRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        santriId: s.id,
        santriName: s.name,
        ...(s.nis ? { santriNis: s.nis } : {}),
        ...(s.nisn ? { santriNisn: s.nisn } : {}),
        type: entryType,
        category: category,
        title: title.trim(),
        points: entryType === 'Pelanggaran' ? -Math.abs(points) : Math.abs(points),
        date: date,
        academicYear: academicYear,
        semester: semester,
        punishmentOrReward: punishmentOrReward.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        recordedBy: recordedBy.trim(),
        isHeavyViolation: entryType === 'Pelanggaran' && category === 'Berat'
      };
      return rec;
    });

    onSaveRecords(newRecords);
    onClose();
    // Reset modal state
    setSelectedSantriIds([]);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#111113] text-white flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              Pencatatan Poin Pelanggaran & Kebaikan Santri
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Catat untuk satu atau beberapa santri secara bersamaan (Real-time Sync)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Step 1: Select Santri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                Pilih Santri ({selectedSantriIds.length} Terpilih):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-blue-400 font-semibold hover:underline"
                >
                  Pilih Semua Hasil Cari
                </button>
                <span className="text-gray-600">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs text-rose-400 font-semibold hover:underline"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            {/* Santri Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, atau kelas..."
                value={santriSearch}
                onChange={e => setSantriSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Santri Chips Selection Box */}
            <div className="max-h-36 overflow-y-auto border border-white/10 rounded-xl p-2 bg-[#0A0A0B] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredSantri.map(s => {
                const isSelected = selectedSantriIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleSantri(s.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                        : 'bg-[#111113] border-white/5 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold truncate max-w-[180px]">{s.name}</p>
                        {s.organizationRole && (
                          <RoleBadge role={s.organizationRole} size="sm" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {s.nis ? `NIS: ${s.nis} \u2022 ` : ''}Kelas {s.class}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Entry Type & Preset Rule Selection */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              Jenis Catatan & Template Aturan:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEntryType('Pelanggaran');
                  setSelectedRuleId('');
                  setPoints(-5);
                }}
                className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  entryType === 'Pelanggaran'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-[#0A0A0B] border-white/10 text-gray-400'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Pelanggaran (Poin Minus)
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryType('Kebaikan');
                  setSelectedRuleId('');
                  setPoints(15);
                }}
                className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  entryType === 'Kebaikan'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[#0A0A0B] border-white/10 text-gray-400'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Kebaikan / Prestasi (Poin Plus)
              </button>
            </div>

            {/* Template Selector Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Pilih dari Katalog Aturan Standar (Opsional):
              </label>
              <select
                value={selectedRuleId}
                onChange={e => handleSelectRule(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Manual atau Pilih dari Katalog Aturan --</option>
                {filteredRules.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.category}] {r.title} ({r.defaultPoints > 0 ? `+${r.defaultPoints}` : r.defaultPoints} Poin)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 3: Details Input */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              Detail Pelanggaran / Kebaikan:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Kategori:</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as CategoryType)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ringan">Ringan ({entryType === 'Pelanggaran' ? '-5 s/d -15' : '1 - 10'})</option>
                  <option value="Sedang">Sedang ({entryType === 'Pelanggaran' ? '-20 s/d -25' : '11 - 20'})</option>
                  <option value="Berat">Berat ({entryType === 'Pelanggaran' ? '-30 s/d Seterusnya' : '> 20'})</option>
                </select>
              </div>

              {/* Points */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Nilai Poin ({entryType === 'Pelanggaran' ? 'Minus' : 'Plus'}):
                </label>
                <input
                  type="number"
                  value={Math.abs(points)}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setPoints(val);
                    const signedP = entryType === 'Pelanggaran' ? -Math.abs(val) : Math.abs(val);
                    setCategory(getCategoryFromPoints(signedP, entryType));
                  }}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {entryType === 'Pelanggaran' && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ringan (-5..-15) | Sedang (-20..-25) | Berat (&le; -30)
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Tanggal Kejadian:</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Nama Pelanggaran / Prestasi:
              </label>
              <input
                type="text"
                placeholder="Contoh: Terlambat Shalat Subuh Berjamaah"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Punishment / Reward */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                {entryType === 'Pelanggaran' ? 'Hukuman / Sanksi Diberikan:' : 'Bentuk Apresiasi / Hadiah:'}
              </label>
              <input
                type="text"
                placeholder={entryType === 'Pelanggaran' ? 'Contoh: Bersihkan Halaman Masjid 30 Menit' : 'Contoh: Piagam Penghargaan & Voucher Kitab'}
                value={punishmentOrReward}
                onChange={e => setPunishmentOrReward(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes & RecordedBy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Catatan Tambahan:</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kronologi atau detail catatan khusus..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Pencatat / Ustaz Verifikator:</label>
                  <input
                    type="text"
                    value={recordedBy}
                    onChange={e => setRecordedBy(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Semester:</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full py-1.5 px-3 text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Heavy Violation Warning Banner if applicable */}
          {entryType === 'Pelanggaran' && category === 'Berat' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">PERHATIAN: Poin Pelanggaran Berat</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Catatan ini akan dikategorikan sebagai Pelanggaran Berat. Poin ini akan disimpan secara <strong>PERMANEN</strong> di rekam jejak santri dan <strong>TIDAK AKAN DI-RESET</strong> pada pergantian tahun ajaran baru.
                </p>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={selectedSantriIds.length === 0}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 border border-blue-400/30"
            >
              Simpan & Synchronize Real-Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
