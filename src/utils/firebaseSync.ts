import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, ekskulDb } from '../lib/firebase';
import {
  Santri,
  PointRecord,
  RuleItem,
  AnnualResetLog,
  AuditLog,
  BKCounselingNote,
  BKRoutineSchedule,
  EkskulRecord,
  EkskulPaymentClaim
} from '../types';
import {
  INITIAL_SANTRI,
  INITIAL_RECORDS,
  INITIAL_RULES,
  INITIAL_ACADEMIC_YEAR,
  INITIAL_BK_NOTES,
  INITIAL_BK_SCHEDULES,
  INITIAL_EKSKUL
} from '../data/initialData';
import {
  QuestionnaireBank,
  DEFAULT_BK_QUESTIONNAIRES
} from './bkQuestionnaireData';
import {
  trackFirestoreReads,
  trackFirestoreWrites,
  trackFirestoreDeletes
} from './quotaTracker';

// Helper to recursively remove undefined properties before saving to Firestore
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object') {
        cleaned[key] = removeUndefinedFields(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

const COLLECTIONS = {
  SANTRI: 'santri',
  RECORDS: 'pointRecords',
  RULES: 'rules',
  SETTINGS: 'settings',
  RESET_LOGS: 'resetLogs',
  BK_NOTES: 'bkCounselingNotes',
  BK_SCHEDULES: 'bkRoutineSchedules',
  BK_QUESTIONNAIRES: 'bkQuestionnaires',
  EKSKUL: 'ekskulRecords',
  EXTERNAL_EKSKUL: 'data_ekskul',
  EKSKUL_CLAIMS: 'ekskulPaymentClaims',
  AUDIT_LOGS: 'auditLogs'
};

// Robust normalizer for records coming from external or internal Ekskul DB
export function normalizeEkskulDoc(raw: any, docId: string): EkskulRecord {
  const santriId = raw.santriId || raw.id_santri || raw.santri_id || raw.idSantri || '';
  const nis = String(raw.nis || raw.nisn || raw.noInduk || raw.nomor_induk || '').trim();
  const santriName = raw.santriName || raw.nama || raw.namaSantri || raw.nama_santri || raw.name || '';
  const ekskulName = raw.ekskulName || raw.namaEkskul || raw.nama_ekskul || raw.ekskul || raw.kegiatan || raw.name || 'Ekstrakurikuler';

  let isPaid = false;
  let paymentStatus = raw.paymentStatus || raw.statusPembayaran || raw.status_pembayaran || raw.status || '';

  if (typeof raw.isPaid === 'boolean') {
    isPaid = raw.isPaid;
  } else if (typeof raw.lunas === 'boolean') {
    isPaid = raw.lunas;
  } else if (typeof paymentStatus === 'string') {
    const lower = paymentStatus.toLowerCase();
    if (lower.includes('lunas') && !lower.includes('belum') && !lower.includes('tidak') && !lower.includes('nunggak')) {
      isPaid = true;
    } else if (lower.includes('paid') || lower.includes('sukses') || lower.includes('berhasil')) {
      isPaid = true;
    }
  }

  if (!paymentStatus) {
    paymentStatus = isPaid ? 'Lunas Bulan Ini' : 'Belum Lunas';
  }

  const coachNote = raw.coachNote || raw.catatan || raw.catatanPelatih || raw.catatan_pelatih || raw.keterangan || raw.evaluasi || raw.note || '';
  const semester = raw.semester || 'Ganjil';
  const academicYear = raw.academicYear || raw.tahunAjaran || raw.tahun_ajaran || '2026/2027';

  return {
    id: docId || raw.id || `ekskul-${Math.random().toString(36).substring(2, 9)}`,
    santriId,
    nis: nis && nis !== '-' ? nis : undefined,
    santriName,
    ekskulName,
    category: raw.category,
    paymentStatus,
    isPaid,
    coachName: raw.coachName,
    supervisorName: raw.supervisorName,
    coachNote,
    attendanceRate: raw.attendanceRate,
    attendedSessions: raw.attendedSessions,
    totalSessions: raw.totalSessions,
    statusRisk: raw.statusRisk,
    day: raw.day,
    time: raw.time,
    location: raw.location,
    monthlyFee: raw.monthlyFee,
    monthlyPayments: raw.monthlyPayments,
    semester,
    academicYear
  };
}

// Seed initial data to Firestore if the database is brand new and empty
export async function seedFirestoreIfEmpty() {
  try {
    const santriSnap = await getDocs(collection(db, COLLECTIONS.SANTRI));
    trackFirestoreReads(santriSnap.size || 1, 'santri', 'Pengecekan inisialisasi cloud database');

    if (!santriSnap.empty) {
      // Database already has data, check if BK notes collection needs initial seed
      const bkSnap = await getDocs(collection(db, COLLECTIONS.BK_NOTES));
      trackFirestoreReads(bkSnap.size || 1, 'bkCounselingNotes', 'Pengecekan inisialisasi modul BK');

      if (bkSnap.empty && INITIAL_BK_NOTES.length > 0) {
        const batch = writeBatch(db);
        INITIAL_BK_NOTES.forEach(bk => {
          batch.set(doc(db, COLLECTIONS.BK_NOTES, bk.id), removeUndefinedFields(bk));
        });
        await batch.commit();
        trackFirestoreWrites(INITIAL_BK_NOTES.length, 'bkCounselingNotes', 'Inisialisasi data awal format BK');
      }

      // Check if BK schedules collection needs initial seed
      const schedSnap = await getDocs(collection(db, COLLECTIONS.BK_SCHEDULES));
      trackFirestoreReads(schedSnap.size || 1, 'bkRoutineSchedules', 'Pengecekan inisialisasi jadwal BK');
      if (schedSnap.empty && INITIAL_BK_SCHEDULES.length > 0) {
        const batch = writeBatch(db);
        INITIAL_BK_SCHEDULES.forEach(s => {
          batch.set(doc(db, COLLECTIONS.BK_SCHEDULES, s.id), removeUndefinedFields(s));
        });
        await batch.commit();
        trackFirestoreWrites(INITIAL_BK_SCHEDULES.length, 'bkRoutineSchedules', 'Inisialisasi jadwal rutin awal BK');
      }

      // Check if Ekskul collection needs initial seed
      const ekskulSnap = await getDocs(collection(db, COLLECTIONS.EKSKUL));
      trackFirestoreReads(ekskulSnap.size || 1, 'ekskulRecords', 'Pengecekan inisialisasi ekskul');
      if (ekskulSnap.empty && INITIAL_EKSKUL.length > 0) {
        const batch = writeBatch(db);
        INITIAL_EKSKUL.forEach(e => {
          batch.set(doc(db, COLLECTIONS.EKSKUL, e.id), removeUndefinedFields(e));
        });
        await batch.commit();
        trackFirestoreWrites(INITIAL_EKSKUL.length, 'ekskulRecords', 'Inisialisasi ekskul awal');
      }

      // Check if BK questionnaires collection needs initial seed
      const questSnap = await getDocs(collection(db, COLLECTIONS.BK_QUESTIONNAIRES));
      trackFirestoreReads(questSnap.size || 1, 'bkQuestionnaires', 'Pengecekan inisialisasi butir soal BK');
      if (questSnap.empty) {
        const batch = writeBatch(db);
        batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMP'), removeUndefinedFields(DEFAULT_BK_QUESTIONNAIRES.SMP));
        batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMA'), removeUndefinedFields(DEFAULT_BK_QUESTIONNAIRES.SMA));
        await batch.commit();
        trackFirestoreWrites(2, 'bkQuestionnaires', 'Inisialisasi format kuesioner awal BK');
      }

      return;
    }

    console.log('Firestore is empty. Seeding initial data to Cloud...');
    const batch = writeBatch(db);

    // Seed Santri
    INITIAL_SANTRI.forEach(s => {
      batch.set(doc(db, COLLECTIONS.SANTRI, s.id), removeUndefinedFields(s));
    });

    // Seed Point Records
    INITIAL_RECORDS.forEach(r => {
      batch.set(doc(db, COLLECTIONS.RECORDS, r.id), removeUndefinedFields(r));
    });

    // Seed Rules
    INITIAL_RULES.forEach(ru => {
      batch.set(doc(db, COLLECTIONS.RULES, ru.id), removeUndefinedFields(ru));
    });

    // Seed Global Settings
    batch.set(doc(db, COLLECTIONS.SETTINGS, 'global'), {
      academicYear: INITIAL_ACADEMIC_YEAR
    });

    // Seed BK Notes
    INITIAL_BK_NOTES.forEach(bk => {
      batch.set(doc(db, COLLECTIONS.BK_NOTES, bk.id), removeUndefinedFields(bk));
    });

    // Seed BK Schedules
    INITIAL_BK_SCHEDULES.forEach(s => {
      batch.set(doc(db, COLLECTIONS.BK_SCHEDULES, s.id), removeUndefinedFields(s));
    });

    // Seed Ekskul
    INITIAL_EKSKUL.forEach(e => {
      batch.set(doc(db, COLLECTIONS.EKSKUL, e.id), removeUndefinedFields(e));
    });

    // Seed BK Questionnaires
    batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMP'), removeUndefinedFields(DEFAULT_BK_QUESTIONNAIRES.SMP));
    batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMA'), removeUndefinedFields(DEFAULT_BK_QUESTIONNAIRES.SMA));

    await batch.commit();
    const totalSeeded = INITIAL_SANTRI.length + INITIAL_RECORDS.length + INITIAL_RULES.length + 1 + INITIAL_BK_NOTES.length + INITIAL_BK_SCHEDULES.length + 2;
    trackFirestoreWrites(totalSeeded, 'all', 'Seeding database cloud perdana');
    console.log('Cloud seeding completed successfully!');
  } catch (err) {
    console.error('Failed to seed Firestore:', err);
  }
}

// Subscribe to real-time updates from Cloud Firestore
export function subscribeToCloudStore(callbacks: {
  onSantriChange: (data: Santri[]) => void;
  onRecordsChange: (data: PointRecord[]) => void;
  onRulesChange: (data: RuleItem[]) => void;
  onAcademicYearChange: (year: string) => void;
  onResetLogsChange: (logs: AnnualResetLog[]) => void;
  onBKNotesChange?: (notes: BKCounselingNote[]) => void;
  onBKSchedulesChange?: (schedules: BKRoutineSchedule[]) => void;
  onBKQuestionnairesChange?: (bank: QuestionnaireBank) => void;
  onEkskulRecordsChange?: (data: any[]) => void;
  onEkskulClaimsChange?: (claims: EkskulPaymentClaim[]) => void;
  onAuditLogsChange?: (logs: AuditLog[]) => void;
}) {
  // Listen to Santri
  const unsubSantri = onSnapshot(
    collection(db, COLLECTIONS.SANTRI),
    snapshot => {
      const list: Santri[] = [];
      snapshot.forEach(docSnap => {
        const raw = docSnap.data() as Record<string, unknown>;
        const { dormitory, ...clean } = raw;
        list.push(clean as unknown as Santri);
      });
      trackFirestoreReads(snapshot.size, 'santri', 'Sinkronisasi realtime data santri');
      callbacks.onSantriChange(list);
    },
    err => console.error('Santri listener error:', err)
  );

  // Listen to Point Records
  const unsubRecords = onSnapshot(
    collection(db, COLLECTIONS.RECORDS),
    snapshot => {
      const list: PointRecord[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as PointRecord);
      });
      trackFirestoreReads(snapshot.size, 'pointRecords', 'Sinkronisasi realtime riwayat poin santri');
      callbacks.onRecordsChange(list);
    },
    err => console.error('Records listener error:', err)
  );

  // Listen to Rules
  const unsubRules = onSnapshot(
    collection(db, COLLECTIONS.RULES),
    snapshot => {
      const list: RuleItem[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as RuleItem);
      });
      trackFirestoreReads(snapshot.size, 'rules', 'Sinkronisasi realtime aturan & poin');
      callbacks.onRulesChange(list);
    },
    err => console.error('Rules listener error:', err)
  );

  // Listen to Settings / Academic Year
  const unsubSettings = onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'global'),
    docSnap => {
      if (docSnap.exists()) {
        const year = docSnap.data().academicYear;
        trackFirestoreReads(1, 'settings', 'Sinkronisasi realtime tahun ajaran aktif');
        if (year) callbacks.onAcademicYearChange(year);
      }
    },
    err => console.error('Settings listener error:', err)
  );

  // Listen to Reset Logs
  const unsubResetLogs = onSnapshot(
    collection(db, COLLECTIONS.RESET_LOGS),
    snapshot => {
      const list: AnnualResetLog[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as AnnualResetLog);
      });
      trackFirestoreReads(snapshot.size, 'resetLogs', 'Sinkronisasi realtime log reset tahunan');
      callbacks.onResetLogsChange(list);
    },
    err => console.error('Reset Logs listener error:', err)
  );

  // Listen to BK Counseling Notes
  let unsubBK = () => {};
  if (callbacks.onBKNotesChange) {
    unsubBK = onSnapshot(
      collection(db, COLLECTIONS.BK_NOTES),
      snapshot => {
        const list: BKCounselingNote[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as BKCounselingNote);
        });
        trackFirestoreReads(snapshot.size, 'bkCounselingNotes', 'Sinkronisasi realtime catatan konseling BK');
        callbacks.onBKNotesChange?.(list);
      },
      err => console.error('BK notes listener error:', err)
    );
  }

  // Listen to BK Routine Schedules
  let unsubBKSchedules = () => {};
  if (callbacks.onBKSchedulesChange) {
    unsubBKSchedules = onSnapshot(
      collection(db, COLLECTIONS.BK_SCHEDULES),
      snapshot => {
        const list: BKRoutineSchedule[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as BKRoutineSchedule);
        });
        trackFirestoreReads(snapshot.size, 'bkRoutineSchedules', 'Sinkronisasi realtime jadwal antrean BK');
        callbacks.onBKSchedulesChange?.(list);
      },
      err => console.error('BK schedules listener error:', err)
    );
  }

  // Listen to BK Questionnaires Bank
  let unsubBKQuestions = () => {};
  if (callbacks.onBKQuestionnairesChange) {
    unsubBKQuestions = onSnapshot(
      collection(db, COLLECTIONS.BK_QUESTIONNAIRES),
      snapshot => {
        if (!snapshot.empty) {
          const bank: Record<string, any> = {};
          snapshot.forEach(docSnap => {
            bank[docSnap.id] = docSnap.data();
          });
          if (bank.SMP && bank.SMA) {
            trackFirestoreReads(snapshot.size, 'bkQuestionnaires', 'Sinkronisasi realtime butir pertanyaan BK');
            callbacks.onBKQuestionnairesChange?.(bank as QuestionnaireBank);
          }
        }
      },
      err => console.error('BK questionnaires listener error:', err)
    );
  }

  let unsubInternalEkskul = () => {};
  let unsubExternalClubs = () => {};
  let unsubExternalStudents = () => {};

  if (callbacks.onEkskulRecordsChange) {
    let internalList: EkskulRecord[] = [];
    let externalClubsMap: Record<string, any> = {};
    let externalRawStudents: any[] = [];
    let directEkskulDocs: EkskulRecord[] = [];

    const rebuildAndEmit = () => {
      const externalList: EkskulRecord[] = [];

      // 1. Convert external students enrollments to EkskulRecord
      externalRawStudents.forEach((s: any) => {
        const enrolled = s.enrolledClubIds || [];
        const payments = s.monthlyPayments || {};
        
        // Active month is '2026-09' (September 2026)
        const currentMonthPayment = payments['2026-09'];
        const isPaid = currentMonthPayment ? (currentMonthPayment.status === 'LUNAS' || currentMonthPayment.isPaid === true) : false;

        let paymentStatus = 'Belum Lunas (September 2026)';
        if (isPaid) {
          paymentStatus = 'Lunas (September 2026)';
        } else if (currentMonthPayment && (currentMonthPayment.status === 'NUNGGAK' || currentMonthPayment.status === 'BELUM_LUNAS')) {
          paymentStatus = `Menunggak (September 2026 - Rp ${(currentMonthPayment.amount || 150000).toLocaleString('id-ID')})`;
        }

        // If enrolled in specific clubs
        if (Array.isArray(enrolled) && enrolled.length > 0) {
          enrolled.forEach((clubId: string) => {
            const club = externalClubsMap[clubId] || {};
            const clubStats = s.clubStats?.[clubId];
            const monthlyFee = club.monthlyFee || (club.fee ? Number(club.fee) : 150000);

            if (!isPaid && !currentMonthPayment) {
              paymentStatus = `Belum Lunas (September 2026 - Rp ${monthlyFee.toLocaleString('id-ID')})`;
            }

            const coachNote = s.coachNote || clubStats?.coachNote ||
              (clubStats ? `Kehadiran: ${clubStats.attendanceRate || s.attendanceRate || 100}%. Status keaktifan: ${clubStats.statusRisk || s.statusRisk || 'Sangat Baik'}.` : 'Aktif berpartisipasi dalam sesi kegiatan ekstrakurikuler.');

            externalList.push({
              id: `ext-${s.id}-${clubId}`,
              santriId: s.id,
              nis: s.nisn && s.nisn !== '-' ? s.nisn : undefined,
              santriName: s.name,
              ekskulName: (club.name || 'Ekstrakurikuler').trim(),
              category: club.category,
              paymentStatus,
              isPaid,
              coachName: club.coachName || 'Pembina Ekskul',
              supervisorName: club.supervisorName || 'Khusen Abdul kadhir, S.Pd',
              coachNote,
              attendanceRate: clubStats?.attendanceRate ?? s.attendanceRate ?? 100,
              attendedSessions: clubStats?.attendedSessions ?? s.attendedSessionsCount ?? 0,
              totalSessions: clubStats?.totalSessions ?? s.totalSessionsCount ?? 0,
              statusRisk: clubStats?.statusRisk ?? s.statusRisk ?? 'Sangat Baik',
              day: club.day,
              time: club.startTime ? `${club.startTime} - ${club.endTime}` : undefined,
              location: club.location,
              monthlyFee,
              monthlyPayments: s.monthlyPayments,
              semester: 'Ganjil',
              academicYear: '2026/2027'
            });
          });
        }
      });

      // 2. Add direct ekskul docs
      directEkskulDocs.forEach(d => externalList.push(d));

      // 3. Combine internal and external
      const combinedMap = new Map<string, EkskulRecord>();
      internalList.forEach(item => combinedMap.set(item.id, item));
      externalList.forEach(item => combinedMap.set(item.id, item));

      callbacks.onEkskulRecordsChange?.(Array.from(combinedMap.values()));
    };

    // 1. Listen to internal db ekskulRecords
    unsubInternalEkskul = onSnapshot(
      collection(db, COLLECTIONS.EKSKUL),
      snapshot => {
        const list: EkskulRecord[] = [];
        snapshot.forEach(docSnap => {
          list.push(normalizeEkskulDoc(docSnap.data(), docSnap.id));
        });
        internalList = list;
        trackFirestoreReads(snapshot.size, 'ekskulRecords', 'Sinkronisasi internal data ekskul');
        rebuildAndEmit();
      },
      err => console.warn('Internal Ekskul listener notice:', err.message)
    );

    // 2. Listen to external clubs (sistem-kesiswaan-b68a0 -> data_ekskul)
    try {
      unsubExternalClubs = onSnapshot(
        collection(ekskulDb, 'data_ekskul'),
        snapshot => {
          const clubs: Record<string, any> = {};
          const directDocs: EkskulRecord[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            clubs[docSnap.id] = { id: docSnap.id, ...data };
            // Also if it looks like an individual student report document
            if (data.santriId || data.nis || data.santriName) {
              directDocs.push(normalizeEkskulDoc(data, docSnap.id));
            }
          });
          externalClubsMap = clubs;
          directEkskulDocs = directDocs;
          trackFirestoreReads(snapshot.size, 'data_ekskul', 'Sinkronisasi master ekskul');
          rebuildAndEmit();
        },
        err => console.info('External Clubs Database note:', err.message)
      );
    } catch (e: any) {
      console.info('External Clubs subscription skipped:', e?.message);
    }

    // 3. Listen to external students (sistem-kesiswaan-b68a0 -> students)
    try {
      unsubExternalStudents = onSnapshot(
        collection(ekskulDb, 'students'),
        snapshot => {
          const list: any[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          externalRawStudents = list;
          trackFirestoreReads(snapshot.size, 'students', 'Sinkronisasi peserta ekskul & tagihan');
          rebuildAndEmit();
        },
        err => console.info('External Students Database note:', err.message)
      );
    } catch (e: any) {
      console.info('External Students subscription skipped:', e?.message);
    }
  }

  // Listen to Ekskul Payment Claims
  let unsubClaims = () => {};
  if (callbacks.onEkskulClaimsChange) {
    unsubClaims = onSnapshot(
      collection(db, COLLECTIONS.EKSKUL_CLAIMS),
      snapshot => {
        const claims: EkskulPaymentClaim[] = [];
        snapshot.forEach(docSnap => {
          claims.push({ id: docSnap.id, ...(docSnap.data() as any) } as EkskulPaymentClaim);
        });
        trackFirestoreReads(snapshot.size, 'ekskulPaymentClaims', 'Sinkronisasi klaim pembayaran ekskul');
        callbacks.onEkskulClaimsChange?.(claims);
      },
      err => console.error('Ekskul claims listener error:', err)
    );
  }

  // Listen to Audit Logs
  let unsubAuditLogs = () => {};
  if (callbacks.onAuditLogsChange) {
    unsubAuditLogs = onSnapshot(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      snapshot => {
        const logs: AuditLog[] = [];
        snapshot.forEach(docSnap => {
          logs.push({ id: docSnap.id, ...(docSnap.data() as any) } as AuditLog);
        });
        // Sort descending by timestamp
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        trackFirestoreReads(snapshot.size, 'auditLogs', 'Sinkronisasi riwayat audit perubahan data');
        callbacks.onAuditLogsChange?.(logs);
      },
      err => console.error('Audit logs listener error:', err)
    );
  }

  return () => {
    unsubSantri();
    unsubRecords();
    unsubRules();
    unsubSettings();
    unsubResetLogs();
    unsubBK();
    unsubBKSchedules();
    unsubBKQuestions();
    unsubInternalEkskul();
    unsubExternalClubs();
    unsubExternalStudents();
    unsubClaims();
    unsubAuditLogs();
  };
}

