import React, { useState } from 'react';
import { Santri } from '../types';
import { generateVariedAccessPin } from '../utils/helpers';
import { FileSpreadsheet, X, CheckCircle2, Sparkles, Upload, RefreshCw } from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface BulkImportSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYear: string;
  onImportSantri: (newSantriList: Santri[], isOverwrite: boolean) => void;
}

const PRESET_CLASSES = ['7 A', '7 B', '8 A', '8 B', '9 A', '9 B', '10 A', '10 B', '11 A', '12 A'];

export const BulkImportSantriModal: React.FC<BulkImportSantriModalProps> = ({
  isOpen,
  onClose,
  academicYear,
  onImportSantri
}) => {
  if (!isOpen) return null;

  const [selectedClass, setSelectedClass] = useState('7 A');
  const [customClassInput, setCustomClassInput] = useState('');
  const [useCustomClass, setUseCustomClass] = useState(false);

  const [pastedText, setPastedText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [parsedData, setParsedData] = useState<Partial<Santri>[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const activeTargetClass = useCustomClass && customClassInput.trim() ? customClassInput.trim() : selectedClass;

  // Function to parse pasted text into structured Santri objects
  const handleParseText = () => {
    if (!pastedText.trim()) {
      alert('Silakan tempel (paste) data NIS dan Nama Santri terlebih dahulu.');
      return;
    }

    const lines = pastedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const parsed: Partial<Santri>[] = [];
    const usedPins = new Set<string>();

    lines.forEach((line, index) => {
      // Ignore header rows if pasted with column headers
      const lower = line.toLowerCase();
      if (
        (lower.includes('nis') && lower.includes('nama')) ||
        (lower.includes('no') && lower.includes('nama'))
      ) {
        return;
      }

      // Determine delimiter: Tab, Pipe, Comma, Semicolon, or Multiple Spaces
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes('|')) {
        cols = line.split('|');
      } else if (line.includes(';') || (line.includes(',') && !line.match(/^[^,]+,\s*[^,]+/))) {
        cols = line.split(line.includes(';') ? ';' : ',');
      } else {
        // Fallback split by double or multiple spaces or single tab/space
        cols = line.split(/\s{2,}/);
      }

      cols = cols.map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length === 0) return;

      let nis = '';
      let name = '';

      if (cols.length === 1) {
        const val = cols[0];
        if (/^\d{4,}$/.test(val)) {
          nis = val;
          name = `Santri ${index + 1}`;
        } else {
          name = val;
          nis = `2026${String(index + 101).padStart(3, '0')}`;
        }
      } else {
        // 2 or more columns: expect NIS and Nama
        const col0 = cols[0];
        const col1 = cols[1];

        if (/^\d+$/.test(col0)) {
          nis = col0;
          name = col1 || `Santri ${index + 1}`;
        } else if (/^\d+$/.test(col1)) {
          nis = col1;
          name = col0;
        } else {
          nis = col0;
          name = col1;
        }
      }

      let organizationRole: string | undefined = undefined;
      if (cols.length >= 3 && cols[2] && cols[2].trim()) {
        organizationRole = cols[2].trim();
      }

      // Generate random unique 6-digit access pin for parent portal
      const pin = generateVariedAccessPin(usedPins);
      usedPins.add(pin);

      parsed.push({
        id: `s-imp-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        nis: nis.trim(),
        name: name.trim(),
        class: activeTargetClass,
        organizationRole: organizationRole,
        parentName: 'Orang Tua Santri',
        parentPhone: '081234567890',
        accessPin: pin,
        academicYear: academicYear
      });
    });

    if (parsed.length === 0) {
      alert('Gagal mendeteksi data santri. Pastikan format mengandung baris NIS dan Nama yang valid.');
      return;
    }

    setParsedData(parsed);
    setSelectedRows(parsed.map((_, i) => i));
    setHasParsed(true);
  };

  const toggleRowSelection = (idx: number) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === parsedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(parsedData.map((_, i) => i));
    }
  };

  const handleConfirmImport = () => {
    const finalImport = parsedData
      .filter((_, idx) => selectedRows.includes(idx))
      .map(item => item as Santri);

    if (finalImport.length === 0) {
      alert('Pilih minimal satu santri untuk diimpor.');
      return;
    }

    if (importMode === 'overwrite') {
      const confirmMsg = `PERHATIAN: Mode "Ganti Seluruh Data" akan MENGHAPUS seluruh data santri lama dan menggantinya dengan ${finalImport.length} santri baru ini. Lanjutkan?`;
      if (!window.confirm(confirmMsg)) return;
    }

    onImportSantri(finalImport, importMode === 'overwrite');
    alert(`Berhasil mengimpor ${finalImport.length} santri ke Kelas ${activeTargetClass}!`);
    onClose();
  };

  const handlePasteTemplateExample = () => {
    const sample = `202601001\tAhmad Zaki Syahputra\n202601002\tMuhammad Faiq Al-Ghifari\n202601003\tFathan Mubina\n202601004\tIbrahim Khalilullah\n202601005\tRayan Abdul Malik`;
    setPastedText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Impor Massal Data Santri (Copas NIS & Nama)
              </h3>
              <p className="text-xs text-gray-400">
                Pilih kelas tujuan, lalu tempel NIS & Nama dari Excel, Word, atau WhatsApp
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* TAB / SELECTOR KELAS TUJUAN */}
          <div className="p-3 bg-[#111113] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Pilih Kelas Tujuan Rombel Ini:
              </label>
              <span className="text-[11px] text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                Kelas: {activeTargetClass}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_CLASSES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedClass(c);
                    setUseCustomClass(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    !useCustomClass && selectedClass === c
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-[#0A0A0B] border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Kelas {c}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setUseCustomClass(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  useCustomClass
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                    : 'bg-[#0A0A0B] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                + Kelas Lain
              </button>
            </div>

            {useCustomClass && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Ketik nama kelas custom (contoh: 11 IPA 2)..."
                  value={customClassInput}
                  onChange={e => setCustomClassInput(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {!hasParsed ? (
            /* Step 2: Paste Input */
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Panduan Copas NIS & Nama Santri:
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteTemplateExample}
                    className="text-[11px] text-blue-400 hover:underline font-semibold bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-400/30"
                  >
                    + Isi Contoh Data Copas
                  </button>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Copy 2 kolom (NIS dan Nama Santri) dari Excel / Sheets / WA, lalu tempel di kotak di bawah. Semua santri yang dicopas di sini otomatis masuk ke <strong>Kelas {activeTargetClass}</strong>.
                </p>
                <div className="bg-[#0A0A0B] p-2 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-300">
                  20260101 [Tab] Ahmad Zaki Syahputra
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Tempel (Paste) NIS & Nama Santri di Sini:
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder={`Contoh:\n202601001\tAhmad Zaki Syahputra\n202601002\tMuhammad Faiq Al-Ghifari\n202601003\tFathan Mubina`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-white/10 bg-[#0A0A0B] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Mode Option */}
              <div className="p-3 bg-[#111113] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-bold text-white">Mode Pengimporan:</span>
                  <span className="text-[11px] text-gray-400">
                    Tambahkan ke data lama atau ganti seluruh data santri
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-200">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-500 focus:ring-blue-500 bg-[#0A0A0B]"
                    />
                    <span>Tambahkan ke Data Lama</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="overwrite"
                      checked={importMode === 'overwrite'}
                      onChange={() => setImportMode('overwrite')}
                      className="text-rose-500 focus:ring-rose-500 bg-[#0A0A0B]"
                    />
                    <span className="font-bold">Ganti Seluruh Data (Overwrite)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Preview Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Mendeteksi {parsedData.length} Santri untuk Kelas {activeTargetClass}</span>
                </div>
                <button
                  onClick={() => setHasParsed(false)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Edit Teks Copas
                </button>
              </div>

              {/* Table Preview */}
              <div className="border border-white/10 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-[#0A0A0B]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161618] text-gray-400 sticky top-0 border-b border-white/10">
                    <tr>
                      <th className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === parsedData.length && parsedData.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-blue-500 focus:ring-blue-500 bg-[#0A0A0B]"
                        />
                      </th>
                      <th className="p-2.5 font-bold">NIS</th>
                      <th className="p-2.5 font-bold">Nama Santri</th>
                      <th className="p-2.5 font-bold">Kelas Tujuan</th>
                      <th className="p-2.5 font-bold">PIN Portal Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {parsedData.map((s, idx) => (
                      <tr key={idx} className={selectedRows.includes(idx) ? 'bg-blue-500/5' : 'opacity-40'}>
                        <td className="p-2.5 text-center font-sans">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(idx)}
                            onChange={() => toggleRowSelection(idx)}
                            className="rounded text-blue-500 focus:ring-blue-500 bg-[#0A0A0B]"
                          />
                        </td>
                        <td className="p-2.5 text-blue-400 font-bold">{s.nis || '-'}</td>
                        <td className="p-2.5 font-sans font-medium text-white">
                          <div>{s.name}</div>
                          {s.organizationRole && (
                            <div className="mt-1">
                              <RoleBadge role={s.organizationRole} size="sm" />
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-bold">
                            Kelas {s.class}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-amber-400">{s.accessPin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {selectedRows.length} dari {parsedData.length} santri terpilih untuk diimpor.
                </span>
                <span className="text-blue-400 font-semibold">
                  Target: Kelas {activeTargetClass} ({importMode === 'append' ? 'Tambah Data' : 'Overwrite'})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
          >
            Batal
          </button>

          {!hasParsed ? (
            <button
              type="button"
              onClick={handleParseText}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 border border-blue-400/30"
            >
              <Upload className="w-4 h-4" />
              Pratinjau Data Copas
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-400/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              Proses & Simpan {selectedRows.length} Santri
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

