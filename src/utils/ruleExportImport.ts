import * as XLSX from 'xlsx';
import { RuleItem, EntryType, CategoryType } from '../types';
import { getCategoryFromPoints } from './helpers';

export interface ParsedRuleItem {
  id: string;
  title: string;
  type: EntryType;
  category: CategoryType;
  defaultPoints: number;
  defaultPunishmentOrReward: string;
  description?: string;
  isValid: boolean;
  validationError?: string;
}

// -------------------------------------------------------------
// 1. EXPORT TO EXCEL (.xlsx)
// -------------------------------------------------------------
export function exportRulesToExcel(rules: RuleItem[], filename = 'Katalog_Peraturan_Santri.xlsx') {
  const wb = XLSX.utils.book_new();

  // Helper to format rule row for excel
  const formatRuleRow = (r: RuleItem, idx: number) => ({
    'No': idx + 1,
    'ID Aturan': r.id,
    'Jenis': r.type,
    'Kategori': r.category,
    'Nama Aturan / Pelanggaran': r.title,
    'Bobot Poin': r.defaultPoints > 0 ? `+${r.defaultPoints}` : r.defaultPoints,
    'Standar Sanksi / Hadiah': r.defaultPunishmentOrReward || '-',
    'Keterangan / Kriteria': r.description || '-'
  });

  const columnWidths = [
    { wch: 6 },   // No
    { wch: 14 },  // ID
    { wch: 14 },  // Jenis
    { wch: 12 },  // Kategori
    { wch: 45 },  // Nama Aturan
    { wch: 12 },  // Poin
    { wch: 40 },  // Sanksi
    { wch: 35 }   // Keterangan
  ];

  // Sheet 1: Semua Peraturan
  const allRows = rules.map(formatRuleRow);
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = columnWidths;
  XLSX.utils.book_append_sheet(wb, wsAll, 'Semua Peraturan');

  // Sheet 2: Pelanggaran Ringan
  const ringanRows = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Ringan').map(formatRuleRow);
  if (ringanRows.length > 0) {
    const wsRingan = XLSX.utils.json_to_sheet(ringanRows);
    wsRingan['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(wb, wsRingan, 'Pelanggaran Ringan');
  }

  // Sheet 3: Pelanggaran Sedang
  const sedangRows = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Sedang').map(formatRuleRow);
  if (sedangRows.length > 0) {
    const wsSedang = XLSX.utils.json_to_sheet(sedangRows);
    wsSedang['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(wb, wsSedang, 'Pelanggaran Sedang');
  }

  // Sheet 4: Pelanggaran Berat
  const beratRows = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Berat').map(formatRuleRow);
  if (beratRows.length > 0) {
    const wsBerat = XLSX.utils.json_to_sheet(beratRows);
    wsBerat['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(wb, wsBerat, 'Pelanggaran Berat');
  }

  // Sheet 5: Prestasi & Kebaikan
  const kebaikanRows = rules.filter(r => r.type === 'Kebaikan').map(formatRuleRow);
  if (kebaikanRows.length > 0) {
    const wsKebaikan = XLSX.utils.json_to_sheet(kebaikanRows);
    wsKebaikan['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(wb, wsKebaikan, 'Apresiasi & Prestasi');
  }

  // Generate and download
  XLSX.writeFile(wb, filename);
}

// -------------------------------------------------------------
// 2. EXPORT TO WORD (.doc format with full rich table formatting)
// -------------------------------------------------------------
export function exportRulesToWord(rules: RuleItem[], filename = 'Buku_Pedoman_Tata_Tertib_Santri.doc') {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const ringanRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Ringan');
  const sedangRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Sedang');
  const beratRules = rules.filter(r => r.type === 'Pelanggaran' && r.category === 'Berat');
  const kebaikanRules = rules.filter(r => r.type === 'Kebaikan');

  const renderTableRows = (items: RuleItem[], isPlus = false) => {
    if (items.length === 0) {
      return `<tr><td colspan="5" style="text-align: center; color: #777; padding: 10px; font-style: italic;">Tidak ada peraturan dalam kategori ini.</td></tr>`;
    }
    return items
      .map(
        (r, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; vertical-align: top; font-size: 11pt; font-family: Calibri, sans-serif;">${idx + 1}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; vertical-align: top; font-size: 11pt; font-weight: bold; font-family: Calibri, sans-serif; color: #111827;">${r.title}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; vertical-align: top; font-size: 11pt; font-weight: bold; font-family: Calibri, sans-serif; color: ${isPlus ? '#047857' : '#b91c1c'};">${isPlus ? `+${r.defaultPoints}` : r.defaultPoints}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; vertical-align: top; font-size: 11pt; font-family: Calibri, sans-serif; color: #374151;">${r.defaultPunishmentOrReward || '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; vertical-align: top; font-size: 10pt; font-family: Calibri, sans-serif; color: #4b5563; font-style: italic;">${r.description || '-'}</td>
      </tr>`
      )
      .join('');
  };

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Buku Pedoman Tata Tertib Santri</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  body {
    font-family: 'Calibri', 'Arial', sans-serif;
    color: #111827;
    margin: 20px;
    line-height: 1.4;
  }
  .header-box {
    text-align: center;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .inst-title {
    font-size: 16pt;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    margin: 0;
  }
  .doc-title {
    font-size: 14pt;
    font-weight: bold;
    color: #1f2937;
    margin: 5px 0 0 0;
  }
  .sub-title {
    font-size: 10pt;
    color: #4b5563;
    margin: 3px 0 0 0;
  }
  .section-header {
    background-color: #1e3a8a;
    color: #ffffff;
    padding: 6px 10px;
    font-size: 12pt;
    font-weight: bold;
    margin-top: 25px;
    margin-bottom: 8px;
    border-radius: 3px;
  }
  .section-desc {
    font-size: 10pt;
    color: #4b5563;
    margin-bottom: 8px;
    font-style: italic;
  }
  table.rule-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  table.rule-table th {
    background-color: #f3f4f6;
    border: 1px solid #9ca3af;
    padding: 8px;
    font-size: 11pt;
    font-weight: bold;
    color: #111827;
    text-align: left;
  }
  .signature-table {
    width: 100%;
    margin-top: 40px;
    border: none;
  }
  .signature-table td {
    border: none;
    padding: 10px;
    vertical-align: top;
    text-align: center;
    font-size: 11pt;
  }
</style>
</head>
<body>

<div class="header-box">
  <p class="inst-title">AL FAJAR ISLAMIC SCHOOL &bull; BAGIAN KESISWAAN</p>
  <p class="doc-title">BUKU PEDOMAN STANDAR TATA TERTIB & POIN KEDISIPLINAN SISWA</p>
  <p class="sub-title">Dokumen Resmi Acuan Pelanggaran (Ringan, Sedang, Berat) & Apresiasi Prestasi Siswa</p>
  <p class="sub-title">Dicetak pada: ${dateStr}</p>
</div>

<!-- BAB I: PELANGGARAN RINGAN -->
<div class="section-header" style="background-color: #1e40af;">
  BAB I. TATA TERTIB & PELANGGARAN KATEGORI RINGAN (Poin -5 s/d -15)
</div>
<div class="section-desc">
  Pelanggaran disiplin harian tingkat dasar. Tindakan pembinaan diutamakan berupa teguran lisan, pencatatan poin, dan sanksi edukatif mandiri.
</div>
<table class="rule-table">
  <thead>
    <tr>
      <th style="width: 5%; text-align: center;">No</th>
      <th style="width: 40%;">Bunyi Peraturan / Pelanggaran</th>
      <th style="width: 12%; text-align: center;">Poin Minus</th>
      <th style="width: 23%;">Standar Tindakan / Sanksi</th>
      <th style="width: 20%;">Keterangan / Kriteria</th>
    </tr>
  </thead>
  <tbody>
    ${renderTableRows(ringanRules)}
  </tbody>
</table>

<!-- BAB II: PELANGGARAN SEDANG -->
<div class="section-header" style="background-color: #d97706;">
  BAB II. TATA TERTIB & PELANGGARAN KATEGORI SEDANG (Poin -20 s/d -25)
</div>
<div class="section-desc">
  Pelanggaran yang mengganggu ketertiban umum atau pengulangan dari pelanggaran ringan. Memerlukan teguran tertulis, tugas kebersihan, dan pemantauan wali kelas.
</div>
<table class="rule-table">
  <thead>
    <tr>
      <th style="width: 5%; text-align: center;">No</th>
      <th style="width: 40%;">Bunyi Peraturan / Pelanggaran</th>
      <th style="width: 12%; text-align: center;">Poin Minus</th>
      <th style="width: 23%;">Standar Tindakan / Sanksi</th>
      <th style="width: 20%;">Keterangan / Kriteria</th>
    </tr>
  </thead>
  <tbody>
    ${renderTableRows(sedangRules)}
  </tbody>
</table>

<!-- BAB III: PELANGGARAN BERAT -->
<div class="section-header" style="background-color: #b91c1c;">
  BAB III. TATA TERTIB & PELANGGARAN KATEGORI BERAT (Poin &le; -30 / SP 1 - SP 3)
</div>
<div class="section-desc">
  Pelanggaran krusial yang melanggar norma syariat, hukum, asusila, kekerasan, atau merugikan institusi sekolah. Otomatis diterbitkan Surat Peringatan (SP) dan pemanggilan orang tua.
</div>
<table class="rule-table">
  <thead>
    <tr>
      <th style="width: 5%; text-align: center;">No</th>
      <th style="width: 40%;">Bunyi Peraturan / Pelanggaran</th>
      <th style="width: 12%; text-align: center;">Poin Minus</th>
      <th style="width: 23%;">Standar Tindakan / Sanksi</th>
      <th style="width: 20%;">Keterangan / Kriteria</th>
    </tr>
  </thead>
  <tbody>
    ${renderTableRows(beratRules)}
  </tbody>
</table>

<!-- BAB IV: APRESIASI PRESTASI -->
<div class="section-header" style="background-color: #047857;">
  BAB IV. PEDOMAN POIN APRESIASI & PRESTASI SANTRI (+ Poin)
</div>
<div class="section-desc">
  Apresiasi atas capaian prestasi akademik, keagamaan (tahfidz/kitab), kepedulian sosial, keteladanan akhlak, dan kepemimpinan santri.
</div>
<table class="rule-table">
  <thead>
    <tr>
      <th style="width: 5%; text-align: center;">No</th>
      <th style="width: 40%;">Bentuk Prestasi / Kebaikan Santri</th>
      <th style="width: 12%; text-align: center;">Poin Plus (+)</th>
      <th style="width: 23%;">Bentuk Apresiasi / Reward</th>
      <th style="width: 20%;">Keterangan / Kriteria</th>
    </tr>
  </thead>
  <tbody>
    ${renderTableRows(kebaikanRules, true)}
  </tbody>
</table>

<!-- LEMBAR PENGESAHAN -->
<table class="signature-table">
  <tr>
    <td style="width: 50%;">
      Mengetahui,<br>
      <strong>Kepala Sekolah / Pimpinan Al Fajar Islamic School</strong><br><br><br><br>
      ( __________________________ )
    </td>
    <td style="width: 50%;">
      Disahkan Oleh,<br>
      <strong>Bagian Kesiswaan & Kedisiplinan</strong><br><br><br><br>
      ( __________________________ )
    </td>
  </tr>
</table>

</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 3. DOWNLOAD EXCEL TEMPLATE FOR RULES
// -------------------------------------------------------------
export function downloadRulesExcelTemplate(filename = 'Template_Import_Peraturan_Santri.xlsx') {
  const wb = XLSX.utils.book_new();

  const sampleData = [
    {
      'Nama Aturan': 'Terlambat Masuk Kelas / Halaqoh',
      'Jenis (Pelanggaran/Kebaikan)': 'Pelanggaran',
      'Kategori (Ringan/Sedang/Berat)': 'Ringan',
      'Bobot Poin': -5,
      'Standar Sanksi / Hadiah': 'Teguran lisan & mencatat materi tertinggal',
      'Keterangan': 'Berlaku jika terlambat lebih dari 10 menit tanpa uzur syari'
    },
    {
      'Nama Aturan': 'Membawa HP / Gadget Tanpa Izin Resmi',
      'Jenis (Pelanggaran/Kebaikan)': 'Pelanggaran',
      'Kategori (Ringan/Sedang/Berat)': 'Sedang',
      'Bobot Poin': -25,
      'Standar Sanksi / Hadiah': 'Barang disita 1 semester & SP1',
      'Keterangan': 'Penyitaan resmi disimpan di bagian Kesiswaan'
    },
    {
      'Nama Aturan': 'Merokok / Vape / Melakukan Tindak Kekerasan',
      'Jenis (Pelanggaran/Kebaikan)': 'Pelanggaran',
      'Kategori (Ringan/Sedang/Berat)': 'Berat',
      'Bobot Poin': -50,
      'Standar Sanksi / Hadiah': 'Penerbitan SP3 & Panggilan Orang Tua Khusus',
      'Keterangan': 'Sidang pleno dewan asatidz'
    },
    {
      'Nama Aturan': 'Juara Lomba Tahfidz / Akademik Tingkat Kota',
      'Jenis (Pelanggaran/Kebaikan)': 'Kebaikan',
      'Kategori (Ringan/Sedang/Berat)': 'Apresiasi',
      'Bobot Poin': 25,
      'Standar Sanksi / Hadiah': 'Piagam Penghargaan & Uang Pembinaan',
      'Keterangan': 'Apresiasi diumumkan saat apel pagi'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 45 }, // Nama
    { wch: 25 }, // Jenis
    { wch: 25 }, // Kategori
    { wch: 15 }, // Bobot Poin
    { wch: 40 }, // Sanksi/Reward
    { wch: 35 }  // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Peraturan');
  XLSX.writeFile(wb, filename);
}

// -------------------------------------------------------------
// 4. PARSER HELPER: INFER / NORMALIZE RULE DATA
// -------------------------------------------------------------
function normalizeParsedItem(
  rawTitle: string,
  rawType: string,
  rawCategory: string,
  rawPoints: string | number,
  rawPunishment: string,
  rawDesc: string
): ParsedRuleItem {
  const title = (rawTitle || '').trim();
  const punishment = (rawPunishment || '').trim();
  const desc = (rawDesc || '').trim();

  let numPoints = Number(String(rawPoints || '').replace(/[^0-9\-]/g, ''));
  if (isNaN(numPoints) || numPoints === 0) {
    // Default fallback based on category or type
    numPoints = 5;
  }

  // Detect type
  const typeStr = (rawType || '').toLowerCase();
  let type: EntryType = 'Pelanggaran';
  if (
    typeStr.includes('kebaikan') ||
    typeStr.includes('prestasi') ||
    typeStr.includes('plus') ||
    typeStr.includes('reward') ||
    typeStr.includes('apresiasi') ||
    numPoints > 0
  ) {
    if (!typeStr.includes('pelanggaran') && !typeStr.includes('minus') && !typeStr.includes('hukuman')) {
      type = 'Kebaikan';
    }
  }

  // Adjust sign of points
  if (type === 'Pelanggaran') {
    numPoints = -Math.abs(numPoints);
  } else {
    numPoints = Math.abs(numPoints);
  }

  // Detect or infer Category
  let category: CategoryType = getCategoryFromPoints(numPoints, type);
  const catStr = (rawCategory || '').toLowerCase();
  if (catStr.includes('berat')) category = 'Berat';
  else if (catStr.includes('sedang')) category = 'Sedang';
  else if (catStr.includes('ringan')) category = 'Ringan';

  const isValid = title.length > 0;
  const validationError = !isValid ? 'Nama aturan tidak boleh kosong' : undefined;

  return {
    id: `r-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    type,
    category,
    defaultPoints: numPoints,
    defaultPunishmentOrReward: punishment || (type === 'Pelanggaran' ? 'Teguran & Pembinaan' : 'Apresiasi Kesiswaan'),
    description: desc,
    isValid,
    validationError
  };
}

// -------------------------------------------------------------
// 5. PARSER: EXCEL FILE (.xlsx, .xls, .csv)
// -------------------------------------------------------------
export async function parseRulesFromExcelFile(file: File): Promise<ParsedRuleItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const results: ParsedRuleItem[] = [];

  // Iterate over all sheets in workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
    if (!rawRows || rawRows.length < 2) continue;

    // Detect header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
      const row = rawRows[i] as any[];
      if (
        row &&
        row.some(
          cell =>
            typeof cell === 'string' &&
            /nama|aturan|pelanggaran|judul|poin|kategori|sanksi|title/i.test(cell)
        )
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = (rawRows[headerRowIdx] as any[]).map(h => String(h || '').trim().toLowerCase());

    // Map column indexes
    let colTitle = -1;
    let colType = -1;
    let colCategory = -1;
    let colPoints = -1;
    let colPunishment = -1;
    let colDesc = -1;

    headers.forEach((h, idx) => {
      if (/nama|judul|pelanggaran|peraturan|aturan|kasus|tata tertib|title|name/i.test(h) && !/jenis|kategori/i.test(h)) {
        if (colTitle === -1) colTitle = idx;
      } else if (/jenis|type|tipe|sifat/i.test(h)) {
        colType = idx;
      } else if (/kategori|category|tingkat|level/i.test(h)) {
        colCategory = idx;
      } else if (/poin|bobot|points|score|nilai/i.test(h)) {
        colPoints = idx;
      } else if (/sanksi|hukuman|reward|hadiah|tindakan|pembinaan|konsekuensi|punishment/i.test(h)) {
        colPunishment = idx;
      } else if (/keterangan|deskripsi|catatan|description|notes/i.test(h)) {
        colDesc = idx;
      }
    });

    // If colTitle wasn't detected by header name, fall back to first text column
    if (colTitle === -1) {
      colTitle = headers.findIndex(h => h && !/no|id/i.test(h));
      if (colTitle === -1) colTitle = 0;
    }

    // Process data rows
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r] as any[];
      if (!row || row.length === 0) continue;

      const rawTitle = colTitle !== -1 ? row[colTitle] : '';
      if (!rawTitle || String(rawTitle).trim() === '') continue;

      const rawType = colType !== -1 ? row[colType] : '';
      const rawCategory = colCategory !== -1 ? row[colCategory] : '';
      const rawPoints = colPoints !== -1 ? row[colPoints] : '';
      const rawPunishment = colPunishment !== -1 ? row[colPunishment] : '';
      const rawDesc = colDesc !== -1 ? row[colDesc] : '';

      results.push(
        normalizeParsedItem(
          String(rawTitle),
          String(rawType || ''),
          String(rawCategory || ''),
          rawPoints,
          String(rawPunishment || ''),
          String(rawDesc || '')
        )
      );
    }
  }

  return results;
}

// -------------------------------------------------------------
// 6. PARSER: COPY-PASTED TEXT FROM WORD / EXCEL / TEXT
// -------------------------------------------------------------
export function parseRulesFromPastedText(text: string): ParsedRuleItem[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const results: ParsedRuleItem[] = [];

  for (const line of lines) {
    // Skip common table headers if user copied headers
    if (
      /^(no|nama aturan|judul|peraturan|pelanggaran|kategori|bobot poin|sanksi|keterangan)\b/i.test(line) &&
      (line.includes('\t') || line.includes('|') || line.includes(';'))
    ) {
      continue;
    }

    // Determine delimiter: Tab (from Excel/Word table copy), Pipe (|), Semicolon (;), or Comma (,)
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
    } else if (line.includes(';')) {
      parts = line.split(';').map(p => p.trim());
    } else if (line.includes(',')) {
      // Basic CSV split
      parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    } else {
      // Free text format with hyphen/dash or bullet (e.g. "1. Terlambat - Poin -5 - Teguran lisan")
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '');
      const dashed = cleaned.split(/\s+-\s+|\s*:\s*/);
      if (dashed.length >= 2) {
        parts = dashed.map(p => p.trim());
      } else {
        parts = [cleaned];
      }
    }

    // Clean out leading sequence numbers (e.g., "1", "1.") if first part is just a number
    if (parts.length > 1 && /^\d+[\.]?$/.test(parts[0])) {
      parts.shift();
    }

    if (parts.length === 0 || !parts[0]) continue;

    let rawTitle = parts[0] || '';
    let rawPoints: string | number = '';
    let rawCategory = '';
    let rawType = '';
    let rawPunishment = '';
    let rawDesc = '';

    // Inspect remaining tokens to identify points, category, punishment
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      // Check if it looks like a point value (e.g., "-15", "+10", "15", "Poin: -10")
      if (/^([+-]?\d+)(\s*poin)?$/i.test(part) || /^poin\s*:\s*[+-]?\d+/i.test(part)) {
        if (!rawPoints) {
          rawPoints = part.replace(/[^0-9\-+]/g, '');
        }
      } else if (/^(ringan|sedang|berat|apresiasi)$/i.test(part) || /^kategori\s*:\s*(ringan|sedang|berat)/i.test(part)) {
        if (!rawCategory) {
          rawCategory = part.replace(/kategori\s*:\s*/i, '');
        }
      } else if (/^(pelanggaran|kebaikan|prestasi)$/i.test(part) || /^jenis\s*:\s*(pelanggaran|kebaikan)/i.test(part)) {
        if (!rawType) {
          rawType = part.replace(/jenis\s*:\s*/i, '');
        }
      } else if (!rawPunishment) {
        rawPunishment = part;
      } else if (!rawDesc) {
        rawDesc = part;
      }
    }

    // If points not extracted from specific token, check if title or parts contain numbers
    if (!rawPoints && parts.length >= 2 && !isNaN(Number(parts[1]))) {
      rawPoints = Number(parts[1]);
    }

    results.push(
      normalizeParsedItem(
        rawTitle,
        rawType,
        rawCategory,
        rawPoints,
        rawPunishment,
        rawDesc
      )
    );
  }

  return results;
}