export async function cloudSaveAuditLogs(logs: AuditLog[]) {
  if (!logs || logs.length === 0) return;
  try {
    const batch = writeBatch(db);
    logs.forEach(log => {
      batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), removeUndefinedFields(log));
    });
    await batch.commit();
    trackFirestoreWrites(logs.length, 'auditLogs', `Catat ${logs.length} log audit perubahan data`);
  } catch (e) {
    console.error('Failed to save audit logs to cloud:', e);
  }
}

export async function cloudSaveAuditLog(log: AuditLog) {
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), removeUndefinedFields(log));
    trackFirestoreWrites(1, 'auditLogs', `Catat log audit: ${log.actionType} ${log.santriName}`);
  } catch (e) {
    console.error('Failed to save audit log to cloud:', e);
  }
}

// Single Item Mutations to Cloud
export async function cloudSaveSantriItem(santri: Santri) {
  try {
    await setDoc(doc(db, COLLECTIONS.SANTRI, santri.id), removeUndefinedFields(santri));
    trackFirestoreWrites(1, 'santri', `Simpan santri: ${santri.name}`);
  } catch (e) {
    console.error('Failed to save santri item to cloud:', e);
  }
}

export async function cloudDeleteSantriItem(santriId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SANTRI, santriId));
    trackFirestoreDeletes(1, 'santri', `Hapus santri ID: ${santriId}`);
  } catch (e) {
    console.error('Failed to delete santri item from cloud:', e);
  }
}

