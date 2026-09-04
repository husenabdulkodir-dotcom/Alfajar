export type CategoryType = 'Ringan' | 'Sedang' | 'Berat';
export type EntryType = 'Pelanggaran' | 'Kebaikan';

export interface EkskulPaymentClaim {
  id: string;
  santriId: string;
  santriName: string;
  santriClass: string;
  santriNis?: string;
  ekskulId?: string;
  ekskulName: string;
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "September 2026"
  amount: number; // e.g. 50000
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: string; // "Transfer Bank", "Tunai ke Pembina", "QRIS", "Lainnya"
  senderName?: string; // Nama Pemilik Rekening / Pengirim
  bankName?: string; // BCA / Mandiri / BSI / BRI / dll
  notes?: string; // Catatan tambahan dari wali santri
  proofImage?: string; // Base64 screenshot/foto bukti transfer
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedAt: string; // ISO string
  submittedByParent: string; // Nama Wali Santri
  parentPhone?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface EkskulRecord {
  id: string;
  santriId?: string;
  nis?: string;
  santriName?: string;
  ekskulName: string; // e.g. "Futsal", "Multimedia", "Beladiri Tapak Suci"
  category?: string;
  paymentStatus: string; // e.g. "Lunas Bulan Ini", "Belum Lunas"
  isPaid: boolean;
  coachName?: string;
  supervisorName?: string;
  coachNote?: string; // Catatan pelatih / evaluasi
  attendanceRate?: number; // Persentase kehadiran
  attendedSessions?: number;
  totalSessions?: number;
  statusRisk?: string; // "Sangat Baik", "Baik", "Perlu Perhatian"
  day?: string;
  time?: string;
  location?: string;
  monthlyFee?: number;
  monthlyPayments?: Record<string, { status: string; amount?: number; paidAt?: string }>;
  semester?: string;
  academicYear?: string;
}

export interface RuleItem {
  id: string;
  type: EntryType;
  category: CategoryType;
  title: string;
  defaultPoints: number; // Positive for kebaikan, negative for pelanggaran
  defaultPunishmentOrReward: string;
  description?: string;
}

export interface PointRecord {
  id: string;
  santriId: string;
  santriName: string;
  santriNis?: string;
  santriNisn?: string;
  type: EntryType;
  category: CategoryType;
  title: string;
  points: number; // e.g. -10 or +15
  date: string; // ISO string or YYYY-MM-DD
  academicYear: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  punishmentOrReward: string;
  notes?: string;
  recordedBy: string; // e.g. "Ust. Ahmad (Kesiswaan)"
  isHeavyViolation?: boolean; // True if category is 'Berat' and type is 'Pelanggaran'
  parentConfirmed?: boolean;
  parentConfirmedAt?: string;
  parentNote?: string;
}

export interface Santri {
  id: string;
  nis?: string;
  nisn?: string; // Nomor Induk Siswa Nasional (10 digit resmi)
  name: string;
  class: string; // e.g., "7A", "10 IPA 1"
  parentName: string;
  parentPhone: string;
  accessPin: string; // PIN for parent login
  avatarUrl?: string;
  academicYear: string; // Current active academic year e.g., "2026/2027"
  manualStatus?: SantriStatus; // Override status assigned by Kesiswaan
  organizationRole?: string; // Jabatan OSIS (Ketua OSIS, Qism Ibadah, Amni, Lughoh, Nadzofah, dll) / Ketua Kelas
}

export interface AnnualResetLog {
  id: string;
  resetDate: string;
  fromAcademicYear: string;
  toAcademicYear: string;
  totalSantriReset: number;
  preservedHeavyViolationsCount: number;
  performedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String timestamp
  santriId: string;
  santriName: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PROMOTE' | 'IMPORT' | 'RESTORE' | 'BATCH_UPDATE';
  fieldName?: string; // e.g. "class", "organizationRole", "nis", "name", "manualStatus"
  oldValue?: string;
  newValue?: string;
  performedBy: string; // e.g. "Admin Kesiswaan", "User Browser", "System Promotion"
  details?: string;
}

export interface ParentFeedback {
  recordId: string;
  santriId: string;
  confirmedAt: string;
  note: string;
}

export type SantriStatus = 'Teladan' | 'Baik' | 'Aman' | 'Peringatan' | 'SP 1' | 'SP 2' | 'SP 3' | 'Kritis';

// Bimbingan Konseling (BK) Types - Dirancang Khusus untuk Sekolah Full Day & Bimbingan Berkala
export type BKProblemType =
  | 'Bimbingan Rutin Terjadwal (Check-in Berkala)'
  | 'Konsultasi Minat, Bakat & Karir'
  | 'Bimbingan Belajar & Manajemen Waktu Full Day'
  | 'Sosial & Hubungan Teman Sebaya'
  | 'Pribadi & Kesejahteraan Siswa'
  | 'Kedisiplinan & Tata Tertib Sekolah'
  | 'Pembinaan Khusus / Kasus Khusus'
  | 'Spiritualitas & Pembiasaan Karakter'
  // Legacy compatibility
  | 'Kedisiplinan & Tata Tertib'
  | 'Pribadi & Emosi'
  | 'Akademik & Minat Belajar'
  | 'Sosial & Pergaulan Santri'
  | 'Keluarga & Adaptasi Sekolah'
  | 'Pelanggaran Berat & Kasus Khusus'
  | 'Ibadah & Spiritual';

export type BKUrgencyLevel = 'Rutin (Bimbingan Berkala)' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis (Perlu Tindak Lanjut)';

export type BKSessionStatus =
  | 'Dalam Pantauan'
  | 'Progres Membaik'
  | 'Selesai'
  | 'Perlu Pemanggilan Ortu'
  | 'Diagendakan Rapat Kesiswaan';

export interface BKRoutineSchedule {
  id: string;
  santriId: string;
  santriName: string;
  santriClass: string;
  santriNis?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. "12:30 - 13:00 (Istirahat Siang)"
  sessionFocus: string; // e.g. "Bimbingan Rutin Berkala / Check-in Kesejahteraan Siswa"
  counselorName: string;
  location?: string; // e.g. "Ruang Bimbingan Konseling"
  status: 'Menunggu Giliran' | 'Selesai' | 'Dijadwal Ulang' | 'Dibatalkan';
  notes?: string;
  createdAt: string;
  completedSessionId?: string;
}

export type BKEngineUrgencyLevel = 'Rendah' | 'Sedang' | 'Tinggi' | 'Perlu Perhatian Khusus';
export type BKParentProgressStatus = 'Berjalan' | 'Progres Positif' | 'Selesai' | 'Perlu Kolaborasi Ortu';

export interface BKInstrumentAnalysis {
  conditionSummary: string; // Ringkasan Kondisi Santri
  urgencyLevel: BKEngineUrgencyLevel; // Tingkat Urgensi: [Rendah / Sedang / Tinggi / Perlu Perhatian Khusus]
}

export interface BKInternalBK {
  caseStatus: string; // Status Kasus
  detailedAnalysisAndSensitiveNotes: string; // Analisis Detail & Catatan Sensitif
  schoolInterventionPlan: string; // Rencana Intervensi Sekolah
}

export interface BKParentView {
  progressStatus: BKParentProgressStatus; // Status Progres: [Berjalan / Progres Positif / Selesai / Perlu Kolaborasi Ortu]
  developmentSummary: string; // Ringkasan Perkembangan (Santun, Positif, Edukatif, Bebas Aib/Sensitif)
  homeAssistanceTips: string[]; // Saran Pendampingan di Rumah (Poin Aksi Nyata & Ramah)
}

export interface BKAIAnalysis {
  // Output Wajib AI Engine BK & Kesiswaan Al Fajar
  instrumentAnalysis?: BKInstrumentAnalysis;
  internalBK?: BKInternalBK;
  parentView?: BKParentView;
  counselorEvaluationQuestions?: string[]; // 1-2 pertanyaan klarifikasi / verifikasi lapangan Guru BK
  formattedReport?: string; // Teks lengkap sesuai standar format output wajib

