import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Server,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Layers,
  Cpu,
  X,
  Radio,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Santri, PointRecord, RuleItem, BKCounselingNote, AnnualResetLog } from '../types';
import {
  getCompleteQuotaReport,
  resetQuotaTelemetryCounters,
  CompleteQuotaReport,
  getTimeUntilQuotaReset
} from '../utils/quotaTracker';
import firebaseConfig from '../../firebase-applet-config.json';

interface ServerQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  records: PointRecord[];
  rules: RuleItem[];
  bkNotes: BKCounselingNote[];
  resetLogs: AnnualResetLog[];
  academicYear: string;
}

interface ServerTelemetryData {
  status: string;
  uptimeSeconds: number;
  totalRequests: number;
  serverEgressFormatted: string;
  memory: {
    rssMb: string;
    heapUsedMb: string;
    heapTotalMb: string;
  };
  nodeVersion: string;
  port: number;
}

export const ServerQuotaModal: React.FC<ServerQuotaModalProps> = ({
  isOpen,
  onClose,
  santriList,
  records,
  rules,
  bkNotes,
  resetLogs,
  academicYear
}) => {
  const [report, setReport] = useState<CompleteQuotaReport>(() =>
    getCompleteQuotaReport(
      { santriList, records, rules, bkNotes, resetLogs, academicYear },
      firebaseConfig
    )
  );

  const [serverStats, setServerStats] = useState<ServerTelemetryData | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(getTimeUntilQuotaReset().text);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Refresh quota calculations
  const refreshReport = () => {
    const updated = getCompleteQuotaReport(
      { santriList, records, rules, bkNotes, resetLogs, academicYear },
      firebaseConfig
    );
    setReport(updated);
    setResetCountdown(getTimeUntilQuotaReset().text);
  };

  // Fetch Node.js server system stats
  const fetchServerStats = async () => {
    setLoadingServer(true);
    try {
      const res = await fetch('/api/server-quota-stats');
      if (res.ok) {
        const json = await res.json();
        if (json.server) {
          setServerStats(json.server);
        }
      }
    } catch (err) {
      console.warn('Could not reach /api/server-quota-stats:', err);
    } finally {
      setLoadingServer(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshReport();
      fetchServerStats();
    }
  }, [isOpen, santriList.length, records.length, rules.length, bkNotes.length]);

  // Listen to live telemetry updates
  useEffect(() => {
    let isMounted = true;
    const handleUpdate = () => {
      if (isMounted) {
        refreshReport();
      }
    };
    window.addEventListener('quota_metrics_updated', handleUpdate);
    const interval = setInterval(() => {
      if (isMounted) {
        setResetCountdown(getTimeUntilQuotaReset().text);
      }
    }, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener('quota_metrics_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [santriList, records, rules, bkNotes, resetLogs, academicYear]);

  if (!isOpen) return null;

  const handleResetCounters = () => {
    resetQuotaTelemetryCounters();
    refreshReport();
    setShowResetConfirm(false);
  };

  const getStatusBadge = (status: 'safe' | 'warning' | 'critical') => {
    switch (status) {
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sangat Aman
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Waspada ({'>'}65%)
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Kritis ({'>'}85%)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#161619] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#111113] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Status & Sisa Kuota Server (Firebase Firestore)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Khusus Kesiswaan
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Pemantauan real-time sisa kuota Spark Free Tier: Reads, Writes, Deletes, Storage, dan Network Egress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshReport}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Perbarui data kuota"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-gray-300 text-sm">
          {/* Top Status & Plan Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 via-[#1a1b26]/50 to-emerald-950/30 border border-blue-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Paket: Google Firebase Spark (Free Tier)</span>
                  <span className="text-xs text-emerald-400 font-medium">● Seluruh Kuota Tersedia Cukup</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Database ID:{' '}
                  <code className="text-blue-300 bg-blue-950/50 px-1.5 py-0.5 rounded text-[11px] font-mono">
                    {report.databaseId}
                  </code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-400">Reset Harian:</span>
                <span className="text-white font-medium">{resetCountdown}</span>
              </div>

              <a
                href={`https://console.firebase.google.com/project/${report.projectId}/firestore/databases/${report.databaseId}/usage`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all hover:text-white"
              >
                <span>Console Resmi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* The 5 Key Quota Metrics Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                5 Indikator Kuota Utama (Sisa vs Batas Kuota)
              </h3>
              <span className="text-xs text-gray-400">
                Kebutuhan operasional kesiswaan & konseling Al Fajar Islamic School
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Metric 1: Document Reads */}
              <div className="bg-[#1c1c21] border border-white/10 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                      Document Reads
                    </span>
                    {getStatusBadge(report.reads.status)}
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {report.reads.formattedRemaining}
                      <span className="text-xs font-normal text-emerald-400 ml-1.5">
                        ({report.reads.percentRemaining}% sisa)
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sisa kuota dari batas <strong className="text-gray-300">{report.reads.formattedLimit}</strong> per hari
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Terpakai hari ini:</span>
                      <span className="text-white font-semibold">
                        {report.reads.formattedUsed} reads ({report.reads.percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, report.reads.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Reset: 00:00 UTC (07:00 WIB)</span>
                  <span className="text-emerald-400 font-medium">Batas: 50.000 / hari</span>
                </div>
              </div>

              {/* Metric 2: Document Writes */}
              <div className="bg-[#1c1c21] border border-white/10 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                      Document Writes
                    </span>
                    {getStatusBadge(report.writes.status)}
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {report.writes.formattedRemaining}
                      <span className="text-xs font-normal text-blue-400 ml-1.5">
                        ({report.writes.percentRemaining}% sisa)
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sisa kuota dari batas <strong className="text-gray-300">{report.writes.formattedLimit}</strong> per hari
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Terpakai hari ini:</span>
                      <span className="text-white font-semibold">
                        {report.writes.formattedUsed} writes ({report.writes.percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, report.writes.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Pencatatan Poin & BK</span>
                  <span className="text-blue-400 font-medium">Batas: 20.000 / hari</span>
                </div>
              </div>

              {/* Metric 3: Document Deletes */}
              <div className="bg-[#1c1c21] border border-white/10 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Trash2 className="w-4 h-4 text-amber-400" />
                      Document Deletes
                    </span>
                    {getStatusBadge(report.deletes.status)}
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {report.deletes.formattedRemaining}
                      <span className="text-xs font-normal text-amber-400 ml-1.5">
                        ({report.deletes.percentRemaining}% sisa)
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sisa kuota dari batas <strong className="text-gray-300">{report.deletes.formattedLimit}</strong> per hari
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Terpakai hari ini:</span>
                      <span className="text-white font-semibold">
                        {report.deletes.formattedUsed} deletes ({report.deletes.percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, report.deletes.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Penghapusan Riwayat</span>
                  <span className="text-amber-400 font-medium">Batas: 20.000 / hari</span>
                </div>
              </div>

              {/* Metric 4: Stored Data (Storage Capacity) */}
              <div className="bg-[#1c1c21] border border-white/10 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between md:col-span-1 lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      Stored Data (Storage Kapasitas Database)
                    </span>
                    {getStatusBadge(report.storage.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="text-2xl font-black text-white tracking-tight">
                        {report.storage.formattedRemaining}
                        <span className="text-xs font-normal text-purple-400 ml-1.5">
                          ({report.storage.percentRemaining}% sisa)
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Kapasitas tersisa dari batas gratis <strong className="text-gray-300">1 GiB (1.024 MiB)</strong>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                          <span>Terpakai di Cloud:</span>
                          <span className="text-white font-semibold">
                            {report.storage.formattedUsed} ({report.storage.percentUsed}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${Math.max(1, report.storage.percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by Collection */}
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-xs">
                      <div className="font-semibold text-gray-300 text-[11px] mb-2 flex items-center justify-between">
                        <span>Rincian Koleksi Data ({report.storage.breakdown.totalDocs} Dokumen):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-400">
                        <div>Santri: <strong className="text-gray-200">{report.storage.breakdown.santri}</strong></div>
                        <div>Riwayat Poin: <strong className="text-gray-200">{report.storage.breakdown.records}</strong></div>
                        <div>Aturan & Tata Tertib: <strong className="text-gray-200">{report.storage.breakdown.rules}</strong></div>
                        <div>Catatan BK: <strong className="text-gray-200">{report.storage.breakdown.bkNotes}</strong></div>
                        <div>Log Reset & Pengaturan: <strong className="text-gray-200">{report.storage.breakdown.logs}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Dihitung secara presisi per dokumen (overhead + payload)</span>
                  <span className="text-purple-400 font-medium">Batas: 1 GiB Total</span>
                </div>
              </div>

              {/* Metric 5: Network Egress */}
              <div className="bg-[#1c1c21] border border-white/10 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      Network Egress (Transfer Data)
                    </span>
                    {getStatusBadge(report.egress.status)}
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {report.egress.formattedRemaining}
                      <span className="text-xs font-normal text-cyan-400 ml-1.5">
                        ({report.egress.percentRemaining}% sisa)
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sisa bandwidth dari batas <strong className="text-gray-300">10 GiB/bulan</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Terpakai bulan ini:</span>
                      <span className="text-white font-semibold">
                        {report.egress.formattedUsed} ({report.egress.percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${Math.max(1, report.egress.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Reset setiap tanggal 1</span>
                  <span className="text-cyan-400 font-medium">Batas: 10 GiB / bulan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Server & Node.js System Resource Stats */}
          <div className="bg-[#19191d] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Telemetri Node.js Backend Server (Port 3000)
              </h3>
              <span className="text-xs text-gray-400">
                Cloud Run Container Service
              </span>
            </div>

            {serverStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="text-gray-400 text-[11px]">Server Uptime</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {Math.floor(serverStats.uptimeSeconds / 60)} Menit {serverStats.uptimeSeconds % 60} Detik
                  </div>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="text-gray-400 text-[11px]">Total Request API</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {serverStats.totalRequests} Permintaan
                  </div>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="text-gray-400 text-[11px]">Memory Heap Node</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {serverStats.memory.heapUsedMb} MB / {serverStats.memory.heapTotalMb} MB
                  </div>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <div className="text-gray-400 text-[11px]">Express Outbound Egress</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {serverStats.serverEgressFormatted}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-2 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Memuat status backend server...</span>
              </div>
            )}
          </div>

          {/* Real-time Activity Log */}
          <div className="bg-[#19191d] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Riwayat Transaksi Kuota Terakhir (Real-Time Stream)
              </h3>
              <span className="text-xs text-gray-400">
                {report.activityLogs.length} Aktivitas terekam
              </span>
            </div>

            {report.activityLogs.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {report.activityLogs.map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-black/30 hover:bg-black/50 rounded-lg text-xs border border-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-400 font-mono text-[11px]">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'READ'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.type === 'WRITE'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-gray-200 font-medium">{log.detail}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                      <span className="font-mono text-white">+{log.count} doc</span>
                      <span className="text-gray-400 font-mono">({log.collection})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">
                Belum ada aktivitas transaksi database sejak sesi ini dimulai.
              </div>
            )}
          </div>

          {/* Efficiency Tips & Calibration Actions */}
          <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 text-xs text-gray-400">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-200">Arsitektur Hemat Kuota Aktif:</strong> Aplikasi dilengkapi sistem
                caching lokal cerdas. Membuka tab atau menyortir data santri tidak membebani kuota pembacaan Firestore
                karena data telah di-cache secara real-time.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs transition-colors"
                  title="Reset counter lokal hari ini untuk keperluan pengujian / kalibrasi"
                >
                  Reset Penghitung Lokal
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 p-1 rounded-lg">
                  <span className="text-[11px] text-amber-300 px-1">Yakin reset?</span>
                  <button
                    onClick={handleResetCounters}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold"
                  >
                    Ya
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-[11px]"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#111113] border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hak Akses: Kesiswaan & Administrator Lembaga</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-md"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
