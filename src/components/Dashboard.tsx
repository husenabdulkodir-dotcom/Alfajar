import React, { useMemo } from 'react';
import { Santri, PointRecord } from '../types';
import { calculateNetPoints, getHeavyViolations, determineSantriStatus, getStatusBadgeStyle, formatDateIndonesian } from '../utils/helpers';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, Award, TrendingUp, AlertCircle, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, UserCheck } from 'lucide-react';

interface DashboardProps {
  santriList: Santri[];
  records: PointRecord[];
  academicYear: string;
  onSelectSantri: (santri: Santri) => void;
  onOpenQuickInput: () => void;
  onNavigateToSantri: () => void;
  onNavigateToRecaps: () => void;
  onNavigateToActivity?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  santriList,
  records,
  academicYear,
  onSelectSantri,
  onOpenQuickInput,
  onNavigateToSantri,
  onNavigateToRecaps,
  onNavigateToActivity
}) => {
  // Current month calculation
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter records for active academic year
  const activeYearRecords = useMemo(() => {
    return records.filter(r => r.academicYear === academicYear);
  }, [records, academicYear]);

  // Statistics (Optimized)
  const stats = useMemo(() => {
    const activeSantri = santriList.filter(s => s.class !== 'Alumni' && s.class !== 'Lulus');
    const totalActiveSantri = activeSantri.length;
    const alumniCount = santriList.length - totalActiveSantri;

    // Pre-index records in a single pass
    let totalPlusThisMonth = 0;
    let totalMinusThisMonth = 0;

    const heavyCountBySantri = new Map<string, number>();
    const yearNetBySantri = new Map<string, number>();

    for (const r of records) {
      if (r.type === 'Pelanggaran' && (r.category === 'Berat' || r.isHeavyViolation)) {
        heavyCountBySantri.set(r.santriId, (heavyCountBySantri.get(r.santriId) || 0) + 1);
      }

      if (r.academicYear === academicYear) {
        const currentNet = yearNetBySantri.get(r.santriId) || 0;
        const pts = r.type === 'Kebaikan' ? Math.abs(r.points) : -Math.abs(r.points);
        yearNetBySantri.set(r.santriId, currentNet + pts);

        if (r.date.startsWith(currentMonth)) {
          if (r.type === 'Kebaikan') {
            totalPlusThisMonth += Math.abs(r.points);
          } else {
            totalMinusThisMonth += Math.abs(r.points);
          }
        }
      }
    }

    const santriWithNet = activeSantri.map(s => {
      const net = yearNetBySantri.get(s.id) || 0;
      const heavyCount = heavyCountBySantri.get(s.id) || 0;
      const status = determineSantriStatus(net, heavyCount, s.manualStatus);
      return { santri: s, net, heavyCount, status };
    });

    const santriRequiringAttention = santriWithNet
      .filter(item =>
        item.status === 'SP 1' ||
        item.status === 'SP 2' ||
        item.status === 'SP 3' ||
        item.status === 'Kritis' ||
        item.status === 'Peringatan' ||
        item.heavyCount > 0
      )
      .map(item => item.santri);

    const topExemplary = [...santriWithNet]
      .sort((a, b) => b.net - a.net)
      .slice(0, 4);

    return {
      totalSantri: totalActiveSantri,
      totalRegistered: santriList.length,
      alumniCount,
      totalPlusThisMonth,
      totalMinusThisMonth,
      santriRequiringAttention,
      topExemplary
    };
  }, [santriList, records, academicYear, currentMonth]);

  // Chart 1 Data: Monthly breakdown
  const monthlyChartData = useMemo(() => {
    const months = ['2026-06', '2026-07', '2026-08', '2026-09'];
    return months.map(m => {
      const mRecs = activeYearRecords.filter(r => r.date.startsWith(m));
      const plus = mRecs.filter(r => r.type === 'Kebaikan').reduce((s, r) => s + Math.abs(r.points), 0);
      const minus = mRecs.filter(r => r.type === 'Pelanggaran').reduce((s, r) => s + Math.abs(r.points), 0);

      // Label format (e.g. "Ags 2026")
      const [y, mm] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthName = monthNames[parseInt(mm, 10) - 1] || mm;

      return {
        name: `${monthName} ${y}`,
        PoinPlus: plus,
        Pelanggaran: minus
      };
    });
  }, [activeYearRecords]);

  // Chart 2 Data: Violation categories breakdown
  const categoryChartData = useMemo(() => {
    const violations = activeYearRecords.filter(r => r.type === 'Pelanggaran');
    const ringan = violations.filter(r => r.category === 'Ringan').length;
    const sedang = violations.filter(r => r.category === 'Sedang').length;
    const berat = violations.filter(r => r.category === 'Berat').length;

    return [
      { name: 'Pelanggaran Ringan', value: ringan || 1, color: '#f59e0b' },
      { name: 'Pelanggaran Sedang', value: sedang || 1, color: '#f97316' },
      { name: 'Pelanggaran Berat', value: berat || 1, color: '#ef4444' }
    ];
  }, [activeYearRecords]);

  // Recent 6 point records
  const recentRecords = useMemo(() => {
    return [...activeYearRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [activeYearRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Rule Info */}
      <div className="p-5 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-base text-slate-900">
              Sistem Akumulasi & Reset Poin Santri
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Tahun Ajaran <strong className="text-blue-700">{academicYear}</strong>. Semua santri memulai dari <span className="underline decoration-blue-500 font-semibold text-blue-700">0 Poin</span> setiap tahun ajaran baru, <strong>kecuali Poin Pelanggaran Berat</strong> yang terus terakumulasi permanen di riwayat santri.
          </p>
        </div>
        <button
          onClick={onOpenQuickInput}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 border border-blue-600 cursor-pointer"
        >
          <Award className="w-4 h-4" />
          Catat Pelanggaran / Prestasi Baru
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Santri Aktif Terdaftar</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalSantri} <span className="text-xs font-semibold text-slate-400">Santri</span>
            </p>
            <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-semibold">
              <UserCheck className="w-3 h-3" />
              Aktif TA {academicYear} {stats.alumniCount > 0 ? `• ${stats.alumniCount} Alumni` : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Poin Plus (Prestasi) Bulan Ini</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">+{stats.totalPlusThisMonth}</p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Apresiasi & Kebaikan
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Poin Pelanggaran Bulan Ini</p>
            <p className="text-2xl font-black text-rose-600 mt-1">-{stats.totalMinusThisMonth}</p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              Pelanggaran Disiplin
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Perlu Pembinaan Khusus</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.santriRequiringAttention.length} Santri</p>
            <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              SP1 / SP2 / SP3 / Berat
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Grafik Perbandingan Poin Per Bulan
              </h3>
              <p className="text-xs text-slate-500">
                Poin Kebaikan vs Pelanggaran (Tahun Ajaran {academicYear})
              </p>
            </div>
            <button
              onClick={onNavigateToRecaps}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Lihat Rekapan &rarr;
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="PoinPlus" name="Poin Kebaikan (+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pelanggaran" name="Poin Pelanggaran (-)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Distribusi Kategori Pelanggaran
            </h3>
            <p className="text-xs text-slate-500">
              Pelanggaran Ringan, Sedang, & Berat
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryChartData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-600 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">{cat.value} kasus</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Santri Teladan vs Perlu Pembinaan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Santri Teladan (Top Positif) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Santri Teladan Poin Tertinggi
            </h3>
            <button
              onClick={onNavigateToSantri}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.topExemplary.map(({ santri, net, status }) => {
              const badgeStyle = getStatusBadgeStyle(status);
              return (
                <div
                  key={santri.id}
                  onClick={() => onSelectSantri(santri)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                      {santri.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{santri.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {santri.nis ? <>NIS: {santri.nis} &bull; </> : ''}Kelas {santri.class}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600">
                      +{net} Poin
                    </span>
                    <div className="mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Santri Perlu Pembinaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Santri Perlu Pembinaan / Warning
            </h3>
            <button
              onClick={onNavigateToSantri}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold cursor-pointer"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          {stats.santriRequiringAttention.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Alhamdulillah, tidak ada santri dalam ambang peringatan khusus saat ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.santriRequiringAttention.map(santri => {
                const net = calculateNetPoints(santri.id, records, academicYear);
                const heavy = getHeavyViolations(santri.id, records);
                const status = determineSantriStatus(net, heavy.length);
                const badgeStyle = getStatusBadgeStyle(status);

                return (
                  <div
                    key={santri.id}
                    onClick={() => onSelectSantri(santri)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
                        {santri.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{santri.name}</p>
                          {heavy.length > 0 && (
                            <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-600 text-white rounded">
                              {heavy.length} Pelanggaran Berat
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          NIS: {santri.nis} &bull; Kelas {santri.class}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-600">
                        {net} Poin Net
                      </span>
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Live Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Aktivitas Catatan Poin Terbaru (Real-Time)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap catatan langsung tersinkronisasi dan transparan untuk Kesiswaan dan Wali Santri
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToActivity && (
              <button
                onClick={onNavigateToActivity}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer shadow-sm"
              >
                <span>Pelacakan Lengkap</span>
                <span>&rarr;</span>
              </button>
            )}
            <button
              onClick={onOpenQuickInput}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              + Catat Poin
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentRecords.map(record => {
            const isPlus = record.type === 'Kebaikan';
            const isHeavy = record.isHeavyViolation || record.category === 'Berat';

            return (
              <div
                key={record.id}
                className={`p-3.5 rounded-xl border ${
                  isHeavy
                    ? 'border-rose-200 bg-rose-50/70'
                    : isPlus
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50/70'
                } flex flex-col justify-between space-y-2`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">
                      {record.santriName}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isPlus
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isHeavy
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {isPlus ? `+${record.points}` : `${record.points}`} Poin
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {record.title}
                  </p>

                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {isPlus ? 'Apresiasi: ' : 'Tindakan: '}{record.punishmentOrReward}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{formatDateIndonesian(record.date)}</span>
                  <span className="truncate max-w-[130px] font-medium">{record.recordedBy}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
