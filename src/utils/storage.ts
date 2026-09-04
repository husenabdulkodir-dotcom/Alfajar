import { Santri, PointRecord, RuleItem, AnnualResetLog, BKCounselingNote, BKRoutineSchedule } from '../types';
import { generateVariedAccessPin, isSequentialOrWeakPin } from './helpers';
import {
  INITIAL_SANTRI,
  INITIAL_RECORDS,
  INITIAL_RULES,
  INITIAL_ACADEMIC_YEAR,
  INITIAL_BK_NOTES,
  INITIAL_BK_SCHEDULES,
  DATA_VERSION
} from '../data/initialData';

export { INITIAL_BK_SCHEDULES };

const STORAGE_KEYS = {
  VERSION: 'sistem_poin_data_version',
  SANTRI: 'sistem_poin_santri_data',
  RECORDS: 'sistem_poin_records_data',
  RULES: 'sistem_poin_rules_data',
  ACADEMIC_YEAR: 'sistem_poin_academic_year',
  RESET_LOGS: 'sistem_poin_reset_logs',
  BK_NOTES: 'sistem_poin_bk_notes_data',
  BK_SCHEDULES: 'sistem_poin_bk_schedules_data'
};

function notifySaved() {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('sistem_poin_data_saved', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
        })
      );
    }, 0);
  }
}

function checkAndMigrateVersion() {
  try {
    const currentVer = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (currentVer !== DATA_VERSION) {
      // If version is updated, check if BK notes need initial seeding without wiping user data
      const existingBK = localStorage.getItem(STORAGE_KEYS.BK_NOTES);
      if (!existingBK) {
        saveBKNotes(INITIAL_BK_NOTES);
      }
      localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
}

export function loadSantriData(): Santri[] {
  checkAndMigrateVersion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SANTRI);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Santri[];
      }
    }
  } catch (e) {
    console.error('Error loading santri data:', e);
  }
  saveSantriData(INITIAL_SANTRI);
  return INITIAL_SANTRI;
}

export function saveSantriData(data: Santri[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(data));
    notifySaved();
  } catch (e) {
    console.error('Error saving santri data:', e);
  }
}

export function loadPointRecords(): PointRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading records data:', e);
  }
  savePointRecords(INITIAL_RECORDS);
  return INITIAL_RECORDS;
}

export function savePointRecords(data: PointRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data));
    notifySaved();
  } catch (e) {
    console.error('Error saving records data:', e);
  }
}

export function loadRulesData(): RuleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading rules data:', e);
  }
  saveRulesData(INITIAL_RULES);
  return INITIAL_RULES;
}

export function saveRulesData(data: RuleItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(data));
    notifySaved();
  } catch (e) {
    console.error('Error saving rules data:', e);
  }
}

export function loadCurrentAcademicYear(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading academic year:', e);
  }
  return INITIAL_ACADEMIC_YEAR;
}

export function saveCurrentAcademicYear(year: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, JSON.stringify(year));
    notifySaved();
  } catch (e) {
    console.error('Error saving academic year:', e);
  }
}

export function loadResetLogs(): AnnualResetLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESET_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading reset logs:', e);
  }
  return [];
}

export function saveResetLogs(logs: AnnualResetLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESET_LOGS, JSON.stringify(logs));
    notifySaved();
  } catch (e) {
    console.error('Error saving reset logs:', e);
  }
}

// Bimbingan Konseling (BK) Notes Storage
export function loadBKNotes(): BKCounselingNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BK_NOTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading BK notes:', e);
  }
  saveBKNotes(INITIAL_BK_NOTES);
  return INITIAL_BK_NOTES;
}

export function saveBKNotes(notes: BKCounselingNote[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(notes));
    notifySaved();
  } catch (e) {
    console.error('Error saving BK notes:', e);
  }
}

export function loadBKSchedules(): BKRoutineSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BK_SCHEDULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading BK schedules:', e);
  }
  saveBKSchedules(INITIAL_BK_SCHEDULES);
  return INITIAL_BK_SCHEDULES;
}

export function saveBKSchedules(schedules: BKRoutineSchedule[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BK_SCHEDULES, JSON.stringify(schedules));
    notifySaved();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sistem_poin_bk_schedules_updated'));
    }
  } catch (e) {
    console.error('Error saving BK schedules:', e);
  }
}

export function resetAllDataToDefault() {
  saveSantriData(INITIAL_SANTRI);
  savePointRecords(INITIAL_RECORDS);
  saveRulesData(INITIAL_RULES);
  saveCurrentAcademicYear(INITIAL_ACADEMIC_YEAR);
  saveResetLogs([]);
  saveBKNotes(INITIAL_BK_NOTES);
}

export function exportBackupDataJSON(
  santriList: Santri[],
  records: PointRecord[],
  rules: RuleItem[],
  academicYear: string,
  resetLogs: AnnualResetLog[],
  bkNotes?: BKCounselingNote[]
) {
  const backupPayload = {
    appName: 'SantriPoint_Kesiswaan_BK',
    backupDate: new Date().toISOString(),
    academicYear,
    santriList,
    records,
    rules,
    resetLogs,
    bkNotes: bkNotes || []
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BACKUP_SANTRI_POINT_BK_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importBackupDataJSON(
  jsonText: string
): {
  success: boolean;
  message: string;
  data?: {
    santriList: Santri[];
    records: PointRecord[];
    rules: RuleItem[];
    academicYear: string;
    resetLogs: AnnualResetLog[];
    bkNotes: BKCounselingNote[];
  };
} {
  try {
    const payload = JSON.parse(jsonText);
    if (!payload || !Array.isArray(payload.santriList) || !Array.isArray(payload.records)) {
      return { success: false, message: 'Format file backup JSON tidak valid atau rusak.' };
    }

    const santriList: Santri[] = payload.santriList;
    const records: PointRecord[] = payload.records;
    const rules: RuleItem[] = Array.isArray(payload.rules) ? payload.rules : INITIAL_RULES;
    const academicYear: string = payload.academicYear || INITIAL_ACADEMIC_YEAR;
    const resetLogs: AnnualResetLog[] = Array.isArray(payload.resetLogs) ? payload.resetLogs : [];
    const bkNotes: BKCounselingNote[] = Array.isArray(payload.bkNotes) ? payload.bkNotes : INITIAL_BK_NOTES;

    saveSantriData(santriList);
    savePointRecords(records);
    saveRulesData(rules);
    saveCurrentAcademicYear(academicYear);
    saveResetLogs(resetLogs);
    saveBKNotes(bkNotes);

    return {
      success: true,
      message: `Berhasil memulihkan ${santriList.length} santri, ${records.length} riwayat poin, dan ${bkNotes.length} catatan BK.`,
      data: { santriList, records, rules, academicYear, resetLogs, bkNotes }
    };
  } catch (e) {
    return { success: false, message: 'Gagal membaca file JSON. Pastikan file backup valid.' };
  }
}

export {
  loadBKQuestionnaires,
  saveBKQuestionnaires,
  resetBKQuestionnaires,
  resetBKQuestionnairesToDefault,
  type QuestionnaireBank
} from './bkQuestionnaireData';