export async function cloudDeleteMultipleSantri(santriIds: string[]) {
  try {
    const batch = writeBatch(db);
    santriIds.forEach(id => {
      batch.delete(doc(db, COLLECTIONS.SANTRI, id));
    });
    await batch.commit();
    trackFirestoreDeletes(santriIds.length, 'santri', `Hapus massal ${santriIds.length} santri`);
  } catch (e) {
    console.error('Failed to delete multiple santri from cloud:', e);
  }
}

export async function cloudBatchSaveSantri(santriList: Santri[]) {
  try {
    const batch = writeBatch(db);
    santriList.forEach(s => {
      batch.set(doc(db, COLLECTIONS.SANTRI, s.id), removeUndefinedFields(s));
    });
    await batch.commit();
    trackFirestoreWrites(santriList.length, 'santri', `Batch simpan ${santriList.length} data santri`);
  } catch (e) {
    console.error('Failed to batch save santri list to cloud:', e);
  }
}

export async function cloudSaveRecordItem(record: PointRecord) {
  try {
    await setDoc(doc(db, COLLECTIONS.RECORDS, record.id), removeUndefinedFields(record));
    trackFirestoreWrites(1, 'pointRecords', `Catat poin: ${record.santriName} (${record.title})`);
  } catch (e) {
    console.error('Failed to save point record item to cloud:', e);
  }
}