  // Compatibility fields
  summaryText: string;
  psychologicalFactors: string;
  evaluationReportSnippet: string; // Formal paragraph ready for semester evaluation
  followUpRecommendations: string[];
  generatedAt: string;
}

export interface BKCounselingNote {
  id: string;
  santriId: string;
  santriName: string;
  santriClass: string;
  santriNis?: string;
  sessionDate: string; // YYYY-MM-DD
  counselorName: string; // e.g. "Ust. Guru BK & Kesiswaan"
  counselingType: BKProblemType;
  urgencyLevel: BKUrgencyLevel;
  problemDescription: string; // Pokok masalah / keluhan / pelanggaran terkait
  counselingNotes: string; // Proses jalannya sesi konseling & arahan BK
  studentCommitment: string; // Pengakuan, komitmen, & respon santri
  actionPlan: string; // Rencana tindak lanjut / kesepakatan pembinaan
  followUpDate?: string; // Target tanggal evaluasi berikutnya
  status: BKSessionStatus;
  semester: 'Ganjil' | 'Genap';
  academicYear: string; // e.g. "2026/2027"
  counselingLevel?: 'SMP' | 'SMA'; // Tingkat format pertanyaan yang digunakan
  questionnaireAnswers?: Record<string, string>; // Jawaban per ID pertanyaan kuisioner
  isPrivate: boolean; // Selalu true (Khusus Kesiswaan & Guru BK)
  aiAnalysis?: BKAIAnalysis;
  createdAt: string;
  updatedAt?: string;
}
