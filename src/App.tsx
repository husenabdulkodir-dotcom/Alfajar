/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Santri, PointRecord, RuleItem, AnnualResetLog, AuditLog, BKCounselingNote, EkskulPaymentClaim } from './types';
import { generateVariedAccessPin, isSequentialOrWeakPin } from './utils/helpers';
import { createSantriAuditDiffLogs } from './utils/auditLogger';
import {
  loadSantriData,
  saveSantriData,
  loadPointRecords,
  savePointRecords,
  loadRulesData,
  saveRulesData,
  loadCurrentAcademicYear,
  saveCurrentAcademicYear,
  loadResetLogs,
  saveResetLogs,
  loadBKNotes,
  saveBKNotes,
  saveBKSchedules,
  saveBKQuestionnaires
} from './utils/storage';
import {
  seedFirestoreIfEmpty,
  subscribeToCloudStore,
  cloudSaveSantriItem,
  cloudDeleteMultipleSantri,
  cloudBatchSaveSantri,
  cloudSaveAuditLogs,
  cloudSaveAuditLog,
  cloudSaveRecordItem,
  cloudBatchSaveRecords,
  cloudDeleteRecordItem,
  cloudDeleteMultipleRecords,
  cloudSaveRuleItem,
  cloudBatchSaveRules,
  cloudDeleteMultipleRules,
  cloudSaveAcademicYear,
  cloudSaveResetLog,
  cloudSaveBKNoteItem,
  cloudDeleteBKNoteItem,
  cloudBatchSaveBKNotes,
  cloudOverwriteFullBackup,
  cloudSaveEkskulPaymentClaim,
  cloudUpdateEkskulPaymentClaim,
  cloudDeleteEkskulPaymentClaim,
  cloudSaveEkskulRecord,
  cloudSyncStudentEkskulPaymentToExternalDb
} from './utils/firebaseSync';

import { Navbar } from './components/Navbar';
import { INITIAL_SANTRI } from './data/initialData';
import { Dashboard } from './components/Dashboard';
import { SantriList } from './components/SantriList';
import { SantriDetailModal } from './components/SantriDetailModal';
import { QuickPointInputModal } from './components/QuickPointInputModal';
import { RuleCatalog } from './components/RuleCatalog';
import { RecapReports } from './components/RecapReports';
import { RecentActivityTracker } from './components/RecentActivityTracker';
import { ParentPortal } from './components/ParentPortal';
import { WaliKelasPortal } from './components/WaliKelasPortal';
import { YearResetModal } from './components/YearResetModal';
import { AiCounselorModal } from './components/AiCounselorModal';
import { SharePortalLinkModal } from './components/SharePortalLinkModal';
import { BKCounselingHub } from './components/BKCounselingHub';
import { BKSessionModal } from './components/BKSessionModal';
import { isSantriEkskulMatch } from './utils/ekskulMatcher';
import { MasterLogin } from './components/MasterLogin';
import { ServerQuotaModal } from './components/ServerQuotaModal';
import { EkskulClaimsAdminModal } from './components/EkskulClaimsAdminModal';
import { SantriAuditHistoryModal } from './components/SantriAuditHistoryModal';

// Helper to check if current URL points specifically to dedicated Wali Kelas portal mode
const checkIsWaliKelasOnlyMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    search.includes('portal=walikelas') ||
    search.includes('portal=wali-kelas') ||
    search.includes('portal=wali_kelas') ||
    search.includes('mode=walikelas') ||
    search.includes('role=walikelas') ||
    hash.includes('portal-walikelas') ||
    hash.includes('portal=walikelas')
  );
};

// Helper to check if current URL points specifically to dedicated parent portal mode
const checkIsParentOnlyMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  // If URL is explicitly for Wali Kelas, it is NOT Parent portal
  if (checkIsWaliKelasOnlyMode()) return false;

  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    search.includes('portal=wali') ||
    search.includes('portal=orang-tua') ||
    search.includes('portal=walisantri') ||
    search.includes('mode=wali') ||
    search.includes('role=wali') ||
    hash.includes('portal-wali') ||
    hash.includes('portal=wali')
  );
};