export async function cloudBatchSaveRecords(records: PointRecord[]) {
  try {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(r => {
        batch.set(doc(db, COLLECTIONS.RECORDS, r.id), removeUndefinedFields(r));
      });
      await batch.commit();
    }
    trackFirestoreWrites(records.length, 'pointRecords', `Batch catat ${records.length} riwayat poin`);
  } catch (e) {
    console.error('Failed to batch save records to cloud:', e);
  }
}

export async function cloudDeleteRecordItem(recordId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RECORDS, recordId));
    trackFirestoreDeletes(1, 'pointRecords', `Hapus catatan poin ID: ${recordId}`);
  } catch (e) {
    console.error('Failed to delete record item from cloud:', e);
  }
}

export async function cloudDeleteMultipleRecords(recordIds: string[]) {
  try {
    const batch = writeBatch(db);
    recordIds.forEach(id => {
      batch.delete(doc(db, COLLECTIONS.RECORDS, id));
    });
    await batch.commit();
    trackFirestoreDeletes(recordIds.length, 'pointRecords', `Hapus ${recordIds.length} catatan poin`);
  } catch (e) {
    console.error('Failed to delete multiple records from cloud:', e);
  }
}

export async function cloudSaveRuleItem(rule: RuleItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.RULES, rule.id), removeUndefinedFields(rule));
    trackFirestoreWrites(1, 'rules', `Simpan aturan: ${rule.title}`);
  } catch (e) {
    console.error('Failed to save rule item to cloud:', e);
  }
}

