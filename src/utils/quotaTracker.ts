/**
 * Quota Tracker & Telemetry Service for Firebase Firestore & Server Resources
 * Spark Free Tier Quotas:
 * - Reads: 50,000 / day
 * - Writes: 20,000 / day
 * - Deletes: 20,000 / day
 * - Stored Data (Storage): 1 GiB (1,024 MiB = 1,073,741,824 bytes)
 * - Network Egress: 10 GiB / month (10,240 MiB = 10,737,418,240 bytes)
 */

import { Santri, PointRecord, RuleItem, BKCounselingNote, AnnualResetLog } from '../types';

export const SPARK_QUOTA_LIMITS = {
  READS_PER_DAY: 50_000,
  WRITES_PER_DAY: 20_000,
  DELETES_PER_DAY: 20_000,
  STORAGE_BYTES: 1024 * 1024 * 1024, // 1 GiB
  EGRESS_BYTES_PER_MONTH: 10 * 1024 * 1024 * 1024 // 10 GiB
};

export interface QuotaActivityLog {
  id: string;
  timestamp: string;
  type: 'READ' | 'WRITE' | 'DELETE';
  count: number;
  collection: string;
  detail: string;
  bytesEstimated?: number;
}

export interface StoredQuotaData {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  readsToday: number;
  writesToday: number;
  deletesToday: number;
  egressThisMonthBytes: number;
  activityLogs: QuotaActivityLog[];
}

const STORAGE_KEY = 'sistem_poin_server_quota_telemetry';

// Helper to get current Date keys
const getTodayKey = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // e.g. "2026-09-01"
};

const getCurrentMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`; // e.g. "2026-09"
};

// Calculate time remaining until next UTC midnight (when Google Cloud Firestore daily quotas reset)
export const getTimeUntilQuotaReset = (): { hours: number; minutes: number; text: string } => {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(24, 0, 0, 0); // 00:00:00 UTC
  const diffMs = nextReset.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours,
    minutes,
    text: `${hours} jam ${minutes} menit lagi (07:00 WIB)`
  };
};

// Load raw quota data with auto-rollover
export const loadQuotaTelemetry = (): StoredQuotaData => {
  const today = getTodayKey();
  const currentMonth = getCurrentMonthKey();

  const defaultData: StoredQuotaData = {
    date: today,
    month: currentMonth,
    readsToday: 0,
    writesToday: 0,
    deletesToday: 0,
    egressThisMonthBytes: 0,
    activityLogs: []
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as StoredQuotaData;

    let modified = false;

    // Check if new day: reset daily counters
    if (parsed.date !== today) {
      parsed.date = today;
      parsed.readsToday = 0;
      parsed.writesToday = 0;
      parsed.deletesToday = 0;
      modified = true;
    }

    // Check if new month: reset monthly egress
    if (parsed.month !== currentMonth) {
      parsed.month = currentMonth;
      parsed.egressThisMonthBytes = 0;
      modified = true;
    }

    if (!Array.isArray(parsed.activityLogs)) {
      parsed.activityLogs = [];
      modified = true;
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Error loading quota telemetry:', err);
    return defaultData;
  }
};

// Save quota data and trigger custom event for reactive UI
const saveQuotaTelemetry = (data: StoredQuotaData) => {
  try {
    // Keep max 30 activity logs
    if (data.activityLogs.length > 30) {
      data.activityLogs = data.activityLogs.slice(0, 30);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('quota_metrics_updated', { detail: data }));
      }, 0);
    }
  } catch (err) {
    console.error('Error saving quota telemetry:', err);
  }
};

// Track Document Reads
export const trackFirestoreReads = (
  count: number,
  collectionName: string,
  detail: string = 'Sinkronisasi data dokumen',
  bytesEstimated: number = 0
) => {
  if (count <= 0) return;
  const data = loadQuotaTelemetry();
  data.readsToday += count;
  const estimatedEgress = bytesEstimated > 0 ? bytesEstimated : count * 512; // ~512 bytes avg doc size
  data.egressThisMonthBytes += estimatedEgress;

  data.activityLogs.unshift({
    id: `read_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'READ',
    count,
    collection: collectionName,
    detail,
    bytesEstimated: estimatedEgress
  });

  saveQuotaTelemetry(data);
};

