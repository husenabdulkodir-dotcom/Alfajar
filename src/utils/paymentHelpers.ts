import { EkskulRecord, EkskulPaymentClaim } from '../types';

export interface AcademicMonthDef {
  key: string; // e.g. '2026-08'
  monthNum: number; // 1-12
  year: number; // 2026 or 2027
  label: string; // 'Agustus 2026'
  shortLabel: string; // 'Agu'
  monthName: string; // 'Agustus'
  isCurrent: boolean;
  isPrevious: boolean;
  isFuture: boolean;
}

// Academic Year 2026/2027 (Agustus 2026 - Juni 2027)
export const ACADEMIC_MONTHS: AcademicMonthDef[] = [
  { key: '2026-08', monthNum: 8, year: 2026, label: 'Agustus 2026', shortLabel: 'Agu', monthName: 'Agustus', isCurrent: false, isPrevious: true, isFuture: false },
  { key: '2026-09', monthNum: 9, year: 2026, label: 'September 2026', shortLabel: 'Sep', monthName: 'September', isCurrent: true, isPrevious: false, isFuture: false },
  { key: '2026-10', monthNum: 10, year: 2026, label: 'Oktober 2026', shortLabel: 'Okt', monthName: 'Oktober', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2026-11', monthNum: 11, year: 2026, label: 'November 2026', shortLabel: 'Nov', monthName: 'November', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2026-12', monthNum: 12, year: 2026, label: 'Desember 2026', shortLabel: 'Des', monthName: 'Desember', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-01', monthNum: 1, year: 2027, label: 'Januari 2027', shortLabel: 'Jan', monthName: 'Januari', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-02', monthNum: 2, year: 2027, label: 'Februari 2027', shortLabel: 'Feb', monthName: 'Februari', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-03', monthNum: 3, year: 2027, label: 'Maret 2027', shortLabel: 'Mar', monthName: 'Maret', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-04', monthNum: 4, year: 2027, label: 'April 2027', shortLabel: 'Apr', monthName: 'April', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-05', monthNum: 5, year: 2027, label: 'Mei 2027', shortLabel: 'Mei', monthName: 'Mei', isCurrent: false, isPrevious: false, isFuture: true },
  { key: '2027-06', monthNum: 6, year: 2027, label: 'Juni 2027', shortLabel: 'Jun', monthName: 'Juni', isCurrent: false, isPrevious: false, isFuture: true }
];

export interface MonthPaymentStatus {
  key: string;
  label: string;
  shortLabel: string;
  monthName: string;
  year: number;
  status: 'LUNAS' | 'BELUM_LUNAS' | 'BELUM_JATUH_TEMPO';
  amount: number;
  paidAt?: string;
  verifiedBy?: string;
  isCurrent: boolean;
  isPrevious: boolean;
  isFuture: boolean;
}

export interface EkskulPaymentOverview {
  currentMonth: MonthPaymentStatus;
  previousMonth: MonthPaymentStatus;
  allMonths: MonthPaymentStatus[];
  totalPaidCount: number;
  totalUnpaidCount: number;
  totalUnpaidAmount: number;
  monthlyFee: number;
}

// Find payment data for a given month from monthlyPayments map
function findPaymentInRecord(monthlyPayments: Record<string, any> | undefined, monthDef: AcademicMonthDef) {
  if (!monthlyPayments) return null;

  // Direct match e.g. "2026-08"
  if (monthlyPayments[monthDef.key]) {
    return monthlyPayments[monthDef.key];
  }

  // Variations match
  const variations = [
    `${monthDef.year}-${String(monthDef.monthNum).padStart(2, '0')}`,
    `${monthDef.year}-${monthDef.monthNum}`,
    `${monthDef.monthNum}-${monthDef.year}`,
    monthDef.monthName.toLowerCase(),
    monthDef.shortLabel.toLowerCase(),
    `${monthDef.monthName.toLowerCase()} ${monthDef.year}`,
    `${monthDef.shortLabel.toLowerCase()} ${monthDef.year}`
  ];

  for (const [k, v] of Object.entries(monthlyPayments)) {
    const cleanK = k.toLowerCase().trim();
    if (variations.some(varKey => cleanK === varKey || cleanK.includes(varKey))) {
      return v;
    }
  }

  return null;
}

export function getEkskulPaymentOverview(ekskul: EkskulRecord, claims: EkskulPaymentClaim[] = []): EkskulPaymentOverview {
  const fee = ekskul.monthlyFee || 150000;
  const payments = ekskul.monthlyPayments;

  const ekskulClaims = claims.filter(c =>
    (c.santriId && c.santriId === ekskul.santriId) &&
    ((c.ekskulId && c.ekskulId === ekskul.id) ||
     (c.ekskulName && c.ekskulName.toLowerCase().trim() === ekskul.ekskulName.toLowerCase().trim()))
  );

  const allMonths: MonthPaymentStatus[] = ACADEMIC_MONTHS.map(m => {
    const rawPayment = findPaymentInRecord(payments, m);
    const verifiedClaim = ekskulClaims.find(c => c.monthKey === m.key && c.status === 'VERIFIED');

    let status: 'LUNAS' | 'BELUM_LUNAS' | 'BELUM_JATUH_TEMPO' = 'BELUM_JATUH_TEMPO';
    let amount = fee;
    let paidAt = undefined;
    let verifiedBy = undefined;

    if (verifiedClaim) {
      status = 'LUNAS';
      amount = verifiedClaim.amount || fee;
      paidAt = verifiedClaim.paymentDate;
      verifiedBy = verifiedClaim.reviewedBy || 'Admin / Kesiswaan';
    } else if (rawPayment) {
      amount = rawPayment.amount || fee;
      paidAt = rawPayment.paidAt || rawPayment.tanggalBayar || rawPayment.date;
      verifiedBy = rawPayment.verifiedBy || rawPayment.petugas;

      const rawStatus = String(rawPayment.status || '').toUpperCase();
      if (rawStatus.includes('LUNAS') || rawPayment.isPaid === true) {
        status = 'LUNAS';
      } else if (rawStatus.includes('NUNGGAK') || rawStatus.includes('BELUM') || rawStatus.includes('UNPAID')) {
        status = 'BELUM_LUNAS';
      } else {
        status = m.isFuture ? 'BELUM_JATUH_TEMPO' : 'BELUM_LUNAS';
      }
    } else {
      // If no explicit record exists in map:
      if (m.isPrevious) {
        // Bulan sebelumnya (Agustus 2026): respect ekskul.isPaid / paymentStatus
        const isOverallUnpaid = ekskul.isPaid === false || (ekskul.paymentStatus && (ekskul.paymentStatus.toLowerCase().includes('belum') || ekskul.paymentStatus.toLowerCase().includes('nunggak')));
        status = isOverallUnpaid ? 'BELUM_LUNAS' : 'LUNAS';
      } else if (m.isCurrent) {
        // Bulan ini (September 2026): use ekskul.isPaid
        status = ekskul.isPaid ? 'LUNAS' : 'BELUM_LUNAS';
      } else {
        // Future months (Oktober 2026 - Juni 2027)
        status = 'BELUM_JATUH_TEMPO';
      }
    }

    return {
      key: m.key,
      label: m.label,
      shortLabel: m.shortLabel,
      monthName: m.monthName,
      year: m.year,
      status,
      amount,
      paidAt,
      verifiedBy,
      isCurrent: m.isCurrent,
      isPrevious: m.isPrevious,
      isFuture: m.isFuture
    };
  });

  const currentMonth = allMonths.find(m => m.isCurrent) || allMonths[1];
  const previousMonth = allMonths.find(m => m.isPrevious) || allMonths[0];

  const totalPaidCount = allMonths.filter(m => m.status === 'LUNAS').length;
  const unpaidMonths = allMonths.filter(m => m.status === 'BELUM_LUNAS');
  const totalUnpaidCount = unpaidMonths.length;
  const totalUnpaidAmount = unpaidMonths.reduce((sum, m) => sum + m.amount, 0);

  return {
    currentMonth,
    previousMonth,
    allMonths,
    totalPaidCount,
    totalUnpaidCount,
    totalUnpaidAmount,
    monthlyFee: fee
  };
}