export async function cloudBatchSaveRules(rules: RuleItem[]) {
  try {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < rules.length; i += CHUNK_SIZE) {
      const chunk = rules.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(r => {
        batch.set(doc(db, COLLECTIONS.RULES, r.id), removeUndefinedFields(r));
      });
      await batch.commit();
    }
    trackFirestoreWrites(rules.length, 'rules', `Batch simpan ${rules.length} aturan tata tertib`);
  } catch (e) {
    console.error('Failed to batch save rules to cloud:', e);
  }
}

export async function cloudDeleteRuleItem(ruleId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RULES, ruleId));
    trackFirestoreDeletes(1, 'rules', `Hapus aturan ID: ${ruleId}`);
  } catch (e) {
    console.error('Failed to delete rule item from cloud:', e);
  }
}

export async function cloudDeleteMultipleRules(ruleIds: string[]) {
  try {
    const batch = writeBatch(db);
    ruleIds.forEach(id => {
      batch.delete(doc(db, COLLECTIONS.RULES, id));
    });
    await batch.commit();
    trackFirestoreDeletes(ruleIds.length, 'rules', `Hapus ${ruleIds.length} aturan`);
  } catch (e) {
    console.error('Failed to delete multiple rules from cloud:', e);
  }
}

export async function cloudSaveAcademicYear(year: string) {
  try {
    await setDoc(
      doc(db, COLLECTIONS.SETTINGS, 'global'),
      { academicYear: year },
      { merge: true }
    );
    trackFirestoreWrites(1, 'settings', `Pembaruan tahun ajaran aktif: ${year}`);
  } catch (e) {
    console.error('Failed to save academic year to cloud:', e);
  }
}