// Track Document Writes
export const trackFirestoreWrites = (
  count: number,
  collectionName: string,
  detail: string = 'Penulisan/Pembaruan data dokumen',
  bytesEstimated: number = 0
) => {
  if (count <= 0) return;
  const data = loadQuotaTelemetry();
  data.writesToday += count;
  const estimatedEgress = bytesEstimated > 0 ? bytesEstimated : count * 350;
  data.egressThisMonthBytes += estimatedEgress;

  data.activityLogs.unshift({
    id: `write_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'WRITE',
    count,
    collection: collectionName,
    detail,
    bytesEstimated: estimatedEgress
  });

  saveQuotaTelemetry(data);
};

// Track Document Deletes
export const trackFirestoreDeletes = (
  count: number,
  collectionName: string,
  detail: string = 'Penghapusan dokumen'
) => {
  if (count <= 0) return;
  const data = loadQuotaTelemetry();
  data.deletesToday += count;

  data.activityLogs.unshift({
    id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'DELETE',
    count,
    collection: collectionName,
    detail
  });

  saveQuotaTelemetry(data);
};

// Reset telemetry counters (for calibration)
export const resetQuotaTelemetryCounters = () => {
  const data: StoredQuotaData = {
    date: getTodayKey(),
    month: getCurrentMonthKey(),
    readsToday: 0,
    writesToday: 0,
    deletesToday: 0,
    egressThisMonthBytes: 0,
    activityLogs: []
  };
  saveQuotaTelemetry(data);
};

// Estimate byte size of a JavaScript object/value in Firestore
const getApproximateFirestoreDocSize = (docData: any, docId: string = ''): number => {
  // Overhead: 32 bytes doc overhead + length of doc path + 16 bytes
  let size = 32 + 16 + (docId ? docId.length : 20);

  const calculateValueSize = (val: any, key: string = ''): number => {
    let fieldSize = key ? key.length + 1 : 0;
    if (val === null || val === undefined) {
      return fieldSize + 1;
    }
    if (typeof val === 'boolean') {
      return fieldSize + 1;
    }
    if (typeof val === 'number') {
      return fieldSize + 8;
    }
    if (typeof val === 'string') {
      // String length in UTF-8
      const strBytes = new TextEncoder().encode(val).length;
      return fieldSize + strBytes + 1;
    }
    if (Array.isArray(val)) {
      let arrSize = 1;
      val.forEach(item => {
        arrSize += calculateValueSize(item);
      });
      return fieldSize + arrSize;
    }
    if (typeof val === 'object') {
      let mapSize = 1;
      Object.entries(val).forEach(([k, v]) => {
        mapSize += calculateValueSize(v, k);
      });
      return fieldSize + mapSize;
    }
    return fieldSize + 8;
  };

  if (typeof docData === 'object' && docData !== null) {
    Object.entries(docData).forEach(([k, v]) => {
      size += calculateValueSize(v, k);
    });
  }
  return size;
};

// Calculate total database storage bytes and breakdown
export const calculateDatabaseStorage = (data: {
  santriList: Santri[];
  records: PointRecord[];
  rules: RuleItem[];
  bkNotes: BKCounselingNote[];
  resetLogs: AnnualResetLog[];
  academicYear: string;
}): {
  totalBytes: number;
  santriBytes: number;
  recordsBytes: number;
  rulesBytes: number;
  bkNotesBytes: number;
  resetLogsBytes: number;
  settingsBytes: number;
  totalDocs: number;
} => {
  let santriBytes = 0;
  data.santriList.forEach(s => {
    santriBytes += getApproximateFirestoreDocSize(s, s.id);
  });

  let recordsBytes = 0;
  data.records.forEach(r => {
    recordsBytes += getApproximateFirestoreDocSize(r, r.id);
  });

  let rulesBytes = 0;
  data.rules.forEach(ru => {
    rulesBytes += getApproximateFirestoreDocSize(ru, ru.id);
  });

  let bkNotesBytes = 0;
  data.bkNotes.forEach(b => {
    bkNotesBytes += getApproximateFirestoreDocSize(b, b.id);
  });

  let resetLogsBytes = 0;
  data.resetLogs.forEach(l => {
    resetLogsBytes += getApproximateFirestoreDocSize(l, l.id);
  });

  const settingsBytes = getApproximateFirestoreDocSize({ academicYear: data.academicYear }, 'global');

  const totalBytes = santriBytes + recordsBytes + rulesBytes + bkNotesBytes + resetLogsBytes + settingsBytes;
  const totalDocs =
    data.santriList.length +
    data.records.length +
    data.rules.length +
    data.bkNotes.length +
    data.resetLogs.length +
    1;

  return {
    totalBytes,
    santriBytes,
    recordsBytes,
    rulesBytes,
    bkNotesBytes,
    resetLogsBytes,
    settingsBytes,
    totalDocs
  };
};

// Helper to format bytes to KB, MB, GB
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Metric computation item interface
export interface QuotaMetricItem {
  name: string;
  type: 'daily' | 'monthly' | 'total';
  used: number;
  limit: number;
  remaining: number;
  percentRemaining: number;
  percentUsed: number;
  formattedUsed: string;
  formattedRemaining: string;
  formattedLimit: string;
  unit: string;
  status: 'safe' | 'warning' | 'critical';
  description: string;
}

export interface CompleteQuotaReport {
  reads: QuotaMetricItem;
  writes: QuotaMetricItem;
  deletes: QuotaMetricItem;
  storage: QuotaMetricItem & {
    breakdown: {
      santri: string;
      records: string;
      rules: string;
      bkNotes: string;
      logs: string;
      totalDocs: number;
    };
  };
  egress: QuotaMetricItem;
  overallHealth: 'safe' | 'warning' | 'critical';
  timeUntilDailyReset: string;
  activityLogs: QuotaActivityLog[];
  projectId: string;
  databaseId: string;
}

// Generate complete quota analysis
export const getCompleteQuotaReport = (
  appData: {
    santriList: Santri[];
    records: PointRecord[];
    rules: RuleItem[];
    bkNotes: BKCounselingNote[];
    resetLogs: AnnualResetLog[];
    academicYear: string;
  },
  firebaseConfig: { projectId?: string; firestoreDatabaseId?: string }
): CompleteQuotaReport => {
  const telemetry = loadQuotaTelemetry();
  const storageStats = calculateDatabaseStorage(appData);

  // Status helper based on percent used
  const getStatus = (percentUsed: number): 'safe' | 'warning' | 'critical' => {
    if (percentUsed >= 85) return 'critical';
    if (percentUsed >= 65) return 'warning';
    return 'safe';
  };

  // 1. Reads Metric (50,000 / day)
  const readsUsed = telemetry.readsToday;
  const readsLimit = SPARK_QUOTA_LIMITS.READS_PER_DAY;
  const readsRemaining = Math.max(0, readsLimit - readsUsed);
  const readsPercentUsed = Number(((readsUsed / readsLimit) * 100).toFixed(2));
  const readsPercentRemaining = Number(((readsRemaining / readsLimit) * 100).toFixed(2));

  const reads: QuotaMetricItem = {
    name: 'Document Reads',
    type: 'daily',
    used: readsUsed,
    limit: readsLimit,
    remaining: readsRemaining,
    percentRemaining: readsPercentRemaining,
    percentUsed: readsPercentUsed,
    formattedUsed: readsUsed.toLocaleString('id-ID'),
    formattedRemaining: readsRemaining.toLocaleString('id-ID'),
    formattedLimit: readsLimit.toLocaleString('id-ID'),
    unit: 'dokumen/hari',
    status: getStatus(readsPercentUsed),
    description: 'Batas pembacaan dokumen Firestore per hari (reset setiap 00:00 UTC / 07:00 WIB)'
  };

  // 2. Writes Metric (20,000 / day)
  const writesUsed = telemetry.writesToday;
  const writesLimit = SPARK_QUOTA_LIMITS.WRITES_PER_DAY;
  const writesRemaining = Math.max(0, writesLimit - writesUsed);
  const writesPercentUsed = Number(((writesUsed / writesLimit) * 100).toFixed(2));
  const writesPercentRemaining = Number(((writesRemaining / writesLimit) * 100).toFixed(2));

  const writes: QuotaMetricItem = {
    name: 'Document Writes',
    type: 'daily',
    used: writesUsed,
    limit: writesLimit,
    remaining: writesRemaining,
    percentRemaining: writesPercentRemaining,
    percentUsed: writesPercentUsed,
    formattedUsed: writesUsed.toLocaleString('id-ID'),
    formattedRemaining: writesRemaining.toLocaleString('id-ID'),
    formattedLimit: writesLimit.toLocaleString('id-ID'),
    unit: 'dokumen/hari',
    status: getStatus(writesPercentUsed),
    description: 'Batas penyimpanan dan pembaruan dokumen Firestore baru per hari'
  };

  // 3. Deletes Metric (20,000 / day)
  const deletesUsed = telemetry.deletesToday;
  const deletesLimit = SPARK_QUOTA_LIMITS.DELETES_PER_DAY;
  const deletesRemaining = Math.max(0, deletesLimit - deletesUsed);
  const deletesPercentUsed = Number(((deletesUsed / deletesLimit) * 100).toFixed(2));
  const deletesPercentRemaining = Number(((deletesRemaining / deletesLimit) * 100).toFixed(2));

  const deletes: QuotaMetricItem = {
    name: 'Document Deletes',
    type: 'daily',
    used: deletesUsed,
    limit: deletesLimit,
    remaining: deletesRemaining,
    percentRemaining: deletesPercentRemaining,
    percentUsed: deletesPercentUsed,
    formattedUsed: deletesUsed.toLocaleString('id-ID'),
    formattedRemaining: deletesRemaining.toLocaleString('id-ID'),
    formattedLimit: deletesLimit.toLocaleString('id-ID'),
    unit: 'dokumen/hari',
    status: getStatus(deletesPercentUsed),
    description: 'Batas penghapusan dokumen Firestore per hari'
  };

  // 4. Storage (1 GiB total)
  const storageUsed = storageStats.totalBytes;
  const storageLimit = SPARK_QUOTA_LIMITS.STORAGE_BYTES;
  const storageRemaining = Math.max(0, storageLimit - storageUsed);
  const storagePercentUsed = Number(((storageUsed / storageLimit) * 100).toFixed(3));
  const storagePercentRemaining = Number(((storageRemaining / storageLimit) * 100).toFixed(3));

  const storage = {
    name: 'Stored Data (Database Storage)',
    type: 'total' as const,
    used: storageUsed,
    limit: storageLimit,
    remaining: storageRemaining,
    percentRemaining: storagePercentRemaining,
    percentUsed: storagePercentUsed,
    formattedUsed: formatBytes(storageUsed),
    formattedRemaining: formatBytes(storageRemaining),
    formattedLimit: formatBytes(storageLimit),
    unit: 'kapasitas total',
    status: getStatus(storagePercentUsed),
    description: 'Total kapasitas penyimpanan database cloud aktif (Spark Free Plan: 1 GiB)',
    breakdown: {
      santri: formatBytes(storageStats.santriBytes),
      records: formatBytes(storageStats.recordsBytes),
      rules: formatBytes(storageStats.rulesBytes),
      bkNotes: formatBytes(storageStats.bkNotesBytes),
      logs: formatBytes(storageStats.resetLogsBytes + storageStats.settingsBytes),
      totalDocs: storageStats.totalDocs
    }
  };

  // 5. Network Egress (10 GiB / month)
  const egressUsed = telemetry.egressThisMonthBytes;
  const egressLimit = SPARK_QUOTA_LIMITS.EGRESS_BYTES_PER_MONTH;
  const egressRemaining = Math.max(0, egressLimit - egressUsed);
  const egressPercentUsed = Number(((egressUsed / egressLimit) * 100).toFixed(3));
  const egressPercentRemaining = Number(((egressRemaining / egressLimit) * 100).toFixed(3));

  const egress: QuotaMetricItem = {
    name: 'Network Egress',
    type: 'monthly',
    used: egressUsed,
    limit: egressLimit,
    remaining: egressRemaining,
    percentRemaining: egressPercentRemaining,
    percentUsed: egressPercentUsed,
    formattedUsed: formatBytes(egressUsed),
    formattedRemaining: formatBytes(egressRemaining),
    formattedLimit: formatBytes(egressLimit),
    unit: 'transfer data/bulan',
    status: getStatus(egressPercentUsed),
    description: 'Batas transfer data keluar dari Firestore ke browser pengguna per bulan (10 GiB)'
  };

  // Overall health assessment
  let overallHealth: 'safe' | 'warning' | 'critical' = 'safe';
  const metrics = [reads, writes, deletes, storage, egress];
  if (metrics.some(m => m.status === 'critical')) {
    overallHealth = 'critical';
  } else if (metrics.some(m => m.status === 'warning')) {
    overallHealth = 'warning';
  }

  return {
    reads,
    writes,
    deletes,
    storage,
    egress,
    overallHealth,
    timeUntilDailyReset: getTimeUntilQuotaReset().text,
    activityLogs: telemetry.activityLogs,
    projectId: firebaseConfig.projectId || 'round-loop-q7c1c',
    databaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-sistempoinsantri-6c1c7c18-632c-4631-bc9c-423992c542a6'
  };
};