export default function App() {
  // Application Data States
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [resetLogs, setResetLogs] = useState<AnnualResetLog[]>([]);
  const [bkNotes, setBkNotes] = useState<BKCounselingNote[]>([]);
  const [ekskulRecords, setEkskulRecords] = useState<any[]>([]);
  const [ekskulClaims, setEkskulClaims] = useState<EkskulPaymentClaim[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Track initialization to avoid saving empty state over existing storage
  const isInitialized = useRef(false);

  // Dedicated URL Isolation Modes
  const [isWaliKelasOnly, setIsWaliKelasOnly] = useState<boolean>(() => checkIsWaliKelasOnlyMode());
  const [isParentOnly, setIsParentOnly] = useState<boolean>(() => checkIsParentOnlyMode());

  // Navigation & View Mode (Guarded by isParentOnly / isWaliKelasOnly)
  const [currentMode, setCurrentMode] = useState<'kesiswaan' | 'parent' | 'walikelas'>(() => {
    if (checkIsWaliKelasOnlyMode()) return 'walikelas';
    if (checkIsParentOnlyMode()) return 'parent';
    return 'kesiswaan';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('master_authenticated') === 'true';
  });

  // Effect to sync auth state
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('master_authenticated', 'true');
    } else {
      sessionStorage.removeItem('master_authenticated');
    }
  }, [isAuthenticated]);

  // Modal Controls
  const [selectedSantriDetail, setSelectedSantriDetail] = useState<Santri | null>(null);
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [isYearResetOpen, setIsYearResetOpen] = useState(false);
  const [isAiCounselorOpen, setIsAiCounselorOpen] = useState(false);
  const [isSharePortalModalOpen, setIsSharePortalModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isEkskulClaimsModalOpen, setIsEkskulClaimsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditPreSelectedSantriId, setAuditPreSelectedSantriId] = useState<string | undefined>(undefined);
  const [aiSantri, setAiSantri] = useState<Santri | null>(null);

  // BK Counseling Modal States
  const [isBKModalOpen, setIsBKModalOpen] = useState(false);
  const [bkTargetSantriId, setBkTargetSantriId] = useState<string | undefined>(undefined);
  const [editingBKNote, setEditingBKNote] = useState<BKCounselingNote | null>(null);

  // URL Listeners for dynamic navigation / query parameter detection
  useEffect(() => {
    const handleUrlChange = () => {
      const waliKelasMode = checkIsWaliKelasOnlyMode();
      const parentMode = checkIsParentOnlyMode();
      setIsWaliKelasOnly(waliKelasMode);
      setIsParentOnly(parentMode);

      if (waliKelasMode) {
        setCurrentMode('walikelas');
      } else if (parentMode) {
        setCurrentMode('parent');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Initial Data Loading & Realtime Firebase Cloud Sync
  useEffect(() => {
    // 1. Initial LocalStorage load for immediate rendering
    setSantriList(loadSantriData());
    setRecords(loadPointRecords());
    setRules(loadRulesData());
    setAcademicYear(loadCurrentAcademicYear());
    setResetLogs(loadResetLogs());
    setBkNotes(loadBKNotes());
    isInitialized.current = true;

    // 2. Seed Cloud database if empty
    seedFirestoreIfEmpty();

    // 3. Real-time Subscription to Firebase Cloud Firestore
    const unsubscribe = subscribeToCloudStore({
      onSantriChange: list => {
        if (list.length > 0) {
          // 1. Filter out all Class 9 graduates (s-9-*) that were mistakenly promoted into Class 10
          // and also the 3 AI-generated mock santri (s-10-8, s-10-16, s-10-17)
          const s9Santri = list.filter(s => s.id.startsWith('s-9-'));
          const mockS10Ids = new Set(['s-10-8', 's-10-16', 's-10-17']);
          const mockS10Found = list.filter(s => mockS10Ids.has(s.id));

          let updatedList = list.filter(s => !s.id.startsWith('s-9-') && !mockS10Ids.has(s.id));

          // 2. Ensure all s-10-* santri (the 14 real santri previously in Class 10) are promoted to Class 11
          let modifiedCount = 0;
          updatedList = updatedList.map(s => {
            if (s.id.startsWith('s-10-') && s.class !== '11') {
              modifiedCount++;
              return { ...s, class: '11' };
            }
            return s;
          });

          // 3. Ensure all 14 Class 11 santri (s-10-*) exist in updatedList
          const existingS10Ids = new Set(updatedList.filter(s => s.id.startsWith('s-10-')).map(s => s.id));
          const missingS10 = INITIAL_SANTRI.filter(s => s.id.startsWith('s-10-') && !existingS10Ids.has(s.id));
          if (missingS10.length > 0) {
            updatedList = [...updatedList, ...missingS10];
          }

          if (s9Santri.length > 0) {
            cloudDeleteMultipleSantri(s9Santri.map(s => s.id));
            const cleanupAudits: AuditLog[] = s9Santri.map(s => ({
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              timestamp: new Date().toISOString(),
              santriId: s.id,
              santriName: s.name,
              actionType: 'DELETE',
              fieldName: 'Hapus Santri Lulusan Kelas 9 di Kelas 10',
              oldValue: `Kelas ${s.class}`,
              newValue: 'Dihapus',
              performedBy: 'Sistem Admin Kesiswaan',
              details: `Penghapusan santri "${s.name}" (Lulusan Kelas 9) karena Kelas 10 murni berisi 17 santri hasil impor Excel`
            }));
            cloudSaveAuditLogs(cleanupAudits);
          }

          if (mockS10Found.length > 0) {
            cloudDeleteMultipleSantri(mockS10Found.map(s => s.id));
            const cleanupMockAudits: AuditLog[] = mockS10Found.map(s => ({
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              timestamp: new Date().toISOString(),
              santriId: s.id,
              santriName: s.name,
              actionType: 'DELETE',
              fieldName: 'Hapus Santri Buatan AI (Akmal, Fathir, Zaki)',
              oldValue: `Kelas ${s.class}`,
              newValue: 'Dihapus',
              performedBy: 'Sistem Admin Kesiswaan',
              details: `Penghapusan santri buatan AI "${s.name}" agar data kembali bersih sesuai impor asli`
            }));
            cloudSaveAuditLogs(cleanupMockAudits);
          }

          if (modifiedCount > 0 || missingS10.length > 0) {
            const s10ToSave = updatedList.filter(s => s.id.startsWith('s-10-'));
            cloudBatchSaveSantri(s10ToSave);
          }

          setSantriList(updatedList);
          saveSantriData(updatedList);
        }
      },
      onRecordsChange: list => {
        setRecords(list);
        savePointRecords(list);
      },
      onRulesChange: list => {
        if (list.length > 0) {
          setRules(list);
          saveRulesData(list);
        }
      },
      onAcademicYearChange: year => {
        if (year) {
          setAcademicYear(year);
          saveCurrentAcademicYear(year);
        }
      },
      onResetLogsChange: logs => {
        setResetLogs(logs);
        saveResetLogs(logs);
      },
      onBKNotesChange: notes => {
        setBkNotes(notes);
        saveBKNotes(notes);
      },
      onEkskulRecordsChange: ekskulData => {
        setEkskulRecords(ekskulData);
      },
      onBKSchedulesChange: schedules => {
        saveBKSchedules(schedules);
      },
      onBKQuestionnairesChange: bank => {
        saveBKQuestionnaires(bank);
      },
      onEkskulClaimsChange: claims => {
        setEkskulClaims(claims);
      },
      onAuditLogsChange: logs => {
        setAuditLogs(logs);
      }
    });

    return () => unsubscribe();
  }, []);

  // Reactive Auto-Save Effects for LocalStorage Backup
  useEffect(() => {
    if (isInitialized.current) {
      saveSantriData(santriList);
    }
  }, [santriList]);

  useEffect(() => {
    if (isInitialized.current) {
      savePointRecords(records);
    }
  }, [records]);

  useEffect(() => {
    if (isInitialized.current) {
      saveRulesData(rules);
    }
  }, [rules]);

  useEffect(() => {
    if (isInitialized.current) {
      saveCurrentAcademicYear(academicYear);
    }
  }, [academicYear]);

  useEffect(() => {
    if (isInitialized.current) {
      saveResetLogs(resetLogs);
    }
  }, [resetLogs]);

  useEffect(() => {
    if (isInitialized.current) {
      saveBKNotes(bkNotes);
    }
  }, [bkNotes]);

  // Handlers for Data Mutations
  const handleSaveRecords = (newRecords: PointRecord[]) => {
    setRecords(prev => {
      const updated = [...newRecords, ...prev];
      savePointRecords(updated);
      return updated;
    });

    cloudBatchSaveRecords(newRecords);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      savePointRecords(updated);
      return updated;
    });

    cloudDeleteRecordItem(recordId);
  };

  const handleDeleteMultipleRecords = (recordIds: string[]) => {
    setRecords(prev => {
      const updated = prev.filter(r => !recordIds.includes(r.id));
      savePointRecords(updated);
      return updated;
    });

    cloudDeleteMultipleRecords(recordIds);
  };

  const handleAddSantri = (newSantri: Santri) => {
    setSantriList(prev => {
      const updated = [newSantri, ...prev];
      saveSantriData(updated);
      return updated;
    });

    cloudSaveSantriItem(newSantri);
    const auditLogsGenerated = createSantriAuditDiffLogs(undefined, newSantri, 'Admin Kesiswaan / User', 'CREATE');
    cloudSaveAuditLogs(auditLogsGenerated);
  };

  const handleUpdateSantri = (updatedSantri: Santri) => {
    const oldSantri = santriList.find(s => s.id === updatedSantri.id);
    setSantriList(prev => {
      const updated = prev.map(s => (s.id === updatedSantri.id ? updatedSantri : s));
      saveSantriData(updated);
      return updated;
    });

    cloudSaveSantriItem(updatedSantri);
    const auditLogsGenerated = createSantriAuditDiffLogs(oldSantri, updatedSantri, 'Admin Kesiswaan / User', 'UPDATE');
    cloudSaveAuditLogs(auditLogsGenerated);
  };

  const handleBatchUpdateSantri = (updatedList: Santri[]) => {
    const updateMap = new Map<string, Santri>();
    updatedList.forEach(s => updateMap.set(s.id, s));

    const generatedAudits: AuditLog[] = [];
    santriList.forEach(oldS => {
      const newS = updateMap.get(oldS.id);
      if (newS) {
        generatedAudits.push(...createSantriAuditDiffLogs(oldS, newS, 'Admin Kesiswaan (Update Massal)', 'BATCH_UPDATE'));
      }
    });

    setSantriList(prev => {
      const merged = prev.map(s => updateMap.get(s.id) || s);
      saveSantriData(merged);
      return merged;
    });

    cloudBatchSaveSantri(updatedList);
    if (generatedAudits.length > 0) {
      cloudSaveAuditLogs(generatedAudits);
    }
  };

  const handleImportSantri = (importedList: Santri[]) => {
    const generatedAudits: AuditLog[] = [];
    importedList.forEach(s => {
      generatedAudits.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        santriId: s.id,
        santriName: s.name,
        actionType: 'IMPORT',
        fieldName: 'Impor Massal Excel',
        oldValue: '-',
        newValue: `Kelas ${s.class} (NIS: ${s.nis || '-'})`,
        performedBy: 'Admin Kesiswaan (Impor Excel)',
        details: `Impor data santri dari file Excel`
      });
    });

    setSantriList(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const filteredNew = importedList.filter(s => !existingIds.has(s.id));
      const updated = [...prev, ...filteredNew];
      saveSantriData(updated);
      return updated;
    });

    cloudBatchSaveSantri(importedList);
    if (generatedAudits.length > 0) {
      cloudSaveAuditLogs(generatedAudits);
    }
  };

  const handleDeleteMultipleSantri = (santriIds: string[]) => {
    const generatedAudits: AuditLog[] = [];
    const idSet = new Set(santriIds);
    santriList.filter(s => idSet.has(s.id)).forEach(s => {
      generatedAudits.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        santriId: s.id,
        santriName: s.name,
        actionType: 'DELETE',
        fieldName: 'Hapus Santri',
        oldValue: `Kelas ${s.class}`,
        newValue: 'Dihapus',
        performedBy: 'Admin Kesiswaan',
        details: `Penghapusan data santri "${s.name}"`
      });
    });

    setSantriList(prev => {
      const updated = prev.filter(s => !santriIds.includes(s.id));
      saveSantriData(updated);
      return updated;
    });

    cloudDeleteMultipleSantri(santriIds);
    if (generatedAudits.length > 0) {
      cloudSaveAuditLogs(generatedAudits);
    }
  };

  const handlePromoteSantriClasses = (updates: Santri[] | { id: string; newClass?: string; class?: string }[]) => {
    const updateMap = new Map<string, string>();
    updates.forEach((u: any) => {
      const targetClass = u.newClass || u.class;
      if (u.id && targetClass) {
        updateMap.set(u.id, String(targetClass).trim());
      }
    });

    if (updateMap.size === 0) return;

    const generatedAudits: AuditLog[] = [];

    setSantriList(prev => {
      const updatedSantriList = prev.map(s => {
        if (updateMap.has(s.id)) {
          const newClass = updateMap.get(s.id)!;
          if (s.class !== newClass) {
            generatedAudits.push({
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              timestamp: new Date().toISOString(),
              santriId: s.id,
              santriName: s.name,
              actionType: 'PROMOTE',
              fieldName: 'Kelas',
              oldValue: `Kelas ${s.class}`,
              newValue: `Kelas ${newClass}`,
              performedBy: 'Kenaikan Kelas (Sistem)',
              details: `Kenaikan kelas massal dari Kelas ${s.class} ke Kelas ${newClass}`
            });
          }
          return { ...s, class: newClass };
        }
        return s;
      });

      saveSantriData(updatedSantriList);
      const changedSantri = updatedSantriList.filter(s => updateMap.has(s.id));
      cloudBatchSaveSantri(changedSantri);
      if (generatedAudits.length > 0) {
        cloudSaveAuditLogs(generatedAudits);
      }
      return updatedSantriList;
    });
  };

  const handleSaveRules = (newRules: RuleItem[]) => {
    setRules(newRules);
    saveRulesData(newRules);
    cloudBatchSaveRules(newRules);
  };

  const handleConfirmRecordByParent = (recordId: string, parentNote: string) => {
    const updatedRecords = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          parentConfirmed: true,
          parentConfirmedAt: new Date().toISOString(),
          parentNote: parentNote || undefined
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    savePointRecords(updatedRecords);

    const updatedRecord = updatedRecords.find(r => r.id === recordId);
    if (updatedRecord) {
      cloudSaveRecordItem(updatedRecord);
    }
  };

  // BK Counseling Mutations
  const handleSaveBKNote = (note: BKCounselingNote) => {
    setBkNotes(prev => {
      const existingIdx = prev.findIndex(n => n.id === note.id);
      let updated: BKCounselingNote[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = note;
      } else {
        updated = [note, ...prev];
      }
      saveBKNotes(updated);
      return updated;
    });

    cloudSaveBKNoteItem(note);
  };

  const handleDeleteBKNote = (noteId: string) => {
    setBkNotes(prev => {
      const updated = prev.filter(n => n.id !== noteId);
      saveBKNotes(updated);
      return updated;
    });

    cloudDeleteBKNoteItem(noteId);
  };

  const handleSaveEkskulClaim = (claim: EkskulPaymentClaim) => {
    setEkskulClaims(prev => [claim, ...prev.filter(c => c.id !== claim.id)]);
    cloudSaveEkskulPaymentClaim(claim);
  };

  const handleUpdateEkskulClaimStatus = (
    claimId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
    reviewedBy?: string
  ) => {
    const reviewedAt = new Date().toISOString();
    const targetClaim = ekskulClaims.find(c => c.id === claimId);

    setEkskulClaims(prev =>
      prev.map(c =>
        c.id === claimId
          ? { ...c, status, rejectionReason, reviewedBy, reviewedAt }
          : c
      )
    );

    cloudUpdateEkskulPaymentClaim(claimId, {
      status,
      rejectionReason,
      reviewedBy,
      reviewedAt
    });

    if (status === 'VERIFIED' && targetClaim) {
      let foundMatch = false;

      setEkskulRecords(prev => {
        const nextRecords = prev.map(rec => {
          // Strict Santri Matching (prevent partial substring match like s-7-1 matching s-7-10)
          const isSameSantri = (
            (targetClaim.ekskulId && rec.id === targetClaim.ekskulId) ||
            (rec.santriId && rec.santriId === targetClaim.santriId) ||
            (rec.id && targetClaim.santriId && rec.id.startsWith(`ext-${targetClaim.santriId}-`)) ||
            (targetClaim.santriNis && rec.nis && rec.nis === targetClaim.santriNis) ||
            isSantriEkskulMatch(
              { id: rec.santriId, santriId: rec.santriId, santriName: rec.santriName, nis: rec.nis },
              { id: targetClaim.santriId, santriId: targetClaim.santriId, santriName: targetClaim.santriName, nis: targetClaim.santriNis }
            )
          );

          if (!isSameSantri) {
            return rec;
          }

          // Strict Ekskul Matching
          const cleanRecEkskul = (rec.ekskulName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanClaimEkskul = (targetClaim.ekskulName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const isSameEkskul = targetClaim.ekskulId
            ? rec.id === targetClaim.ekskulId
            : (!cleanClaimEkskul || cleanRecEkskul === cleanClaimEkskul || cleanRecEkskul.includes(cleanClaimEkskul) || cleanClaimEkskul.includes(cleanRecEkskul));

          if (isSameSantri && isSameEkskul) {
            foundMatch = true;
            const existingPayments = rec.monthlyPayments || {};
            const paymentData = {
              isPaid: true,
              status: 'LUNAS',
              amount: targetClaim.amount,
              paidAt: targetClaim.paymentDate,
              verifiedBy: reviewedBy || 'Admin / Kesiswaan'
            };
            const updatedPayments = {
              ...existingPayments,
              [targetClaim.monthKey]: paymentData
            };
            const isCurrentMonth = targetClaim.monthKey === '2026-09';
            const updatedRec = {
              ...rec,
              monthlyPayments: updatedPayments,
              ...(isCurrentMonth ? { isPaid: true, paymentStatus: 'Lunas (September 2026)' } : {})
            };

            cloudSaveEkskulRecord(updatedRec);

            return updatedRec;
          }
          return rec;
        });

        if (!foundMatch) {
          const paymentData = {
            isPaid: true,
            status: 'LUNAS',
            amount: targetClaim.amount,
            paidAt: targetClaim.paymentDate,
            verifiedBy: reviewedBy || 'Admin / Kesiswaan'
          };
          const newRecord = {
            id: `ekskul-${targetClaim.santriId}-${Date.now()}`,
            santriId: targetClaim.santriId,
            nis: targetClaim.santriNis,
            santriName: targetClaim.santriName,
            ekskulName: targetClaim.ekskulName || 'Ekstrakurikuler',
            paymentStatus: 'Lunas',
            isPaid: targetClaim.monthKey === '2026-09',
            monthlyFee: targetClaim.amount || 150000,
            monthlyPayments: {
              [targetClaim.monthKey]: paymentData
            },
            semester: 'Ganjil',
            academicYear: '2026/2027'
          };
          cloudSaveEkskulRecord(newRecord);
          return [...nextRecords, newRecord];
        }

        return nextRecords;
      });
    }
  };

  const handleDeleteEkskulClaim = (claimId: string) => {
    setEkskulClaims(prev => prev.filter(c => c.id !== claimId));
    cloudDeleteEkskulPaymentClaim(claimId);
  };

  const handleOpenNewBKModal = (santriId?: string) => {
    setBkTargetSantriId(santriId);
    setEditingBKNote(null);
    setIsBKModalOpen(true);
  };

  const handleEditBKNote = (note: BKCounselingNote) => {
    setEditingBKNote(note);
    setBkTargetSantriId(note.santriId);
    setIsBKModalOpen(true);
  };

  const handleExecuteYearReset = (
    newYear: string,
    resetScope: 'ALL_RESET' | 'KEEP_HEAVY_RECORDS',
    _archivedData: any
  ) => {
    const preservedCount =
      resetScope === 'KEEP_HEAVY_RECORDS'
        ? records.filter(r => r.isHeavyViolation || r.category === 'Berat').length
        : 0;

    const newLog: AnnualResetLog = {
      id: `reset_${Date.now()}`,
      resetDate: new Date().toISOString(),
      fromAcademicYear: academicYear,
      toAcademicYear: newYear,
      totalSantriReset: santriList.length,
      preservedHeavyViolationsCount: preservedCount,
      performedBy: 'Bagian Kesiswaan'
    };

    let remainingRecords: PointRecord[] = [];
    if (resetScope === 'KEEP_HEAVY_RECORDS') {
      remainingRecords = records.filter(r => r.isHeavyViolation || r.category === 'Berat');
    }

    setAcademicYear(newYear);
    saveCurrentAcademicYear(newYear);
    cloudSaveAcademicYear(newYear);

    setRecords(remainingRecords);
    savePointRecords(remainingRecords);
    cloudBatchSaveRecords(remainingRecords);

    setResetLogs(prev => {
      const updated = [newLog, ...prev];
      saveResetLogs(updated);
      return updated;
    });
    cloudSaveResetLog(newLog);

    setIsYearResetOpen(false);
  };

  const handleRestoreBackup = (data: {
    santriList: Santri[];
    records: PointRecord[];
    rules: RuleItem[];
    academicYear: string;
    resetLogs: AnnualResetLog[];
    bkNotes?: BKCounselingNote[];
  }) => {
    setSantriList(data.santriList);
    setRecords(data.records);
    setRules(data.rules);
    setAcademicYear(data.academicYear);
    setResetLogs(data.resetLogs);
    if (data.bkNotes) {
      setBkNotes(data.bkNotes);
      saveBKNotes(data.bkNotes);
    }

    saveSantriData(data.santriList);
    savePointRecords(data.records);
    saveRulesData(data.rules);
    saveCurrentAcademicYear(data.academicYear);
    saveResetLogs(data.resetLogs);

    cloudOverwriteFullBackup(data);
  };

  const handleOpenAiCounselor = (santri: Santri) => {
    setAiSantri(santri);
    setIsAiCounselorOpen(true);
  };

  if (currentMode === 'kesiswaan' && !isAuthenticated) {
    return <MasterLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentMode={isParentOnly ? 'parent' : isWaliKelasOnly ? 'walikelas' : currentMode}
        setCurrentMode={mode => {
          if (!isParentOnly && !isWaliKelasOnly) setCurrentMode(mode);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        academicYear={academicYear}
        onOpenQuickInput={() => setIsQuickInputOpen(true)}
        onOpenYearReset={() => setIsYearResetOpen(true)}
        isParentOnly={isParentOnly}
        isWaliKelasOnly={isWaliKelasOnly}
        onOpenSharePortalModal={() => setIsSharePortalModalOpen(true)}
        onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
        onOpenEkskulClaimsModal={() => setIsEkskulClaimsModalOpen(true)}
        onOpenAuditModal={() => {
          setAuditPreSelectedSantriId(undefined);
          setIsAuditModalOpen(true);
        }}
        pendingClaimsCount={ekskulClaims.filter(c => c.status === 'PENDING').length}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isParentOnly || currentMode === 'parent' ? (
          <ParentPortal
            santriList={santriList}
            records={records}
            academicYear={academicYear}
            onConfirmRecordByParent={handleConfirmRecordByParent}
            bkNotes={bkNotes}
            ekskulRecords={ekskulRecords}
            ekskulClaims={ekskulClaims}
            onSubmitEkskulClaim={handleSaveEkskulClaim}
            isParentOnly={isParentOnly}
          />
        ) : isWaliKelasOnly || currentMode === 'walikelas' ? (
          <WaliKelasPortal
            santriList={santriList}
            records={records}
            academicYear={academicYear}
            isStandalone={isWaliKelasOnly}
            onBackToKesiswaan={() => setCurrentMode('kesiswaan')}
            onUpdateSantri={handleUpdateSantri}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                santriList={santriList}
                records={records}
                academicYear={academicYear}
                onSelectSantri={s => setSelectedSantriDetail(s)}
                onOpenQuickInput={() => setIsQuickInputOpen(true)}
                onNavigateToSantri={() => setActiveTab('santri')}
                onNavigateToRecaps={() => setActiveTab('recaps')}
                onNavigateToActivity={() => setActiveTab('activity')}
              />
            )}

            {activeTab === 'santri' && (
              <SantriList
                santriList={santriList}
                records={records}
                academicYear={academicYear}
                onSelectSantri={s => setSelectedSantriDetail(s)}
                onOpenQuickInputForSantri={_sId => {
                  setIsQuickInputOpen(true);
                }}
                onAddSantri={handleAddSantri}
                onImportSantri={handleImportSantri}
                onPromoteSantriClasses={handlePromoteSantriClasses}
                onUpdateSantri={handleUpdateSantri}
                onDeleteMultipleSantri={handleDeleteMultipleSantri}
                onBatchUpdateSantri={handleBatchUpdateSantri}
                onOpenAuditModal={santriId => {
                  setAuditPreSelectedSantriId(santriId);
                  setIsAuditModalOpen(true);
                }}
              />
            )}

            {activeTab === 'activity' && (
              <RecentActivityTracker
                records={records}
                santriList={santriList}
                academicYear={academicYear}
                onSelectSantri={s => setSelectedSantriDetail(s)}
                onOpenQuickInput={() => setIsQuickInputOpen(true)}
                onDeleteRecord={handleDeleteRecord}
                onDeleteMultipleRecords={handleDeleteMultipleRecords}
              />
            )}

            {activeTab === 'rules' && (
              <RuleCatalog
                rules={rules}
                onSaveRules={handleSaveRules}
              />
            )}

            {activeTab === 'recaps' && (
              <RecapReports
                santriList={santriList}
                records={records}
                rules={rules}
                academicYear={academicYear}
                resetLogs={resetLogs}
                bkNotes={bkNotes}
                onRestoreBackup={handleRestoreBackup}
                onOpenSharePortalModal={() => setIsSharePortalModalOpen(true)}
              />
            )}

            {activeTab === 'bk' && (
              <BKCounselingHub
                santriList={santriList}
                records={records}
                bkNotes={bkNotes}
                academicYear={academicYear}
                onOpenNewBKModal={handleOpenNewBKModal}
                onEditBKNote={handleEditBKNote}
                onDeleteBKNote={handleDeleteBKNote}
                onSelectSantriDetail={s => setSelectedSantriDetail(s)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals - Only mounted if NOT in Parent-Only Mode */}
      {!isParentOnly && (
        <>
          <SantriDetailModal
            santri={selectedSantriDetail}
            onClose={() => setSelectedSantriDetail(null)}
            records={records}
            bkNotes={bkNotes}
            ekskulRecords={ekskulRecords}
            academicYear={academicYear}
            onOpenQuickInputForSantri={() => {
              setIsQuickInputOpen(true);
            }}
            onOpenAiCounselor={handleOpenAiCounselor}
            onOpenBKModalForSantri={santriId => handleOpenNewBKModal(santriId)}
            onEditBKNote={handleEditBKNote}
            onDeleteBKNote={handleDeleteBKNote}
            onDeleteRecord={handleDeleteRecord}
            onOpenAuditModal={santriId => {
              setAuditPreSelectedSantriId(santriId);
              setIsAuditModalOpen(true);
            }}
          />

          <QuickPointInputModal
            isOpen={isQuickInputOpen}
            onClose={() => setIsQuickInputOpen(false)}
            santriList={santriList}
            rules={rules}
            academicYear={academicYear}
            onSaveRecords={handleSaveRecords}
          />

          <YearResetModal
            isOpen={isYearResetOpen}
            onClose={() => setIsYearResetOpen(false)}
            currentAcademicYear={academicYear}
            santriList={santriList}
            records={records}
            onExecuteReset={handleExecuteYearReset}
          />

          <AiCounselorModal
            isOpen={isAiCounselorOpen}
            onClose={() => setIsAiCounselorOpen(false)}
            santri={aiSantri}
            records={records}
            academicYear={academicYear}
          />

          <SharePortalLinkModal
            isOpen={isSharePortalModalOpen}
            onClose={() => setIsSharePortalModalOpen(false)}
            santriList={santriList}
            academicYear={academicYear}
            onBatchUpdateSantri={handleBatchUpdateSantri}
          />

          <BKSessionModal
            isOpen={isBKModalOpen}
            onClose={() => {
              setIsBKModalOpen(false);
              setEditingBKNote(null);
              setBkTargetSantriId(undefined);
            }}
            santriList={santriList}
            records={records}
            academicYear={academicYear}
            initialSantriId={bkTargetSantriId}
            editNote={editingBKNote}
            onSaveNote={handleSaveBKNote}
          />

          <ServerQuotaModal
            isOpen={isQuotaModalOpen}
            onClose={() => setIsQuotaModalOpen(false)}
            santriList={santriList}
            records={records}
            rules={rules}
            bkNotes={bkNotes}
            resetLogs={resetLogs}
            academicYear={academicYear}
          />

          <EkskulClaimsAdminModal
            isOpen={isEkskulClaimsModalOpen}
            onClose={() => setIsEkskulClaimsModalOpen(false)}
            claims={ekskulClaims}
            onUpdateClaimStatus={handleUpdateEkskulClaimStatus}
            onDeleteClaim={handleDeleteEkskulClaim}
          />

          <SantriAuditHistoryModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            auditLogs={auditLogs}
            santriList={santriList}
            preSelectedSantriId={auditPreSelectedSantriId}
          />
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-4 px-6 text-center print:hidden">
        <p>
          AL FAJAR <span className="text-blue-600 font-bold">ISLAMIC SCHOOL</span> &bull;{' '}
          {isParentOnly ? 'Portal Resmi Khusus Orang Tua / Wali Murid' : 'Sistem Monitoring Kesiswaan, BK & Real-Time Portal Wali'}
        </p>
      </footer>
    </div>
  );
}