export async function cloudSaveResetLog(log: AnnualResetLog) {
  try {
    await setDoc(doc(db, COLLECTIONS.RESET_LOGS, log.id), removeUndefinedFields(log));
    trackFirestoreWrites(1, 'resetLogs', `Simpan log reset tahun ajaran ${log.fromAcademicYear} -> ${log.toAcademicYear}`);
  } catch (e) {
    console.error('Failed to save reset log to cloud:', e);
  }
}

// BK Counseling Notes Cloud Mutations
export async function cloudSaveBKNoteItem(note: BKCounselingNote) {
  try {
    const cleanNote = removeUndefinedFields(note);
    await setDoc(doc(db, COLLECTIONS.BK_NOTES, note.id), cleanNote);
    trackFirestoreWrites(1, 'bkCounselingNotes', `Simpan sesi konseling BK: ${note.santriName}`);
  } catch (e) {
    console.error('Failed to save BK note item to cloud:', e);
  }
}

export async function cloudDeleteBKNoteItem(noteId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BK_NOTES, noteId));
    trackFirestoreDeletes(1, 'bkCounselingNotes', `Hapus catatan konseling BK ID: ${noteId}`);
  } catch (e) {
    console.error('Failed to delete BK note item from cloud:', e);
  }
}

export async function cloudBatchSaveBKNotes(notes: BKCounselingNote[]) {
  try {
    const batch = writeBatch(db);
    notes.forEach(n => {
      batch.set(doc(db, COLLECTIONS.BK_NOTES, n.id), removeUndefinedFields(n));
    });
    await batch.commit();
    trackFirestoreWrites(notes.length, 'bkCounselingNotes', `Batch simpan ${notes.length} catatan konseling BK`);
  } catch (e) {
    console.error('Failed to batch save BK notes to cloud:', e);
  }
}

