import { Santri, AuditLog } from '../types';

export function createSantriAuditDiffLogs(
  oldSantri: Santri | undefined,
  newSantri: Santri,
  performedBy: string = 'Admin Kesiswaan / User',
  customActionType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'PROMOTE' | 'IMPORT' | 'RESTORE' | 'BATCH_UPDATE'
): AuditLog[] {
  const timestamp = new Date().toISOString();
  const logs: AuditLog[] = [];

  // If oldSantri is undefined, it's a new Santri creation
  if (!oldSantri) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'CREATE',
      fieldName: 'Data Santri Baru',
      oldValue: '-',
      newValue: `Kelas ${newSantri.class} (NIS: ${newSantri.nis || '-'})`,
      performedBy,
      details: `Penambahan santri baru bernama "${newSantri.name}" ke Kelas ${newSantri.class}`
    });
    return logs;
  }

  // Check Class diff
  if (oldSantri.class !== newSantri.class) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'Kelas',
      oldValue: `Kelas ${oldSantri.class}`,
      newValue: `Kelas ${newSantri.class}`,
      performedBy,
      details: `Perubahan kelas santri dari Kelas ${oldSantri.class} ke Kelas ${newSantri.class}`
    });
  }

  // Check Organization Role diff
  const oldRole = oldSantri.organizationRole || '-';
  const newRole = newSantri.organizationRole || '-';
  if (oldRole !== newRole) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'Jabatan Organisasi / OSIS',
      oldValue: oldRole,
      newValue: newRole,
      performedBy,
      details: `Perubahan jabatan organisasi dari "${oldRole}" menjadi "${newRole}"`
    });
  }

  // Check Name diff
  if (oldSantri.name !== newSantri.name) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'Nama Santri',
      oldValue: oldSantri.name,
      newValue: newSantri.name,
      performedBy,
      details: `Perubahan nama santri dari "${oldSantri.name}" menjadi "${newSantri.name}"`
    });
  }

  // Check NIS diff
  const oldNis = oldSantri.nis || '-';
  const newNis = newSantri.nis || '-';
  if (oldNis !== newNis) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'NIS',
      oldValue: oldNis,
      newValue: newNis,
      performedBy,
      details: `Perubahan nomor NIS dari "${oldNis}" menjadi "${newNis}"`
    });
  }

  // Check NISN diff
  const oldNisn = oldSantri.nisn || '-';
  const newNisn = newSantri.nisn || '-';
  if (oldNisn !== newNisn) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'NISN',
      oldValue: oldNisn,
      newValue: newNisn,
      performedBy,
      details: `Perubahan nomor NISN dari "${oldNisn}" menjadi "${newNisn}"`
    });
  }

  // Check Manual Status diff
  const oldStatus = oldSantri.manualStatus || 'Otomatis Poin';
  const newStatus = newSantri.manualStatus || 'Otomatis Poin';
  if (oldStatus !== newStatus) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'Status Disiplin Manual',
      oldValue: oldStatus,
      newValue: newStatus,
      performedBy,
      details: `Perubahan penyesuaian status disiplin manual`
    });
  }

  // If general update with no specific single field caught
  if (logs.length === 0) {
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      santriId: newSantri.id,
      santriName: newSantri.name,
      actionType: customActionType || 'UPDATE',
      fieldName: 'Profil Santri',
      oldValue: 'Profil Lama',
      newValue: 'Profil Terkini',
      performedBy,
      details: `Pembaruan data profil santri`
    });
  }

  return logs;
}
