import React, { useState, useRef } from 'react';
import { RuleItem, CategoryType } from '../types';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Download,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  X,
  FileDown,
  Trash2,
  Info,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  exportRulesToExcel,
  exportRulesToWord,
  downloadRulesExcelTemplate,
  parseRulesFromExcelFile,
  parseRulesFromPastedText,
  ParsedRuleItem
} from '../utils/ruleExportImport';

interface RuleImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleItem[];
  onImportRules: (newRules: RuleItem[], mode: 'append' | 'replace') => void;
}

export const RuleImportExportModal: React.FC<RuleImportExportModalProps> = ({
  isOpen,
  onClose,
  rules,
  onImportRules
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');

  // Export States
  const [exportFilter, setExportFilter] = useState<'ALL' | 'PELANGGARAN' | 'Ringan' | 'Sedang' | 'Berat' | 'Kebaikan'>('ALL');
  const [exportFilename, setExportFilename] = useState('');

  // Import States
  const [importMethod, setImportMethod] = useState<'PASTE' | 'FILE'>('PASTE');
  const [pastedText, setPastedText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedItems, setParsedItems] = useState<ParsedRuleItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter rules for export preview
  const getRulesToExport = () => {
    switch (exportFilter) {
      case 'PELANGGARAN':
        return rules.filter(r => r.type === 'Pelanggaran');
      case 'Ringan':
        return rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Ringan');
      case 'Sedang':
        return rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Sedang');
      case 'Berat':
        return rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Berat');
      case 'Kebaikan':
        return rules.filter(r => r.type === 'Kebaikan');
      default:
        return rules;
    }
  };

  const exportList = getRulesToExport();

  // Export handlers
  const handleExportWord = () => {
    const defaultName = `Buku_Pedoman_Tata_Tertib_${exportFilter !== 'ALL' ? exportFilter : 'Lengkap'}.doc`;
    const fname = exportFilename.trim() ? (exportFilename.endsWith('.doc') ? exportFilename : `${exportFilename}.doc`) : defaultName;
    exportRulesToWord(exportList, fname);
  };

  const handleExportExcel = () => {
    const defaultName = `Katalog_Peraturan_Santri_${exportFilter !== 'ALL' ? exportFilter : 'Lengkap'}.xlsx`;
    const fname = exportFilename.trim() ? (exportFilename.endsWith('.xlsx') ? exportFilename : `${exportFilename}.xlsx`) : defaultName;
    exportRulesToExcel(exportList, fname);
  };

  // Paste parsing handler
  const handleParsePastedText = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }
    const parsed = parseRulesFromPastedText(text);
    setParsedItems(parsed);
    setImportSuccessMsg(null);
  };

  // File parsing handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);
    setImportSuccessMsg(null);

    try {
      const parsed = await parseRulesFromExcelFile(file);
      setParsedItems(parsed);
    } catch (err) {
      console.error('Error parsing excel file:', err);
      alert('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove single item from preview
  const handleRemoveParsedItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // Load sample template into paste area
  const handleLoadSamplePaste = () => {
    const sample = `Terlambat Masuk Kelas / Pelajaran\tPelanggaran\tRingan\t-5\tTeguran lisan & mencatat materi\tKeterlambatan lebih dari 5 menit
Meninggalkan Kelas / Halaqoh Tanpa Izin\tPelanggaran\tRingan\t-10\tTugas mandiri tambahan\tBerlaku di jam pelajaran
Membuat Kegaduhan di Jam Belajar Mandiri\tPelanggaran\tRingan\t-10\tPiket kebersihan kelas\tTeguran kedua
Membawa atau Menyimpan HP Tanpa Izin Resmi\tPelanggaran\tSedang\t-25\tBarang disita & SP 1\tDisimpan di bagian Kesiswaan
Keluar Lingkungan Sekolah Tanpa Surat Izin\tPelanggaran\tBerat\t-35\tPanggilan Orang Tua & SP 2\tSkorsing 3 hari
Terlibat Perkelahian atau Kekerasan Fisik\tPelanggaran\tBerat\t-50\tSidang Pleno & SP 3 / Peringatan Terakhir\tDiterbitkan surat resmi
Juara 1 Lomba Tahfidz Al-Qur'an / Prestasi Akademik\tKebaikan\tApresiasi\t30\tPiagam Penghargaan & Hadiah Pembinaan\tKategori prestasi resmi
Membantu Guru / Piket Kebersihan Lingkungan\tKebaikan\tRingan\t10\tPujian & Catatan Amal Shalih\tPiket sukarela`;
    handleParsePastedText(sample);
  };

  // Commit import
  const handleExecuteImport = () => {
    const validItems = parsedItems.filter(item => item.isValid && item.title.trim());
    if (validItems.length === 0) {
      alert('Tidak ada data peraturan valid yang siap di-import.');
      return;
    }

    const newRulesToSave: RuleItem[] = validItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      defaultPoints: item.defaultPoints,
      defaultPunishmentOrReward: item.defaultPunishmentOrReward,
      description: item.description
    }));

    onImportRules(newRulesToSave, importMode);
    setImportSuccessMsg(`Berhasil mengimpor ${newRulesToSave.length} peraturan ke sistem!`);
    
    // Clear inputs after 1.5s and notify
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Preview stats
  const validCount = parsedItems.filter(i => i.isValid).length;
  const ringanCount = parsedItems.filter(i => i.type === 'Pelanggaran' && i.category === 'Ringan').length;
  const sedangCount = parsedItems.filter(i => i.type === 'Pelanggaran' && i.category === 'Sedang').length;
  const beratCount = parsedItems.filter(i => i.type === 'Pelanggaran' && i.category === 'Berat').length;
  const kebaikanCount = parsedItems.filter(i => i.type === 'Kebaikan').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#1A1A1D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Salin & Ekspor / Impor Peraturan Tata Tertib
              </h2>
              <p className="text-xs text-gray-400">
                Kelola salinan aturan Ringan, Sedang, Berat & Prestasi via Word atau Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#121214] px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'EXPORT'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Buat Salinan (Ekspor ke Word / Excel)
          </button>

          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'IMPORT'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Salin / Impor Peraturan Terbaru (dari Word / Excel)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* TAB 1: EXPORT (SALIN KE WORD / EXCEL)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              {/* Category Breakdown & Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-blue-500/20">
                  <span className="text-[11px] font-semibold text-blue-400 block">Pelanggaran Ringan</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-white">
                      {rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Ringan').length}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Poin -5 s/d -15</span>
                  </div>
                </div>

                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-amber-500/20">
                  <span className="text-[11px] font-semibold text-amber-400 block">Pelanggaran Sedang</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-white">
                      {rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Sedang').length}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Poin -20 s/d -25</span>
                  </div>
                </div>

                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-rose-500/20">
                  <span className="text-[11px] font-semibold text-rose-400 block">Pelanggaran Berat</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-white">
                      {rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Berat').length}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Poin &le; -30 / SP</span>
                  </div>
                </div>

                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[11px] font-semibold text-emerald-400 block">Apresiasi & Prestasi</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-white">
                      {rules.filter(r => r.type === 'Kebaikan').length}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">+ Poin Plus</span>
                  </div>
                </div>
              </div>

              {/* Filter & Customization */}
              <div className="bg-[#0A0A0B] p-4 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Pengaturan Salinan / Ekspor
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Pilih Bagian Peraturan yang Disalin:
                    </label>
                    <select
                      value={exportFilter}
                      onChange={e => setExportFilter(e.target.value as any)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#161618] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">Semua Aturan (Ringan, Sedang, Berat & Prestasi) — {rules.length} Aturan</option>
                      <option value="PELANGGARAN">Semua Pelanggaran Saja (Ringan + Sedang + Berat) — {rules.filter(r => r.type === 'Pelanggaran').length} Aturan</option>
                      <option value="Ringan">Khusus Pelanggaran Ringan Saja (-5 s/d -15)</option>
                      <option value="Sedang">Khusus Pelanggaran Sedang Saja (-20 s/d -25)</option>
                      <option value="Berat">Khusus Pelanggaran Berat Saja (&le; -30 / SP)</option>
                      <option value="Kebaikan">Khusus Poin Apresiasi & Prestasi (+ Poin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Nama Berkas (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Tata_Tertib_Santri_2026"
                      value={exportFilename}
                      onChange={e => setExportFilename(e.target.value)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-white/10 bg-[#161618] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-2.5 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Jumlah data yang akan disalin: <strong className="text-white">{exportList.length} butir aturan</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Word vs Excel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Word Option Card */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Dokumen Word (.doc / .docx)</h3>
                        <p className="text-[11px] text-blue-300">Format Buku Pedoman Resmi Al Fajar Islamic School</p>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc marker:text-blue-400">
                      <li>Lengkap Kop Resmi Bagian Kesiswaan & Kedisiplinan</li>
                      <li>Tersusun per Bab: Bab I (Ringan), Bab II (Sedang), Bab III (Berat), Bab IV (Apresiasi)</li>
                      <li>Tabel rapi dengan kolom Sanksi, Bobot Poin, dan Keterangan</li>
                      <li>Dilengkapi lembar tanda tangan pengesahan pimpinan Al Fajar Islamic School</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleExportWord}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Salinan Dokumen Word
                  </button>
                </div>

                {/* Excel Option Card */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 rounded-lg text-white">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Spreadsheet Excel (.xlsx)</h3>
                        <p className="text-[11px] text-emerald-300">Multi-Sheet Terstruktur & Siap Olah</p>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc marker:text-emerald-400">
                      <li>Tab Sheet terpisah: Semua Aturan, Ringan, Sedang, Berat, dan Apresiasi</li>
                      <li>Lebar kolom otomatis disesuaikan agar teks mudah dibaca</li>
                      <li>Sangat praktis untuk dibagikan, dicetak, atau diedit bersama tim pengasuhan</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Salinan Spreadsheet Excel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: IMPORT / SALIN DARI WORD ATAU EXCEL                                */}
          {/* ========================================================================= */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-5">
              
              {/* Method Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMethod('PASTE')}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                    importMethod === 'PASTE'
                      ? 'border-blue-500 bg-blue-950/30 text-white'
                      : 'border-white/10 bg-[#0A0A0B] text-gray-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className={`w-5 h-5 ${importMethod === 'PASTE' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div>
                    <strong className="text-xs block text-white">Metode 1: Salin & Tempel Teks (Paste)</strong>
                    <span className="text-[11px] text-gray-400">Copy tabel dari Word / Excel lalu paste langsung</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMethod('FILE')}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                    importMethod === 'FILE'
                      ? 'border-emerald-500 bg-emerald-950/30 text-white'
                      : 'border-white/10 bg-[#0A0A0B] text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className={`w-5 h-5 ${importMethod === 'FILE' ? 'text-emerald-400' : 'text-gray-500'}`} />
                  <div>
                    <strong className="text-xs block text-white">Metode 2: Upload File Excel (.xlsx / .csv)</strong>
                    <span className="text-[11px] text-gray-400">Pilih berkas excel dari komputer / HP</span>
                  </div>
                </button>
              </div>

              {/* Paste Method View */}
              {importMethod === 'PASTE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-200 flex items-center gap-2">
                      <ClipboardPaste className="w-4 h-4 text-blue-400" />
                      Tempel (Paste) Data Peraturan dari Word / Excel:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSamplePaste}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
                      >
                        <Sparkles className="w-3 h-3" />
                        Isi Contoh Format
                      </button>
                      {pastedText && (
                        <button
                          type="button"
                          onClick={() => handleParsePastedText('')}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                        >
                          Bersihkan
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={e => handleParsePastedText(e.target.value)}
                    placeholder="Petunjuk: Copy baris atau tabel dari Microsoft Word / Excel dan paste di sini. Format fleksibel mendukung Tab, garis pemisah (|), koma, atau titik koma."
                    className="w-full p-3 text-xs font-mono rounded-xl border border-white/10 bg-[#0A0A0B] text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-400 italic">
                    Tips: Sistem otomatis mendeteksi kategori (Ringan/Sedang/Berat/Apresiasi) berdasarkan nilai poin atau kata kunci yang disalin.
                  </p>
                </div>
              )}

              {/* File Upload Method View */}
              {importMethod === 'FILE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-200">
                      Pilih Berkas Spreadsheet Excel (.xlsx, .xls, .csv):
                    </label>
                    <button
                      type="button"
                      onClick={() => downloadRulesExcelTemplate()}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Unduh Template Excel Standar
                    </button>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-[#0A0A0B] p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {selectedFileName ? selectedFileName : 'Klik atau seret berkas Excel ke sini'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Mendukung file .xlsx, .xls, dan .csv
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Options (Append vs Replace) */}
              <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-200 block">Metode Penggabungan Aturan:</span>
                  <span className="text-[11px] text-gray-400">Pilih bagaimana aturan baru disimpan ke katalog</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-[#161618] px-3 py-1.5 rounded-lg border border-white/5">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-200 font-medium">Tambahkan ke Katalog Lama</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-[#161618] px-3 py-1.5 rounded-lg border border-white/5">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-300 font-medium">Ganti Seluruh Aturan</span>
                  </label>
                </div>
              </div>

              {/* Preview Table of Parsed Rules */}
              {parsedItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Pratinjau Hasil Pembacaan ({parsedItems.length} Aturan Terdeteksi)
                    </h3>

                    {/* Stats Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      {ringanCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {ringanCount} Ringan
                        </span>
                      )}
                      {sedangCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {sedangCount} Sedang
                        </span>
                      )}
                      {beratCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {beratCount} Berat
                        </span>
                      )}
                      {kebaikanCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {kebaikanCount} Prestasi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl bg-[#0A0A0B] custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161618] text-gray-300 border-b border-white/10 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-8">No</th>
                          <th className="p-2.5">Nama Peraturan</th>
                          <th className="p-2.5 w-24 text-center">Kategori</th>
                          <th className="p-2.5 w-20 text-center">Poin</th>
                          <th className="p-2.5">Standar Sanksi / Hadiah</th>
                          <th className="p-2.5 w-10 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedItems.map((item, idx) => {
                          const isPlus = item.type === 'Kebaikan';
                          const isHeavy = item.category === 'Berat';

                          return (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-2.5 font-mono text-gray-500">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-white">
                                {item.title}
                                {item.description && (
                                  <span className="block text-[10px] text-gray-400 font-normal italic">
                                    {item.description}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPlus
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : isHeavy
                                      ? 'bg-rose-600 text-white'
                                      : item.category === 'Sedang'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}
                                >
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-bold font-mono">
                                <span className={isPlus ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isPlus ? `+${item.defaultPoints}` : item.defaultPoints}
                                </span>
                              </td>
                              <td className="p-2.5 text-gray-300">
                                {item.defaultPunishmentOrReward || '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParsedItem(item.id)}
                                  className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                                  title="Hapus baris ini dari daftar import"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {importSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {importSuccessMsg}
                </div>
              )}

              {/* Action Submit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedItems.length === 0 || isProcessing}
                  onClick={handleExecuteImport}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all ${
                    parsedItems.length > 0 && !isProcessing
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 cursor-pointer'
                      : 'bg-gray-800 text-gray-500 border border-transparent cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Simpan {parsedItems.length} Peraturan ke Katalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