// BK Routine Schedules Cloud Mutations
export async function cloudSaveBKScheduleItem(schedule: BKRoutineSchedule) {
  try {
    const clean = removeUndefinedFields(schedule);
    await setDoc(doc(db, COLLECTIONS.BK_SCHEDULES, schedule.id), clean);
    trackFirestoreWrites(1, 'bkRoutineSchedules', `Simpan jadwal BK: ${schedule.santriName}`);
  } catch (e) {
    console.error('Failed to save BK schedule to cloud:', e);
  }
}

export async function cloudDeleteBKScheduleItem(scheduleId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BK_SCHEDULES, scheduleId));
    trackFirestoreDeletes(1, 'bkRoutineSchedules', `Hapus jadwal BK ID: ${scheduleId}`);
  } catch (e) {
    console.error('Failed to delete BK schedule from cloud:', e);
  }
}

export async function cloudBatchSaveBKSchedules(schedules: BKRoutineSchedule[]) {
  try {
    const batch = writeBatch(db);
    schedules.forEach(s => {
      batch.set(doc(db, COLLECTIONS.BK_SCHEDULES, s.id), removeUndefinedFields(s));
    });
    await batch.commit();
    trackFirestoreWrites(schedules.length, 'bkRoutineSchedules', `Batch simpan ${schedules.length} jadwal BK`);
  } catch (e) {
    console.error('Failed to batch save BK schedules to cloud:', e);
  }
}

// BK Questionnaires Bank Cloud Mutations
export async function cloudSaveBKQuestionnaires(bank: QuestionnaireBank) {
  try {
    const batch = writeBatch(db);
    if (bank.SMP) {
      batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMP'), removeUndefinedFields(bank.SMP));
    }
    if (bank.SMA) {
      batch.set(doc(db, COLLECTIONS.BK_QUESTIONNAIRES, 'SMA'), removeUndefinedFields(bank.SMA));
    }
    await batch.commit();
    trackFirestoreWrites(2, 'bkQuestionnaires', 'Perbarui bank pertanyaan kuesioner BK');
  } catch (e) {
    console.error('Failed to save BK questionnaires to cloud:', e);
  }
}

