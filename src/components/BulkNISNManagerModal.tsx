import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Santri } from '../types';
import {
  X,
  Search,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  ClipboardPaste,
  Save,
  RotateCcw,
  Sparkles,
  Hash,
  Filter,
  CheckCircle2,
  HelpCircle,
  Wand2,
  Trash2,
  Users,
  ArrowRight,
  Settings2,
  Building2,
  GraduationCap
} from 'lucide-react';

interface BulkNISNManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  onSaveBatch: (updatedSantriList: Santri[]) => void;
}

// Helper to check if string is 10-digit numeric NISN
export function isValidNISN(val?: string): boolean {
  if (!val) return false;
  const clean = val.trim().replace(/[\s.-]/g, '');
  return /^\d{10}$/.test(clean);
}

// Clean digits only
export function cleanDigitsOnly(val: string): string {
  return val.replace(/\D/g, '');
}

export const BulkNISNManagerModal: React.FC<BulkNISNManagerModalProps> = ({
  isOpen,
  onClose,
  santriList,
  onSaveBatch
}) => {
  // Local editable copy of santri list
  const [localList, setLocalList] = useState<Santri[]>(() => {
    return santriList.map(s => ({ ...s }));
  });

  // Track changed IDs to highlight edits
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  // Active view tab: 'table' (grid), 'paste' (excel paste), 'csv' (import/export), 'tools' (quick format & NIS generator)
  const [activeTab, setActiveTab] = useState<'table' | 'paste' | 'csv' | 'tools'>('table');

  // Filters & Search
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'missing_nis' | 'missing_nisn' | 'missing_both' | 'valid_nisn' | 'invalid_nisn' | 'dupe_nis' | 'dupe_nisn'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paste Mode State
  const [pasteText, setPasteText] = useState<string>('');
  const [pasteTargetClass, setPasteTargetClass] = useState<string>('ALL');
  const [pasteStrategy, setPasteStrategy] = useState<'smart_match' | 'sequential'>('smart_match');
  const [pasteFieldFocus, setPasteFieldFocus] = useState<'both' | 'nis_only' | 'nisn_only'>('both');
  const [pasteAppliedCount, setPasteAppliedCount] = useState<number | null>(null);

  // NIS Generator Form State
  const [genPrefix, setGenPrefix] = useState<string>('2026');
  const [genStartNumber, setGenStartNumber] = useState<number>(1);
  const [genPadLength, setGenPadLength] = useState<number>(4);
  const [genTargetClass, setGenTargetClass] = useState<string>('ALL');

  // Success Feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard navigation refs for fast table entry
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Reset local list if external list changes while modal is open
  useEffect(() => {
    setLocalList(santriList.map(s => ({ ...s })));
    setChangedIds(new Set());
  }, [santriList]);

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach(s => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [santriList]);

  // Duplicate NISN map (excluding empty)
  const duplicateNisns = useMemo(() => {
    const counts = new Map<string, number>();
    localList.forEach(s => {
      const clean = (s.nisn || '').trim();
      if (clean) {
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    });
    const dupes = new Set<string>();
    counts.forEach((count, val) => {
      if (count > 1) dupes.add(val);
    });
    return dupes;
  }, [localList]);

  // Duplicate NIS map (excluding empty)
  const duplicateNis = useMemo(() => {
    const counts = new Map<string, number>();
    localList.forEach(s => {
      const clean = (s.nis || '').trim();
      if (clean) {
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    });
    const dupes = new Set<string>();
    counts.forEach((count, val) => {
      if (count > 1) dupes.add(val);
    });
    return dupes;
  }, [localList]);

  // Overall Statistics
  const stats = useMemo(() => {
    let nisnFilled = 0;
    let nisnValid10 = 0;
    let nisnMissing = 0;
    let nisnDupe = 0;

    let nisFilled = 0;
    let nisMissing = 0;
    let nisDupe = 0;

    let bothFilled = 0;
    let bothMissing = 0;

    localList.forEach(s => {
      const cleanNisn = (s.nisn || '').trim();
      const cleanNis = (s.nis || '').trim();

      if (cleanNisn) {
        nisnFilled++;
        if (isValidNISN(cleanNisn)) nisnValid10++;
        if (duplicateNisns.has(cleanNisn)) nisnDupe++;
      } else {
        nisnMissing++;
      }

      if (cleanNis) {
        nisFilled++;
        if (duplicateNis.has(cleanNis)) nisDupe++;
      } else {
        nisMissing++;
      }

      if (cleanNisn && cleanNis) {
        bothFilled++;
      }
      if (!cleanNisn && !cleanNis) {
        bothMissing++;
      }
    });

    const total = localList.length;
    return {
      total,
      nisnFilled,
      nisnValid10,
      nisnMissing,
      nisnDupe,
      nisnPercent: total ? Math.round((nisnFilled / total) * 100) : 0,

      nisFilled,
      nisMissing,
      nisDupe,
      nisPercent: total ? Math.round((nisFilled / total) * 100) : 0,

      bothFilled,
      bothMissing
    };
  }, [localList, duplicateNisns, duplicateNis]);

  // Filtered Santri for Table
  const filteredList = useMemo(() => {
    return localList.filter(s => {
      if (selectedClass !== 'ALL' && s.class !== selectedClass) return false;

      const cleanNisn = (s.nisn || '').trim();
      const cleanNis = (s.nis || '').trim();
      const hasNisn = Boolean(cleanNisn);
      const hasNis = Boolean(cleanNis);

      if (statusFilter === 'missing_nis' && hasNis) return false;
      if (statusFilter === 'missing_nisn' && hasNisn) return false;
      if (statusFilter === 'missing_both' && (hasNis || hasNisn)) return false;
      if (statusFilter === 'valid_nisn' && !isValidNISN(cleanNisn)) return false;
      if (statusFilter === 'invalid_nisn' && (!hasNisn || isValidNISN(cleanNisn))) return false;
      if (statusFilter === 'dupe_nis' && (!hasNis || !duplicateNis.has(cleanNis))) return false;
      if (statusFilter === 'dupe_nisn' && (!hasNisn || !duplicateNisns.has(cleanNisn))) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchNisn = (s.nisn || '').toLowerCase().includes(query);
        const matchNis = (s.nis || '').toLowerCase().includes(query);
        const matchClass = s.class.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchNis && !matchClass) return false;
      }

      return true;
    });
  }, [localList, selectedClass, statusFilter, searchTerm, duplicateNisns, duplicateNis]);

  // Handle single cell edit
  const handleUpdateField = (id: string, field: 'nisn' | 'nis', value: string) => {
    setLocalList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value
          };
        }
        return item;
      })
    );

    setChangedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Keyboard navigation: jump to next row on Enter or ArrowDown, or switch column on Tab / ArrowRight
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number,
    field: 'nis' | 'nisn'
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < filteredList.length) {
        const nextSantri = filteredList[nextIndex];
        const nextRefKey = `${nextSantri.id}_${field}`;
        inputRefs.current[nextRefKey]?.focus();
        inputRefs.current[nextRefKey]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        const prevSantri = filteredList[prevIndex];
        const prevRefKey = `${prevSantri.id}_${field}`;
        inputRefs.current[prevRefKey]?.focus();
        inputRefs.current[prevRefKey]?.select();
      }
    } else if (e.key === 'ArrowRight' && field === 'nis') {
      const currentSantri = filteredList[currentIndex];
      if (currentSantri && e.currentTarget.selectionStart === e.currentTarget.value.length) {
        inputRefs.current[`${currentSantri.id}_nisn`]?.focus();
        inputRefs.current[`${currentSantri.id}_nisn`]?.select();
      }
    } else if (e.key === 'ArrowLeft' && field === 'nisn') {
      const currentSantri = filteredList[currentIndex];
      if (currentSantri && e.currentTarget.selectionStart === 0) {
        inputRefs.current[`${currentSantri.id}_nis`]?.focus();
        inputRefs.current[`${currentSantri.id}_nis`]?.select();
      }
    }
  };

  // Quick Format Tool: Strip non-digits from all or filtered NISN
  const handleCleanNonDigits = () => {
    let count = 0;
    setLocalList(prev =>
      prev.map(item => {
        if (!item.nisn) return item;
        const cleaned = cleanDigitsOnly(item.nisn);
        if (cleaned !== item.nisn) {
          count++;
          setChangedIds(ids => new Set(ids).add(item.id));
          return { ...item, nisn: cleaned };
        }
        return item;
      })
    );
    setSaveSuccessMsg(`Berhasil membersihkan tanda baca pada ${count} NISN santri.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Trim whitespace from NIS (Sekolah)
  const handleCleanNISTrim = () => {
    let count = 0;
    setLocalList(prev =>
      prev.map(item => {
        if (!item.nis) return item;
        const trimmed = item.nis.trim();
        if (trimmed !== item.nis) {
          count++;
          setChangedIds(ids => new Set(ids).add(item.id));
          return { ...item, nis: trimmed };
        }
        return item;
      })
    );
    setSaveSuccessMsg(`Berhasil merapikan spasi pada ${count} NIS Sekolah santri.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Clear NIS or NISN for filtered class
  const handleResetFieldForClass = (field: 'nis' | 'nisn' | 'both', targetClass: string) => {
    const fieldLabel = field === 'both' ? 'NIS & NISN' : field === 'nis' ? 'NIS (Sekolah)' : 'NISN (Nasional)';
    const classLabel = targetClass === 'ALL' ? 'SEMUA SANTRI' : `Kelas ${targetClass}`;

    if (!window.confirm(`Apakah Anda yakin ingin mengosongkan ${fieldLabel} untuk ${classLabel}? Anda dapat membatalkannya sebelum menekan Simpan.`)) {
      return;
    }

    let count = 0;
    setLocalList(prev =>
      prev.map(item => {
        if (targetClass === 'ALL' || item.class === targetClass) {
          let updated = false;
          const newItem = { ...item };
          if ((field === 'nis' || field === 'both') && item.nis) {
            newItem.nis = '';
            updated = true;
          }
          if ((field === 'nisn' || field === 'both') && item.nisn) {
            newItem.nisn = '';
            updated = true;
          }
          if (updated) {
            count++;
            setChangedIds(ids => new Set(ids).add(item.id));
            return newItem;
          }
        }
        return item;
      })
    );
    setSaveSuccessMsg(`${fieldLabel} untuk ${count} santri telah dikosongkan. Siap diinput ulang.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Generator Penomoran Otomatis NIS (Sekolah)
  const handleApplyAutoNIS = () => {
    const classLabel = genTargetClass === 'ALL' ? 'Semua Santri' : `Kelas ${genTargetClass}`;
    if (
      !window.confirm(
        `Generate nomor NIS otomatis untuk ${classLabel} dengan format:\nAwalan: "${genPrefix}", Mulai No: ${genStartNumber}, Digit: ${genPadLength}?\n\n(Contoh: ${genPrefix}${String(genStartNumber).padStart(genPadLength, '0')})`
      )
    ) {
      return;
    }

    let currentSeq = genStartNumber;
    let count = 0;

    setLocalList(prev =>
      prev.map(item => {
        if (genTargetClass === 'ALL' || item.class === genTargetClass) {
          const generatedNIS = `${genPrefix}${String(currentSeq).padStart(genPadLength, '0')}`;
          currentSeq++;
          count++;
          setChangedIds(ids => new Set(ids).add(item.id));
          return { ...item, nis: generatedNIS };
        }
        return item;
      })
    );

    setActiveTab('table');
    setSaveSuccessMsg(`Berhasil membuat ${count} nomor NIS lokal secara berurutan!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Preview generated NIS for the first 3 items
  const generatedPreviewSample = useMemo(() => {
    return [0, 1, 2].map(i => `${genPrefix}${String(genStartNumber + i).padStart(genPadLength, '0')}`);
  }, [genPrefix, genStartNumber, genPadLength]);

  // Paste Parser Logic - Supports:
  // Col: [Nama, NIS, NISN] or [NIS, Nama, NISN] or [Nama, NISN] or [Nama, NIS] or single column
  const parsedPastePreview = useMemo(() => {
    if (!pasteText.trim()) return [];

    const lines = pasteText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    // Candidates in current target class (or all)
    const candidates = localList.filter(s => pasteTargetClass === 'ALL' || s.class === pasteTargetClass);

    return lines.map((line, index) => {
      // Split by tab, semicolon, comma, or pipe
      const parts = line.split(/[\t;|,]/).map(p => p.trim()).filter(Boolean);

      let extractedName = '';
      let extractedNis = '';
      let extractedNisn = '';

      if (parts.length >= 3) {
        // Prioritas Format Utama: [NIS, NISN, Nama Siswa]
        const isPart0Numeric = /^\d+$/.test(parts[0].replace(/[\s.-]/g, ''));
        const isPart1Numeric = /^\d+$/.test(parts[1].replace(/[\s.-]/g, ''));
        const isPart2HasLetters = /[a-zA-Z]/.test(parts[2]);

        if (isPart2HasLetters || (isPart0Numeric && isPart1Numeric)) {
          // Sesuai urutan format: 1. NIS, 2. NISN, 3. Nama Siswa
          extractedNis = parts[0].trim();
          extractedNisn = cleanDigitsOnly(parts[1]);
          extractedName = parts[2].trim();
        } else {
          // Deteksi cerdas jika ada urutan alternatif
          const isPart0TenDigits = /^\d{10}$/.test(parts[0].replace(/[\s.-]/g, ''));
          const isPart1TenDigits = /^\d{10}$/.test(parts[1].replace(/[\s.-]/g, ''));
          const isPart2TenDigits = /^\d{10}$/.test(parts[2].replace(/[\s.-]/g, ''));

          if (isPart1TenDigits) {
            extractedNisn = cleanDigitsOnly(parts[1]);
            if (/[a-zA-Z]/.test(parts[2])) {
              extractedNis = parts[0];
              extractedName = parts[2];
            } else {
              extractedName = parts[0];
              extractedNis = parts[2];
            }
          } else if (isPart2TenDigits) {
            extractedNisn = cleanDigitsOnly(parts[2]);
            if (/^\d+$/.test(parts[0])) {
              extractedNis = parts[0];
              extractedName = parts[1];
            } else {
              extractedName = parts[0];
              extractedNis = parts[1];
            }
          } else if (isPart0TenDigits) {
            extractedNisn = cleanDigitsOnly(parts[0]);
            extractedNis = parts[1];
            extractedName = parts[2];
          } else {
            // Default: NIS, NISN, Nama Siswa
            extractedNis = parts[0].trim();
            extractedNisn = cleanDigitsOnly(parts[1]);
            extractedName = parts[2].trim();
          }
        }
      } else if (parts.length === 2) {
        // 2 Kolom: Bisa [NIS, NISN] atau [NIS/NISN, Nama Siswa] atau [Nama, NIS/NISN]
        const isPart0Digits = /^\d{4,15}$/.test(parts[0].replace(/[\s.-]/g, ''));
        const isPart1Digits = /^\d{4,15}$/.test(parts[1].replace(/[\s.-]/g, ''));
        const isPart1HasLetters = /[a-zA-Z]/.test(parts[1]);

        if (isPart0Digits && isPart1Digits) {
          // [NIS, NISN]
          extractedNis = parts[0].trim();
          extractedNisn = cleanDigitsOnly(parts[1]);
        } else if (isPart0Digits && isPart1HasLetters) {
          // [NIS atau NISN, Nama Siswa]
          extractedName = parts[1].trim();
          const rawNum = parts[0].trim();
          if (cleanDigitsOnly(rawNum).length === 10) {
            if (pasteFieldFocus === 'nis_only') {
              extractedNis = rawNum;
            } else {
              extractedNisn = cleanDigitsOnly(rawNum);
            }
          } else {
            extractedNis = rawNum;
          }
        } else if (!isPart0Digits && isPart1Digits) {
          // [Nama Siswa, NIS atau NISN]
          extractedName = parts[0].trim();
          const rawNum = parts[1].trim();
          if (cleanDigitsOnly(rawNum).length === 10) {
            extractedNisn = cleanDigitsOnly(rawNum);
          } else {
            extractedNis = rawNum;
          }
        } else {
          extractedNis = parts[0].trim();
          extractedName = parts[1].trim();
        }
      } else if (parts.length === 1) {
        const raw = parts[0].trim();
        const digits = cleanDigitsOnly(raw);
        if (digits.length === 10) {
          extractedNisn = digits;
        } else if (/^\d{3,12}$/.test(raw)) {
          if (pasteFieldFocus === 'nisn_only') {
            extractedNisn = digits;
          } else {
            extractedNis = raw;
          }
        } else {
          extractedName = raw;
        }
      }

      // Match finding
      let matchedSantri: Santri | undefined;

      if (pasteStrategy === 'sequential') {
        matchedSantri = candidates[index];
      } else {
        if (extractedName) {
          const cleanSearchName = extractedName.toLowerCase().replace(/[^a-z0-9]/g, '');
          matchedSantri = candidates.find(s => {
            const cleanCandidate = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              cleanCandidate === cleanSearchName ||
              cleanCandidate.includes(cleanSearchName) ||
              cleanSearchName.includes(cleanCandidate)
            );
          });
        } else if (extractedNis) {
          matchedSantri = candidates.find(s => s.nis === extractedNis);
        } else if (extractedNisn) {
          matchedSantri = candidates.find(s => s.nisn === extractedNisn);
        }
      }

      return {
        lineIndex: index + 1,
        rawLine: line,
        extractedNis,
        extractedNisn,
        extractedName,
        matchedSantri,
        status: matchedSantri ? 'matched' : ('not_found' as const)
      };
    });
  }, [pasteText, pasteTargetClass, pasteStrategy, pasteFieldFocus, localList]);

  // Apply Paste Preview to local state
  const handleApplyPaste = () => {
    let appliedCount = 0;
    const updateMap = new Map<string, { nisn?: string; nis?: string }>();

    parsedPastePreview.forEach(item => {
      if (item.matchedSantri && (item.extractedNisn || item.extractedNis)) {
        const payload: { nisn?: string; nis?: string } = {};
        if (pasteFieldFocus === 'both' || pasteFieldFocus === 'nisn_only') {
          if (item.extractedNisn) payload.nisn = item.extractedNisn;
        }
        if (pasteFieldFocus === 'both' || pasteFieldFocus === 'nis_only') {
          if (item.extractedNis) payload.nis = item.extractedNis;
        }

        if (payload.nisn !== undefined || payload.nis !== undefined) {
          updateMap.set(item.matchedSantri.id, payload);
          appliedCount++;
        }
      }
    });

    if (appliedCount === 0) {
      alert('Tidak ada data santri yang cocok untuk diterapkan. Pastikan nama atau urutan sesuai.');
      return;
    }

    setLocalList(prev =>
      prev.map(item => {
        const update = updateMap.get(item.id);
        if (update) {
          setChangedIds(ids => new Set(ids).add(item.id));
          return {
            ...item,
            ...(update.nisn !== undefined ? { nisn: update.nisn } : {}),
            ...(update.nis !== undefined ? { nis: update.nis } : {})
          };
        }
        return item;
      })
    );

    setPasteAppliedCount(appliedCount);
    setPasteText('');
    setActiveTab('table');
    setSaveSuccessMsg(`Berhasil menerapkan data NIS & NISN untuk ${appliedCount} santri!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setPasteAppliedCount(null);
    }, 4000);
  };

  // CSV Export & Import Handlers - Format Urutan: NIS, NISN, Nama Siswa, Kelas, ID
  const handleExportCSV = () => {
    const headers = ['NIS_Sekolah', 'NISN_Nasional', 'Nama_Siswa', 'Kelas', 'ID_Santri'];
    const rows = localList.map(s => [
      `"${s.nis || ''}"`,
      `"${s.nisn || ''}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.class}"`,
      `"${s.id}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_NIS_NISN_Santri_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const content = evt.target?.result as string;
        if (!content) return;

        const lines = content.split(/\r?\n/).filter(Boolean);
        if (lines.length <= 1) {
          alert('File CSV kosong atau tidak memiliki baris data.');
          return;
        }

        const headerLine = lines[0].toLowerCase();
        const delimiter = headerLine.includes(';') ? ';' : ',';
        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

        const idIdx = headers.findIndex(h => h.includes('id'));
        const nameIdx = headers.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('siswa'));
        const nisnIdx = headers.findIndex(h => h.includes('nisn'));
        const nisIdx = headers.findIndex(h => (h === 'nis' || h.includes('nis_') || h.includes('induk')) && !h.includes('nisn'));

        let updatedCount = 0;
        const updatesById = new Map<string, { nisn?: string; nis?: string }>();
        const updatesByName = new Map<string, { nisn?: string; nis?: string }>();

        for (let i = 1; i < lines.length; i++) {
          const rawRow = lines[i];
          const parts = rawRow.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));

          // Support header matching or fallback to default order (0: NIS, 1: NISN, 2: Nama Siswa)
          const rowNis = nisIdx >= 0 ? parts[nisIdx] : parts[0] || '';
          const rowNisn = nisnIdx >= 0 ? cleanDigitsOnly(parts[nisnIdx]) : cleanDigitsOnly(parts[1] || '');
          const rowName = nameIdx >= 0 ? parts[nameIdx] : parts[2] || '';
          const rowId = idIdx >= 0 ? parts[idIdx] : (parts[4] || '');

          if (rowId) {
            updatesById.set(rowId, { nisn: rowNisn, nis: rowNis });
          } else if (rowName) {
            updatesByName.set(rowName.toLowerCase().replace(/[^a-z0-9]/g, ''), {
              nisn: rowNisn,
              nis: rowNis
            });
          }
        }

        setLocalList(prev =>
          prev.map(item => {
            let matched = updatesById.get(item.id);
            if (!matched) {
              const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              matched = updatesByName.get(cleanName);
            }

            if (matched && (matched.nisn || matched.nis)) {
              updatedCount++;
              setChangedIds(ids => new Set(ids).add(item.id));
              return {
                ...item,
                ...(matched.nisn ? { nisn: matched.nisn } : {}),
                ...(matched.nis ? { nis: matched.nis } : {})
              };
            }
            return item;
          })
        );

        setActiveTab('table');
        setSaveSuccessMsg(`Berhasil membaca CSV! ${updatedCount} santri diperbarui.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('Gagal membaca file CSV. Pastikan format kolom sesuai.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset local changes back to original
  const handleResetChanges = () => {
    if (changedIds.size === 0) return;
    if (window.confirm('Batalkan seluruh perubahan yang belum disimpan?')) {
      setLocalList(santriList.map(s => ({ ...s })));
      setChangedIds(new Set());
    }
  };

  // Final Save Batch to Cloud & Local Storage
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveBatch(localList);
      setChangedIds(new Set());
      setSaveSuccessMsg(`Berhasil menyimpan perubahan NIS & NISN untuk ${localList.length} santri secara massal!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to batch save:', err);
      alert('Terjadi kesalahan saat menyimpan ke cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#101012] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Rekap & Pembaruan Massal NIS & NISN Santri
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    NIS Sekolah (Lokal)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    NISN (Dapodik/EMIS)
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Kelola, perbaiki, generate otomatis, dan masukkan nomor induk lokal (NIS) serta 10 digit nasional (NISN) secara serentak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {changedIds.size > 0 && (
              <button
                type="button"
                onClick={handleResetChanges}
                className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Batalkan perubahan yang belum disimpan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ({changedIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || changedIds.size === 0}
              className={`px-4 py-2 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                changedIds.size > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 border border-blue-400/40'
                  : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    Simpan Perubahan {changedIds.size > 0 ? `(${changedIds.size} Diubah)` : ''}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Dual Metrics Bar */}
        <div className="bg-[#0D0D0F] border-b border-white/5 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Total Santri:</span>
              <strong className="text-white font-bold">{stats.total}</strong>
            </div>

            <div className="h-3 w-px bg-white/10 hidden sm:block" />

            {/* NIS Metric */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-gray-400">NIS Terisi:</span>
              <strong className="text-cyan-300 font-bold">
                {stats.nisFilled}/{stats.total} ({stats.nisPercent}%)
              </strong>
              {stats.nisMissing > 0 && (
                <span className="text-[10px] text-amber-400 ml-1">({stats.nisMissing} kosong)</span>
              )}
              {stats.nisDupe > 0 && (
                <span className="text-[10px] text-rose-400 font-bold ml-1">[{stats.nisDupe} duplikat!]</span>
              )}
            </div>

            <div className="h-3 w-px bg-white/10 hidden sm:block" />

            {/* NISN Metric */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-gray-400">NISN Terisi:</span>
              <strong className="text-indigo-300 font-bold">
                {stats.nisnFilled}/{stats.total} ({stats.nisnPercent}%)
              </strong>
              {stats.nisnMissing > 0 && (
                <span className="text-[10px] text-amber-400 ml-1">({stats.nisnMissing} kosong)</span>
              )}
              {stats.nisnDupe > 0 && (
                <span className="text-[10px] text-rose-400 font-bold ml-1">[{stats.nisnDupe} duplikat!]</span>
              )}
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center bg-[#18181B] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabel Spreadsheet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Copas Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto NIS & Format</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor / Impor CSV</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: TABLE INPUT LANGSUNG */}
        {activeTab === 'table' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters Toolbar */}
            <div className="p-3 sm:px-6 bg-[#111113] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Search */}
                <div className="relative min-w-[220px] max-w-xs flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama santri, NIS, atau NISN..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#0A0A0B] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Class Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-400 hidden sm:inline">Kelas:</span>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Kelas ({localList.length})</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>
                        Kelas {cls} ({localList.filter(s => s.class === cls).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-400 hidden sm:inline">Kondisi:</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Santri</option>
                    <option value="missing_nis">⚠️ Belum Ada NIS (Sekolah)</option>
                    <option value="missing_nisn">⚠️ Belum Ada NISN (Nasional)</option>
                    <option value="missing_both">❌ Belum Memiliki NIS Maupun NISN</option>
                    <option value="dupe_nis">🚨 NIS Duplikat / Ganda</option>
                    <option value="dupe_nisn">🚨 NISN Duplikat / Ganda</option>
                    <option value="valid_nisn">✅ NISN Valid (10 Digit Angka)</option>
                    <option value="invalid_nisn">⚠️ Format NISN Tidak Standar (!= 10 digit)</option>
                  </select>
                </div>
              </div>

              {/* Keyboard navigation tip */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <span className="font-semibold text-blue-300">💡 Navigasi Cepat:</span>
                <span>Gunakan <kbd className="px-1 py-0.5 bg-black rounded border border-white/20 text-white font-mono">Enter</kbd> / <kbd className="px-1 py-0.5 bg-black rounded border border-white/20 text-white font-mono">↓</kbd> untuk pindah baris, dan <kbd className="px-1 py-0.5 bg-black rounded border border-white/20 text-white font-mono">→</kbd> untuk geser antar kolom NIS & NISN</span>
              </div>
            </div>

            {/* Editable Spreadsheet Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#0C0C0E] sticky top-0 z-20 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 font-black">1. NIS (Sekolah)</span>
                        <span className="text-gray-500 font-normal lowercase">(Buku Induk)</span>
                      </div>
                    </th>
                    <th className="p-3 min-w-[210px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-black">2. NISN (Nasional)</span>
                        <span className="text-gray-500 font-normal lowercase">(10 Digit EMIS/Dapodik)</span>
                      </div>
                    </th>
                    <th className="p-3 min-w-[220px]">3. Nama Santri / Siswa</th>
                    <th className="p-3 w-20 text-center">Kelas</th>
                    <th className="p-3 w-36 text-center">Status Kelengkapan</th>
                    <th className="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Search className="w-8 h-8 text-gray-600" />
                          <p className="font-bold text-gray-400">Tidak ada santri yang sesuai filter</p>
                          <p className="text-xs text-gray-600">
                            Coba ubah kata kunci pencarian atau reset filter kelas / kondisi.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((santri, index) => {
                      const cleanNisn = (santri.nisn || '').trim();
                      const cleanNis = (santri.nis || '').trim();

                      const is10DigitNisn = isValidNISN(cleanNisn);
                      const isDupeNisn = Boolean(cleanNisn && duplicateNisns.has(cleanNisn));
                      const isDupeNis = Boolean(cleanNis && duplicateNis.has(cleanNis));
                      const isChanged = changedIds.has(santri.id);

                      return (
                        <tr
                          key={santri.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isChanged ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          {/* Number */}
                          <td className="p-3 text-center text-gray-500 font-mono">
                            {index + 1}
                          </td>

                          {/* 1. NIS Lokal Input */}
                          <td className="p-3">
                            <div className="relative">
                              <input
                                ref={el => (inputRefs.current[`${santri.id}_nis`] = el)}
                                type="text"
                                placeholder="Contoh: 202607001"
                                value={santri.nis || ''}
                                onChange={e => handleUpdateField(santri.id, 'nis', e.target.value)}
                                onKeyDown={e => handleKeyDown(e, index, 'nis')}
                                className={`w-full font-mono text-xs px-3 py-1.5 rounded-xl border bg-[#0A0A0B] transition-all focus:outline-none focus:ring-2 ${
                                  isDupeNis
                                    ? 'border-rose-500 text-rose-300 focus:ring-rose-500/50'
                                    : cleanNis
                                    ? 'border-cyan-500/40 text-cyan-200 focus:ring-cyan-500/40'
                                    : 'border-white/10 text-gray-300 placeholder-gray-600 focus:ring-blue-500'
                                }`}
                              />
                              {isDupeNis && (
                                <span className="absolute right-2 top-1.5 text-[9px] font-bold text-rose-400 pointer-events-none">
                                  Duplikat
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. NISN Input */}
                          <td className="p-3">
                            <div className="relative">
                              <input
                                ref={el => (inputRefs.current[`${santri.id}_nisn`] = el)}
                                type="text"
                                maxLength={10}
                                placeholder="0081234567"
                                value={santri.nisn || ''}
                                onChange={e => {
                                  const val = cleanDigitsOnly(e.target.value);
                                  handleUpdateField(santri.id, 'nisn', val);
                                }}
                                onKeyDown={e => handleKeyDown(e, index, 'nisn')}
                                className={`w-full font-mono text-xs px-3 py-1.5 rounded-xl border bg-[#0A0A0B] transition-all focus:outline-none focus:ring-2 ${
                                  isDupeNisn
                                    ? 'border-rose-500 text-rose-300 focus:ring-rose-500/50'
                                    : is10DigitNisn
                                    ? 'border-emerald-500/40 text-emerald-300 focus:ring-emerald-500/40'
                                    : cleanNisn
                                    ? 'border-amber-500/40 text-amber-300 focus:ring-amber-500/40'
                                    : 'border-white/10 text-gray-300 placeholder-gray-600 focus:ring-blue-500'
                                }`}
                              />
                              {cleanNisn && (
                                <span className="absolute right-2 top-1.5 text-[10px] font-mono text-gray-500 pointer-events-none">
                                  {cleanNisn.length}/10
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Nama Siswa / Santri */}
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white/5 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 border border-white/5">
                                {santri.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate max-w-xs">
                                  {santri.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Wali: {santri.parentName || '-'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 font-bold text-xs border border-blue-500/20">
                              {santri.class}
                            </span>
                          </td>

                          {/* Validation Badge */}
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {cleanNis && cleanNisn && is10DigitNisn && !isDupeNis && !isDupeNisn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> Lengkap
                                </span>
                              ) : (
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                  {!cleanNis ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                      NIS kosong
                                    </span>
                                  ) : isDupeNis ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                      NIS duplikat
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                      NIS OK
                                    </span>
                                  )}

                                  {!cleanNisn ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                      NISN kosong
                                    </span>
                                  ) : isDupeNisn ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                      NISN duplikat
                                    </span>
                                  ) : !is10DigitNisn ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {cleanNisn.length} digit
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                      NISN OK
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Clear Button */}
                          <td className="p-3 text-center">
                            {(santri.nisn || santri.nis) && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateField(santri.id, 'nis', '');
                                  handleUpdateField(santri.id, 'nisn', '');
                                }}
                                className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                title="Kosongkan NIS & NISN santri ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Status */}
            <div className="p-3 bg-[#0E0E10] border-t border-white/5 px-6 flex items-center justify-between text-xs text-gray-400 shrink-0">
              <div>
                Menampilkan <strong className="text-white">{filteredList.length}</strong> dari{' '}
                <strong className="text-white">{localList.length}</strong> santri
                {selectedClass !== 'ALL' && ` (Kelas ${selectedClass})`}
              </div>
              <div className="flex items-center gap-3">
                {changedIds.size > 0 ? (
                  <span className="text-blue-400 font-bold animate-pulse">
                    ● Ada {changedIds.size} santri dengan perubahan belum tersimpan
                  </span>
                ) : (
                  <span className="text-gray-500">Semua perubahan tersimpan rapi</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COPAS DARI EXCEL */}
        {activeTab === 'paste' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="bg-[#111113] p-5 rounded-2xl border border-white/10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4 text-blue-400" />
                  Salin & Tempel Data NIS / NISN dari Spreadsheet (Excel / Google Sheets)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sistem otomatis mendeteksi kolom Nama, NIS (Sekolah), dan NISN (10 Digit Nasional) bahkan jika susunan kolom berbeda.
                </p>
              </div>

              {/* Paste Config Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    1. Target Kelas yang Sedang Diolah:
                  </label>
                  <select
                    value={pasteTargetClass}
                    onChange={e => setPasteTargetClass(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Kelas (Pencarian Nama Global)</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>
                        Kelas {cls} ({localList.filter(s => s.class === cls).length} santri)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    2. Kolom yang Ingin Diperbarui:
                  </label>
                  <select
                    value={pasteFieldFocus}
                    onChange={e => setPasteFieldFocus(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="both">Perbarui Keduanya (NIS & NISN)</option>
                    <option value="nis_only">Hanya Perbarui NIS Sekolah</option>
                    <option value="nisn_only">Hanya Perbarui NISN Nasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    3. Metode Pencocokan:
                  </label>
                  <select
                    value={pasteStrategy}
                    onChange={e => setPasteStrategy(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="smart_match">
                      🔍 Smart Match Nama (Cocokkan Nama Santri)
                    </option>
                    <option value="sequential">
                      📋 Berurutan Baris per Baris (Urutan Excel Sama)
                    </option>
                  </select>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">
                    Tempelkan Baris Excel di Sini:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    Format Utama: [NIS Sekolah &bull; NISN Nasional &bull; Nama Siswa]
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder={`Contoh 1 (Format Utama: NIS, NISN, Nama Siswa):\n202607001\t0081234567\tAhmad Zaki\n202607002\t0082345678\tBudi Santoso\n\nContoh 2 (Dua Kolom: NIS & NISN):\n202607001\t0081234567\n202607002\t0082345678\n\nContoh 3 (Dua Kolom: NIS & Nama Siswa):\n202607001\tAhmad Zaki\n202607002\tBudi Santoso`}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-[#0A0A0B] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons for Paste */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">
                  {parsedPastePreview.length > 0 && (
                    <>
                      Terdeteksi <strong className="text-white">{parsedPastePreview.length}</strong> baris data.{' '}
                      <strong className="text-emerald-400">
                        {parsedPastePreview.filter(p => p.status === 'matched').length} baris cocok dengan santri.
                      </strong>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {pasteText && (
                    <button
                      type="button"
                      onClick={() => setPasteText('')}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Bersihkan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyPaste}
                    disabled={parsedPastePreview.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-gray-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Hasil Paste ke Tabel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview of Parsed Lines */}
            {parsedPastePreview.length > 0 && (
              <div className="bg-[#111113] p-5 rounded-2xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Pratinjau Hasil Pembacaan ({parsedPastePreview.length} Baris):
                </h4>

                <div className="max-h-72 overflow-y-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0A0B] text-gray-400 sticky top-0 border-b border-white/5">
                      <tr>
                        <th className="p-2.5 w-12 text-center">Baris</th>
                        <th className="p-2.5 text-cyan-300 font-bold">1. NIS Sekolah</th>
                        <th className="p-2.5 text-indigo-300 font-bold">2. NISN Nasional</th>
                        <th className="p-2.5">3. Nama Siswa</th>
                        <th className="p-2.5">Santri Terpetakan</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {parsedPastePreview.map((item, idx) => (
                        <tr
                          key={idx}
                          className={item.status === 'matched' ? 'bg-emerald-950/10' : 'bg-rose-950/10'}
                        >
                          <td className="p-2 text-center text-gray-500">{item.lineIndex}</td>
                          <td className="p-2 text-cyan-300 font-bold">
                            {item.extractedNis || '-'}
                          </td>
                          <td className="p-2 text-indigo-300 font-bold">
                            {item.extractedNisn || '-'}
                          </td>
                          <td className="p-2 text-gray-200 font-sans font-medium">
                            {item.extractedName || '-'}
                          </td>
                          <td className="p-2 font-sans font-bold">
                            {item.matchedSantri ? (
                              <span className="text-white">
                                {item.matchedSantri.name} ({item.matchedSantri.class})
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Tidak ditemukan</span>
                            )}
                          </td>
                          <td className="p-2 text-center font-sans">
                            {item.status === 'matched' ? (
                              <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Cocok
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold">Tak Cocok</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUTO GENERATOR & PEMBERSIH */}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Auto NIS Generator */}
            <div className="bg-[#111113] p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-cyan-400" />
                    Generator Penomoran Otomatis NIS (Buku Induk Sekolah)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Beri nomor induk santri otomatis secara berurutan untuk seluruh santri atau kelas tertentu dengan format yang Anda tentukan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Awalan / Prefix NIS:
                  </label>
                  <input
                    type="text"
                    value={genPrefix}
                    onChange={e => setGenPrefix(e.target.value)}
                    placeholder="2026"
                    className="w-full py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Misal tahun masuk (2026)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Mulai Nomor Urut:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={genStartNumber}
                    onChange={e => setGenStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Angka awal (misal 1 atau 101)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Jumlah Digit Urutan:
                  </label>
                  <select
                    value={genPadLength}
                    onChange={e => setGenPadLength(parseInt(e.target.value))}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={3}>3 digit (001, 002, 003...)</option>
                    <option value={4}>4 digit (0001, 0002, 0003...)</option>
                    <option value={5}>5 digit (00001, 00002...)</option>
                  </select>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Panjang angka di belakang</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Target Kelas:
                  </label>
                  <select
                    value={genTargetClass}
                    onChange={e => setGenTargetClass(e.target.value)}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#0A0A0B] border border-white/10 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="ALL">Semua Kelas ({localList.length} Santri)</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>
                        Kelas {cls} ({localList.filter(s => s.class === cls).length} santri)
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Pilih kelas yang ingin dinomori</span>
                </div>
              </div>

              {/* Sample Preview */}
              <div className="bg-[#0A0A0B] p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Contoh 3 nomor pertama:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {generatedPreviewSample.map((num, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                        {num}
                      </span>
                    ))}
                    <span className="text-gray-500">...</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyAutoNIS}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Terapkan Nomor NIS Berurutan</span>
                </button>
              </div>
            </div>

            {/* Quick Cleaner and Resetter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clean format */}
              <div className="p-4 bg-[#111113] rounded-2xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Pembersihan Karakter Otomatis
                </h4>
                <p className="text-xs text-gray-400">
                  Hapus spasi liar pada NIS, serta hapus titik/strip non-angka pada seluruh kolom NISN nasional.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCleanNonDigits}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Bersihkan NISN (Hanya Angka)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCleanNISTrim}
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Rapikan Spasi NIS</span>
                  </button>
                </div>
              </div>

              {/* Reset Tool */}
              <div className="p-4 bg-[#111113] rounded-2xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Kosongkan / Reset Massal per Kelas
                </h4>
                <p className="text-xs text-gray-400">
                  Kosongkan NIS atau NISN acak jika ingin memulai penginputan ulang dari nol.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <select
                    id="toolResetClass"
                    className="py-1.5 px-3 text-xs bg-[#0A0A0B] border border-white/10 text-white rounded-xl focus:outline-none"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {availableClasses.map(c => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('toolResetClass') as HTMLSelectElement;
                      handleResetFieldForClass('nis', sel ? sel.value : 'ALL');
                    }}
                    className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                  >
                    Reset NIS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('toolResetClass') as HTMLSelectElement;
                      handleResetFieldForClass('nisn', sel ? sel.value : 'ALL');
                    }}
                    className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                  >
                    Reset NISN
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EKSPOR / IMPOR CSV */}
        {activeTab === 'csv' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Card */}
              <div className="bg-[#111113] p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Unduh Data / Template CSV (NIS & NISN)
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Unduh seluruh data santri saat ini dalam format CSV (kompatibel dengan Microsoft Excel dan Google Sheets). Berisi kolom Nama, Kelas, NIS Sekolah, dan NISN Nasional.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Rekap_NIS_NISN.csv ({localList.length} Santri)</span>
                  </button>
                </div>
              </div>

              {/* Import Card */}
              <div className="bg-[#111113] p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Unggah File CSV Hasil Rekapan
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Setelah mengisi kolom NIS atau NISN di Excel, simpan file sebagai format CSV dan unggah ke sini. Sistem akan mencocokkan otomatis berdasarkan ID santri atau Nama santri.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <label className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Pilih & Unggah File CSV</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUploadCSV}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Instruction Guidance */}
            <div className="bg-[#0E0E10] p-5 rounded-2xl border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Pedoman Format Kolom CSV
              </h4>
              <p className="text-xs text-gray-400">
                Kolom yang otomatis dibaca oleh sistem meliputi:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#141416] border border-cyan-500/20">
                  <strong className="text-cyan-400 block mb-1">1. NIS_Sekolah</strong>
                  <span className="text-gray-400 text-[11px]">
                    Nomor induk lokal internal Al Fajar Islamic School (contoh: 202607001).
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141416] border border-indigo-500/20">
                  <strong className="text-indigo-400 block mb-1">2. NISN_Nasional</strong>
                  <span className="text-gray-400 text-[11px]">
                    10 digit angka nomor induk siswa nasional (contoh: 0081234567).
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141416] border border-white/5">
                  <strong className="text-white block mb-1">3. Nama_Siswa</strong>
                  <span className="text-gray-400 text-[11px]">
                    Nama lengkap santri untuk pencocokan otomatis dengan database santri.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141416] border border-white/5">
                  <strong className="text-blue-400 block mb-1">4. ID_Santri (Opsional)</strong>
                  <span className="text-gray-400 text-[11px]">
                    ID unik bawaan sistem untuk memastikan kecocokan 100% tepat.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
