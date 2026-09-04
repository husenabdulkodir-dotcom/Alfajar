import { PointRecord, SantriStatus, CategoryType, EntryType } from '../types';

export function getCategoryFromPoints(points: number, type: EntryType): CategoryType {
  const absP = Math.abs(points);
  if (type === 'Kebaikan') {
    if (absP <= 10) return 'Ringan';
    if (absP <= 20) return 'Sedang';
    return 'Berat';
  } else {
    // Pelanggaran (Minus):
    // Ringan: poin -5 sampai -15 (absP <= 15)
    // Sedang: poin -20 sampai -25 (absP <= 25)
    // Berat: -30 sampai seterusnya (absP >= 30)
    if (absP <= 15) return 'Ringan';
    if (absP <= 25) return 'Sedang';
    return 'Berat';
  }
}

export function getSantriRecords(santriId: string, records: PointRecord[], academicYear?: string): PointRecord[] {
  return records.filter(r => {
    if (r.santriId !== santriId) return false;
    if (academicYear && r.academicYear !== academicYear) return false;
    return true;
  });
}

export function calculatePositivePoints(santriId: string, records: PointRecord[], academicYear?: string): number {
  const santriRecs = getSantriRecords(santriId, records, academicYear);
  return santriRecs
    .filter(r => r.type === 'Kebaikan')
    .reduce((sum, r) => sum + Math.abs(r.points), 0);
}

export function calculateNegativePoints(santriId: string, records: PointRecord[], academicYear?: string): number {
  const santriRecs = getSantriRecords(santriId, records, academicYear);
  return santriRecs
    .filter(r => r.type === 'Pelanggaran')
    .reduce((sum, r) => sum + Math.abs(r.points), 0);
}

export function calculateNetPoints(santriId: string, records: PointRecord[], academicYear?: string): number {
  const pos = calculatePositivePoints(santriId, records, academicYear);
  const neg = calculateNegativePoints(santriId, records, academicYear);
  return pos - neg;
}

// Heavy violations are tracked PERMANENTLY across all academic years!
export function getHeavyViolations(santriId: string, records: PointRecord[]): PointRecord[] {
  return records.filter(
    r => r.santriId === santriId && r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation)
  );
}

export function calculateHeavyViolationPoints(santriId: string, records: PointRecord[]): number {
  return getHeavyViolations(santriId, records).reduce((sum, r) => sum + Math.abs(r.points), 0);
}

export function determineSantriStatus(
  netPointsThisYear: number,
  heavyViolationCountAllTime: number,
  manualStatus?: SantriStatus
): SantriStatus {
  // If Kesiswaan set a manual SP override status, respect it!
  if (manualStatus) {
    return manualStatus;
  }
  if (heavyViolationCountAllTime >= 4 || netPointsThisYear <= -100) {
    return 'Kritis';
  }
  if (heavyViolationCountAllTime === 3 || netPointsThisYear <= -90) {
    return 'SP 3';
  }
  if (heavyViolationCountAllTime === 2 || netPointsThisYear <= -75) {
    return 'SP 2';
  }
  if (heavyViolationCountAllTime === 1 || netPointsThisYear <= -50) {
    return 'SP 1';
  }
  if (netPointsThisYear <= -25) {
    return 'Peringatan';
  }
  if (netPointsThisYear >= 50) {
    return 'Teladan';
  }
  if (netPointsThisYear >= 15) {
    return 'Baik';
  }
  return 'Aman';
}

export function getStatusBadgeStyle(status: SantriStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Teladan':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700 font-bold', border: 'border-emerald-200' };
    case 'Baik':
      return { bg: 'bg-teal-50', text: 'text-teal-700 font-bold', border: 'border-teal-200' };
    case 'Aman':
      return { bg: 'bg-blue-50', text: 'text-blue-700 font-bold', border: 'border-blue-200' };
    case 'Peringatan':
      return { bg: 'bg-amber-50', text: 'text-amber-700 font-bold', border: 'border-amber-200' };
    case 'SP 1':
      return { bg: 'bg-orange-50', text: 'text-orange-700 font-bold', border: 'border-orange-200' };
    case 'SP 2':
      return { bg: 'bg-rose-50', text: 'text-rose-700 font-bold', border: 'border-rose-200' };
    case 'SP 3':
    case 'Kritis':
      return { bg: 'bg-red-100', text: 'text-red-700 font-bold', border: 'border-red-300' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700 font-medium', border: 'border-slate-200' };
  }
}

export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
}

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          const val = (row as Record<string, unknown>)[header];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a varied, unpredictable 6-digit access code (PIN) for a santri.
 * Excludes obvious sequential patterns (e.g. 123456, 654321), repeating patterns (111111),
 * and matches against existing PINs to guarantee uniqueness.
 */
export function generateVariedAccessPin(existingPins?: Set<string>): string {
  let pin = '';
  let attempts = 0;
  const isWeak = (p: string) => {
    // Check repeating identical digits (e.g. 111111, 777777)
    if (/^(\d)\1+$/.test(p)) return true;
    // Check simple ascending/descending sequences
    const sequences = ['012345', '123456', '234567', '345678', '456789', '987654', '876543', '765432', '654321', '543210'];
    if (sequences.includes(p)) return true;
    // Check old class-prefixed sequential patterns like 7001, 8001
    if (/^(7|8|9|10)0\d\d$/.test(p)) return true;
    return false;
  };

  do {
    // Generate unpredictable 6-digit number between 100,000 and 999,999
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while ((isWeak(pin) || (existingPins && existingPins.has(pin))) && attempts < 100);

  return pin;
}

/**
 * Detects if a PIN is using old sequential patterns (e.g. 7001, 7002, 8001, 9001, 1001),
 * generic defaults (e.g. '1234'), or weak patterns that are easily guessed by other parents.
 */
export function isSequentialOrWeakPin(pin?: string): boolean {
  if (!pin || pin.trim() === '' || pin.trim() === '1234' || pin.trim() === '0000') {
    return true;
  }
  const clean = pin.trim();
  // 4-digit class sequential pattern: 7001-7099, 8001-8099, 9001-9099, 1001-1099
  if (/^(70\d\d|80\d\d|90\d\d|10\d\d)$/.test(clean)) {
    return true;
  }
  // Less than 5 digits is considered easily guessable
  if (clean.length < 5) {
    return true;
  }
  // Repeated digits
  if (/^(\d)\1+$/.test(clean)) {
    return true;
  }
  return false;
}
