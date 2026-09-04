import React, { useState, useEffect, useMemo } from 'react';
import {
  Santri,
  PointRecord,
  BKCounselingNote,
  BKRoutineSchedule
} from '../types';
import {
  loadBKSchedules,
  saveBKSchedules
} from '../utils/storage';
import {
  cloudBatchSaveBKSchedules,
  cloudDeleteBKScheduleItem
} from '../utils/firebaseSync';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  CalendarCheck,
  Zap,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  TrendingUp,
  X,
  Users
} from 'lucide-react';

interface BKScheduleManagerProps {
  santriList: Santri[];
  records: PointRecord[];
  bkNotes: BKCounselingNote[];
  academicYear: string;
  onOpenNewBKModal: (santriId?: string) => void;
  onSelectSantriDetail: (santri: Santri) => void;
}

export const BKScheduleManager: React.FC<BKScheduleManagerProps> = ({
  santriList,
  records,
  bkNotes,
  academicYear,
  onOpenNewBKModal,
  onSelectSantriDetail
}) => {
  const [schedules, setSchedules] = useState<BKRoutineSchedule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'cakupan' | 'antrean'>('cakupan');
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'UNSEEN' | 'SCHEDULED' | 'DONE'>('ALL');

  // Modal States
  const [isSingleScheduleOpen, setIsSingleScheduleOpen] = useState(false);
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Single Form States
  const [targetSantriId, setTargetSantriId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState('12:30 - 13:00 (Istirahat Siang)');
  const [scheduleFocus, setScheduleFocus] = useState('Check-in Rutin Kesejahteraan Belajar Full Day');
  const [counselorName, setCounselorName] = useState('Guru BK & Kesiswaan');
  const [scheduleLocation, setScheduleLocation] = useState('Ruang BK');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Batch Form States
  const [batchClass, setBatchClass] = useState('');
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchStudentsPerDay, setBatchStudentsPerDay] = useState(2);
  const [batchTimeSlot, setBatchTimeSlot] = useState('12:30 - 13:00 (Istirahat Siang)');
  const [batchExcludeWeekends, setBatchExcludeWeekends] = useState(true);

  // Load schedules on mount
  useEffect(() => {
    const loaded = loadBKSchedules();
    setSchedules(loaded);

    const handleSync = () => {
      setSchedules(loadBKSchedules());
    };
    window.addEventListener('sistem_poin_bk_schedules_updated', handleSync);
    return () => window.removeEventListener('sistem_poin_bk_schedules_updated', handleSync);
  }, []);

  // Save schedules helper
  const updateSchedules = (newSchedules: BKRoutineSchedule[]) => {
    setSchedules(newSchedules);
    saveBKSchedules(newSchedules);
    cloudBatchSaveBKSchedules(newSchedules);
  };

  // Distinct classes
  const classes = useMemo(() => {
    const set = new Set(santriList.map(s => s.class));
    return Array.from(set).sort();
  }, [santriList]);

  // Map of studentId -> list of BK notes in this academic year
  const notesByStudent = useMemo(() => {
    const map = new Map<string, BKCounselingNote[]>();
    bkNotes.forEach(n => {
      if (n.academicYear === academicYear) {
        const arr = map.get(n.santriId) || [];
        arr.push(n);
        map.set(n.santriId, arr);
      }
    });
    return map;
  }, [bkNotes, academicYear]);

  // Map of studentId -> upcoming schedule
  const upcomingScheduleByStudent = useMemo(() => {
    const map = new Map<string, BKRoutineSchedule>();
    schedules.forEach(s => {
      if (s.status === 'Menunggu Giliran') {
        map.set(s.santriId, s);
      }
    });
    return map;
  }, [schedules]);

  // Calculate Coverage Stats
  const coverageStats = useMemo(() => {
    const targetStudents = selectedClass === 'ALL'
      ? santriList
      : santriList.filter(s => s.class === selectedClass);

    const total = targetStudents.length;
    let completedCount = 0;
    let scheduledCount = 0;
    let unseenCount = 0;

    targetStudents.forEach(s => {
      const notes = notesByStudent.get(s.id) || [];
      const upcoming = upcomingScheduleByStudent.get(s.id);
      if (notes.length > 0) {
        completedCount++;
      } else if (upcoming) {
        scheduledCount++;
      } else {
        unseenCount++;
      }
    });

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { total, completedCount, scheduledCount, unseenCount, percent };
  }, [santriList, selectedClass, notesByStudent, upcomingScheduleByStudent]);

  // Filtered Students for Matrix
  const filteredStudents = useMemo(() => {
    return santriList.filter(s => {
      if (selectedClass !== 'ALL' && s.class !== selectedClass) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchClass = s.class.toLowerCase().includes(q);
        const matchNis = s.nis ? s.nis.toLowerCase().includes(q) : false;
        if (!matchName && !matchClass && !matchNis) return false;
      }

      const notes = notesByStudent.get(s.id) || [];
      const hasUpcoming = upcomingScheduleByStudent.has(s.id);

      if (coverageFilter === 'DONE' && notes.length === 0) return false;
      if (coverageFilter === 'SCHEDULED' && !hasUpcoming) return false;
      if (coverageFilter === 'UNSEEN' && (notes.length > 0 || hasUpcoming)) return false;

      return true;
    });
  }, [santriList, selectedClass, searchQuery, coverageFilter, notesByStudent, upcomingScheduleByStudent]);

  // Filtered Schedules for Queue
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => {
        if (selectedClass !== 'ALL' && s.santriClass !== selectedClass) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.santriName.toLowerCase().includes(q);
          const matchClass = s.santriClass.toLowerCase().includes(q);
          const matchFocus = s.sessionFocus.toLowerCase().includes(q);
          if (!matchName && !matchClass && !matchFocus) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [schedules, selectedClass, searchQuery]);

  // Handle Save Single Schedule
  const handleSaveSingleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const student = santriList.find(s => s.id === targetSantriId);
    if (!student) return;

    if (editingScheduleId) {
      const updated = schedules.map(s => {
        if (s.id === editingScheduleId) {
          return {
            ...s,
            santriId: student.id,
            santriName: student.name,
            santriClass: student.class,
            santriNis: student.nis,
            scheduledDate: scheduleDate,
            scheduledTime: scheduleTime,
            sessionFocus: scheduleFocus,
            counselorName,
            location: scheduleLocation,
            notes: scheduleNotes
          };
        }
        return s;
      });
      updateSchedules(updated);
    } else {
      const newSchedule: BKRoutineSchedule = {
        id: `bksched_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        santriId: student.id,
        santriName: student.name,
        santriClass: student.class,
        santriNis: student.nis,
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime,
        sessionFocus: scheduleFocus,
        counselorName,
        location: scheduleLocation,
        status: 'Menunggu Giliran',
        notes: scheduleNotes,
        createdAt: new Date().toISOString()
      };
      updateSchedules([...schedules, newSchedule]);
    }

    setIsSingleScheduleOpen(false);
    setEditingScheduleId(null);
  };

  // Handle Auto Distribute for Class
  const handleAutoDistribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchClass) return;

    const classStudents = santriList.filter(s => s.class === batchClass);
    // Find students who don't have a schedule or note yet
    const unscheduled = classStudents.filter(s => {
      const notes = notesByStudent.get(s.id) || [];
      const hasSched = upcomingScheduleByStudent.has(s.id);
      return notes.length === 0 && !hasSched;
    });

    if (unscheduled.length === 0) {
      alert(`Semua siswa di kelas ${batchClass} sudah memiliki jadwal atau sudah pernah check-in!`);
      setIsBatchScheduleOpen(false);
      return;
    }

    let currentDate = new Date(batchStartDate);
    let studentCounter = 0;
    const newItems: BKRoutineSchedule[] = [];

    unscheduled.forEach((s) => {
      // Advance date if weekends are excluded
      if (batchExcludeWeekends) {
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      const dateStr = currentDate.toISOString().slice(0, 10);
      newItems.push({
        id: `bksched_${Date.now()}_${Math.random().toString(36).substr(2, 7)}_${s.id}`,
        santriId: s.id,
        santriName: s.name,
        santriClass: s.class,
        santriNis: s.nis,
        scheduledDate: dateStr,
        scheduledTime: batchTimeSlot,
        sessionFocus: 'Check-in Rutin Kesejahteraan Belajar Full Day',
        counselorName: 'Guru BK & Kesiswaan',
        location: 'Ruang BK',
        status: 'Menunggu Giliran',
        notes: `Jadwal otomatis giliran rutin berkala kelas ${batchClass}`,
        createdAt: new Date().toISOString()
      });

      studentCounter++;
      if (studentCounter >= batchStudentsPerDay) {
        studentCounter = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    updateSchedules([...schedules, ...newItems]);
    setIsBatchScheduleOpen(false);
    alert(`Berhasil membuat ${newItems.length} jadwal rutin berkala untuk siswa kelas ${batchClass}!`);
  };

  // Quick action: start counseling from schedule
  const handleStartSession = (schedule: BKRoutineSchedule) => {
    onOpenNewBKModal(schedule.santriId);
    // Auto mark schedule as finished or prompt
    const updated = schedules.map(s => {
      if (s.id === schedule.id) {
        return { ...s, status: 'Selesai' as const };
      }
      return s;
    });
    updateSchedules(updated);
  };

  // Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (confirm('Hapus jadwal bimbingan ini?')) {
      const updated = schedules.filter(s => s.id !== id);
      updateSchedules(updated);
      cloudDeleteBKScheduleItem(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner: Proactive Full Day School BK Paradigm */}
      <div className="p-5 bg-gradient-to-r from-emerald-50 via-white to-purple-50 border border-emerald-200 shadow-sm rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Paradigma Bimbingan Proaktif Sekolah Full Day</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Jadwal & Cakupan Check-in Rutin Seluruh Siswa
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Di sekolah full day, siswa dipanggil bukan semata-mata karena melakukan pelanggaran. Setiap siswa memiliki jadwal check-in berkala untuk berkonsultasi mengenai ritme belajar seharian, adaptasi teman sekelas, manajemen waktu tugas sore, dan bimbingan minat bakat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setBatchClass(classes[0] || '');
                setIsBatchScheduleOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-600 active:scale-95"
              title="Buat jadwal bergilir otomatis untuk 1 kelas penuh"
            >
              <Zap className="w-4 h-4 text-emerald-100" />
              <span>Jadwalkan Otomatis 1 Kelas</span>
            </button>

            <button
              onClick={() => {
                setTargetSantriId(santriList[0]?.id || '');
                setEditingScheduleId(null);
                setIsSingleScheduleOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-purple-600 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Jadwalkan Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Coverage Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Siswa {selectedClass !== 'ALL' ? `Kelas ${selectedClass}` : 'Full Day'}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {coverageStats.total} <span className="text-xs font-normal text-slate-500">siswa</span>
          </div>
          <p className="text-[11px] text-slate-400">Basis target bimbingan berkala</p>
        </div>

        {/* Completed Check-in */}
        <div className="p-4 bg-white border border-emerald-200 shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span className="font-semibold">Sudah Check-in Semester Ini</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{coverageStats.completedCount}</span>
            <span className="text-xs text-slate-500">/ {coverageStats.total} siswa</span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {coverageStats.percent}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${coverageStats.percent}%` }}
            />
          </div>
        </div>

        {/* Scheduled / Waiting */}
        <div className="p-4 bg-white border border-blue-200 shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span className="font-semibold">Antrean Jadwal Mendatang</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {coverageStats.scheduledCount} <span className="text-xs font-normal text-slate-500">siswa terjadwal</span>
          </div>
          <p className="text-[11px] text-slate-400">Menunggu giliran waktu wawancara</p>
        </div>

        {/* Not yet scheduled */}
        <div className="p-4 bg-white border border-amber-200 shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span className="font-semibold">Belum Terjadwal</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {coverageStats.unseenCount} <span className="text-xs font-normal text-slate-500">siswa</span>
          </div>
          <p className="text-[11px] text-slate-400">Prioritas untuk dialokasikan jadwal</p>
        </div>
      </div>

      {/* Filter Toolbar & Sub Tabs */}
      <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Sub-view Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('cakupan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'cakupan'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Matriks Cakupan Siswa ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('antrean')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'antrean'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Kalender Antrean Jadwal ({filteredSchedules.length})</span>
          </button>
        </div>

        {/* Search & Class Dropdown */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari siswa / kelas / fokus..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>

          {activeSubTab === 'cakupan' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Status:</span>
              <select
                value={coverageFilter}
                onChange={e => setCoverageFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 focus:outline-none font-medium cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="UNSEEN">Belum Terjadwal ({coverageStats.unseenCount})</option>
                <option value="SCHEDULED">Terjadwal ({coverageStats.scheduledCount})</option>
                <option value="DONE">Sudah Selesai ({coverageStats.completedCount})</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: MATRIKS CAKUPAN SISWA */}
      {activeSubTab === 'cakupan' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">No</th>
                  <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                  <th className="py-3 px-4 font-semibold">Kelas</th>
                  <th className="py-3 px-4 font-semibold">Status Cakupan Semester Ini</th>
                  <th className="py-3 px-4 font-semibold">Sesi Terakhir / Jadwal</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada siswa yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const notes = notesByStudent.get(student.id) || [];
                    const upcoming = upcomingScheduleByStudent.get(student.id);
                    const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Belum Terjadwal
                      </span>
                    );

                    if (notes.length > 0) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Selesai Check-in ({notes.length}x)
                        </span>
                      );
                    } else if (upcoming) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          Terjadwal: {upcoming.scheduledDate}
                        </span>
                      );
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onSelectSantriDetail(student)}
                            className="font-bold text-slate-900 hover:text-purple-700 transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
                          >
                            <span>{student.name}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
                          </button>
                          {student.nis && (
                            <span className="text-[10px] text-slate-400">NIS: {student.nis}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {student.class}
                        </td>
                        <td className="py-3 px-4">{statusBadge}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {lastNote ? (
                            <div className="space-y-0.5">
                              <div className="text-slate-900 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{lastNote.sessionDate}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                {lastNote.counselingType}
                              </div>
                            </div>
                          ) : upcoming ? (
                            <div className="text-blue-700 text-xs font-medium">
                              {upcoming.scheduledDate} ({upcoming.scheduledTime || 'Siang'})
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Schedule button */}
                            <button
                              onClick={() => {
                                setTargetSantriId(student.id);
                                setEditingScheduleId(null);
                                setIsSingleScheduleOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                              title="Jadwalkan sesi bimbingan rutin"
                            >
                              Jadwalkan
                            </button>

                            {/* Start session right away */}
                            <button
                              onClick={() => onOpenNewBKModal(student.id)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Mulai sesi bimbingan sekarang"
                            >
                              <Sparkles className="w-3 h-3 text-purple-200" />
                              <span>Mulai Sesi</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: KALENDER ANTREAN JADWAL */}
      {activeSubTab === 'antrean' && (
        <div className="space-y-3">
          {filteredSchedules.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600">Belum ada antrean jadwal bimbingan yang terdaftar.</p>
              <button
                onClick={() => {
                  setTargetSantriId(santriList[0]?.id || '');
                  setIsSingleScheduleOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                + Buat Jadwal Bimbingan Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchedules.map(sched => {
                const isWaiting = sched.status === 'Menunggu Giliran';
                const isDone = sched.status === 'Selesai';

                return (
                  <div
                    key={sched.id}
                    className={`p-4 bg-white border rounded-2xl space-y-3 shadow-sm transition-all ${
                      isWaiting
                        ? 'border-blue-300 hover:border-blue-400 ring-1 ring-blue-50'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Kelas {sched.santriClass}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{sched.santriName}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isWaiting
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sched.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>{sched.scheduledDate}</span>
                        {sched.scheduledTime && (
                          <span className="text-slate-500">• {sched.scheduledTime}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">Fokus:</strong> {sched.sessionFocus}
                      </div>
                      {sched.location && (
                        <div className="text-[11px] text-slate-600">
                          <strong className="text-slate-800">Lokasi:</strong> {sched.location}
                        </div>
                      )}
                      {sched.notes && (
                        <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                          "{sched.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingScheduleId(sched.id);
                            setTargetSantriId(sched.santriId);
                            setScheduleDate(sched.scheduledDate);
                            setScheduleTime(sched.scheduledTime || '');
                            setScheduleFocus(sched.sessionFocus);
                            setScheduleLocation(sched.location || 'Ruang BK');
                            setScheduleNotes(sched.notes || '');
                            setIsSingleScheduleOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Jadwal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(sched.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isWaiting && (
                        <button
                          onClick={() => handleStartSession(sched)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                          <span>Mulai Konseling</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: JADWAL TUNGGAL SISWA */}
      {isSingleScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingScheduleId ? 'Edit Jadwal Bimbingan' : 'Jadwalkan Sesi Bimbingan Rutin'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSingleScheduleOpen(false);
                  setEditingScheduleId(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleSchedule} className="p-5 space-y-4 text-xs">
              {/* Select Student */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Pilih Siswa <span className="text-rose-500">*</span></label>
                <select
                  value={targetSantriId}
                  onChange={e => setTargetSantriId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  required
                >
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Kelas {s.class} {s.nis ? `(NIS: ${s.nis})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Tanggal <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Jam / Waktu Slot</label>
                  <select
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  >
                    <option value="09:45 - 10:15 (Istirahat Pertama)">09:45 - 10:15 (Istirahat Pertama)</option>
                    <option value="12:30 - 13:00 (Istirahat Siang)">12:30 - 13:00 (Istirahat Siang)</option>
                    <option value="13:00 - 13:30 (Setelah Dzuhur)">13:00 - 13:30 (Setelah Dzuhur)</option>
                    <option value="15:30 - 16:00 (Pulang Sekolah)">15:30 - 16:00 (Pulang Sekolah)</option>
                    <option value="Jam Bebas / Kesepakatan">Jam Bebas / Kesepakatan</option>
                  </select>
                </div>
              </div>

              {/* Focus Topic */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Fokus / Topik Bimbingan</label>
                <input
                  type="text"
                  value={scheduleFocus}
                  onChange={e => setScheduleFocus(e.target.value)}
                  placeholder="Contoh: Check-in Kesejahteraan Belajar Full Day & Minat Siswa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Location & Counselor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Lokasi Pertemuan</label>
                  <input
                    type="text"
                    value={scheduleLocation}
                    onChange={e => setScheduleLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Konselor / Pembimbing</label>
                  <input
                    type="text"
                    value={counselorName}
                    onChange={e => setCounselorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Catatan Pendukung (Opsional)</label>
                <textarea
                  value={scheduleNotes}
                  onChange={e => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan persiapan atau pengingat untuk wali kelas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSingleScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {editingScheduleId ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTO-SCHEDULE UNTUK 1 KELAS */}
      {isBatchScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-emerald-950 text-base">Jadwalkan Otomatis 1 Kelas Penuh</h3>
                  <p className="text-[11px] text-emerald-700">Sistem otomatis membagi siswa ke hari & slot waktu sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchScheduleOpen(false)}
                className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAutoDistribute} className="p-5 space-y-4 text-xs">
              {/* Target Class */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Pilih Kelas Sasaran <span className="text-rose-500">*</span></label>
                <select
                  value={batchClass}
                  onChange={e => setBatchClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold focus:bg-white"
                  required
                >
                  {classes.map(c => {
                    const count = santriList.filter(s => s.class === c).length;
                    return (
                      <option key={c} value={c}>
                        Kelas {c} ({count} siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Start Date & Students per day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Mulai Tanggal <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={e => setBatchStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold block">Kuota Siswa per Hari</label>
                  <select
                    value={batchStudentsPerDay}
                    onChange={e => setBatchStudentsPerDay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value={1}>1 Siswa per Hari (30 menit)</option>
                    <option value={2}>2 Siswa per Hari (60 menit)</option>
                    <option value={3}>3 Siswa per Hari</option>
                    <option value={4}>4 Siswa per Hari</option>
                  </select>
                </div>
              </div>

              {/* Time Slot Preset */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Slot Waktu Pertemuan</label>
                <select
                  value={batchTimeSlot}
                  onChange={e => setBatchTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="12:30 - 13:00 (Istirahat Siang)">12:30 - 13:00 (Istirahat Siang)</option>
                  <option value="09:45 - 10:15 (Istirahat Pertama)">09:45 - 10:15 (Istirahat Pertama)</option>
                  <option value="15:30 - 16:00 (Sore Pulang Sekolah)">15:30 - 16:00 (Sore Pulang Sekolah)</option>
                </select>
              </div>

              {/* Skip weekends checkbox */}
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={batchExcludeWeekends}
                  onChange={e => setBatchExcludeWeekends(e.target.checked)}
                  className="rounded bg-slate-100 border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Lewati Hari Libur (Sabtu & Minggu)</span>
              </label>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                ℹ️ Sistem hanya akan menjadwalkan siswa yang <strong>belum pernah check-in semester ini</strong> dan <strong>belum memiliki jadwal mendatang</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBatchScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Jadwal Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