// Bulk overwrite for restore backup
export async function cloudOverwriteFullBackup(data: {
  santriList: Santri[];
  records: PointRecord[];
  rules: RuleItem[];
  academicYear: string;
  resetLogs: AnnualResetLog[];
  bkNotes?: BKCounselingNote[];
  bkSchedules?: BKRoutineSchedule[];
}) {
  try {
    let writeCount = 0;
    // 1. Save Santri
    for (const s of data.santriList) {
      await setDoc(doc(db, COLLECTIONS.SANTRI, s.id), removeUndefinedFields(s));
      writeCount++;
    }
    // 2. Save Records
    for (const r of data.records) {
      await setDoc(doc(db, COLLECTIONS.RECORDS, r.id), removeUndefinedFields(r));
      writeCount++;
    }
    // 3. Save Rules
    for (const ru of data.rules) {
      await setDoc(doc(db, COLLECTIONS.RULES, ru.id), removeUndefinedFields(ru));
      writeCount++;
    }
    // 4. Save Settings
    await setDoc(
      doc(db, COLLECTIONS.SETTINGS, 'global'),
      { academicYear: data.academicYear },
      { merge: true }
    );
    writeCount++;
    // 5. Save Reset Logs
    for (const l of data.resetLogs) {
      await setDoc(doc(db, COLLECTIONS.RESET_LOGS, l.id), removeUndefinedFields(l));
      writeCount++;
    }
    // 6. Save BK Notes if provided
    if (data.bkNotes) {
      for (const n of data.bkNotes) {
        await setDoc(doc(db, COLLECTIONS.BK_NOTES, n.id), removeUndefinedFields(n));
        writeCount++;
      }
    }
    // 7. Save BK Schedules if provided
    if (data.bkSchedules) {
      for (const s of data.bkSchedules) {
        await setDoc(doc(db, COLLECTIONS.BK_SCHEDULES, s.id), removeUndefinedFields(s));
        writeCount++;
      }
    }
    trackFirestoreWrites(writeCount, 'all', `Restore backup database (${writeCount} dokumen)`);
  } catch (e) {
    console.error('Failed to overwrite backup to cloud:', e);
  }
}

// Ekskul Payment Claims Cloud Mutations
export async function cloudSaveEkskulPaymentClaim(claim: EkskulPaymentClaim) {
  try {
    const clean = removeUndefinedFields(claim);
    await setDoc(doc(db, COLLECTIONS.EKSKUL_CLAIMS, claim.id), clean);
    trackFirestoreWrites(1, 'ekskulPaymentClaims', `Klaim konfirmasi bayar ekskul: ${claim.santriName} (${claim.monthLabel})`);
  } catch (e) {
    console.error('Failed to save ekskul payment claim to cloud:', e);
  }
}

export async function cloudUpdateEkskulPaymentClaim(claimId: string, updates: Partial<EkskulPaymentClaim>) {
  try {
    const clean = removeUndefinedFields(updates);
    await setDoc(doc(db, COLLECTIONS.EKSKUL_CLAIMS, claimId), clean, { merge: true });
    trackFirestoreWrites(1, 'ekskulPaymentClaims', `Pembaruan status klaim ekskul ID: ${claimId}`);
  } catch (e) {
    console.error('Failed to update ekskul payment claim in cloud:', e);
  }
}

export async function cloudDeleteEkskulPaymentClaim(claimId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EKSKUL_CLAIMS, claimId));
    trackFirestoreDeletes(1, 'ekskulPaymentClaims', `Hapus klaim bayar ekskul ID: ${claimId}`);
  } catch (e) {
    console.error('Failed to delete ekskul payment claim from cloud:', e);
  }
}

export async function cloudSaveEkskulRecord(record: EkskulRecord) {
  try {
    const clean = removeUndefinedFields(record);
    await setDoc(doc(db, COLLECTIONS.EKSKUL, record.id), clean, { merge: true });
    trackFirestoreWrites(1, 'ekskulRecords', `Simpan/perbarui data ekskul ID: ${record.id}`);
  } catch (e) {
    console.error('Failed to save ekskul record to cloud:', e);
  }
}

export async function cloudSyncStudentEkskulPaymentToExternalDb(santriId: string, monthKey: string, paymentData: any) {
  try {
    if (ekskulDb) {
      await setDoc(doc(ekskulDb, 'students', santriId), {
        monthlyPayments: {
          [monthKey]: paymentData
        }
      }, { merge: true });
      trackFirestoreWrites(1, 'students', `Sinkronisasi pembayaran santri ${santriId} bulan ${monthKey}`);
    }
  } catch (e) {
    console.warn('External ekskulDb sync notice:', e);
  }
}
