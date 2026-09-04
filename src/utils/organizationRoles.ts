export interface RoleCategoryGroup {
  category: string;
  roles: { title: string; short: string; isLeader?: boolean }[];
}

export const PRESET_ORGANIZATION_ROLES: RoleCategoryGroup[] = [
  {
    category: 'Kepengurusan Inti OSIS',
    roles: [
      { title: 'Ketua OSIS', short: 'Ketua OSIS', isLeader: true },
      { title: 'Wakil Ketua OSIS', short: 'Wakil OSIS', isLeader: true },
      { title: 'Sekretaris OSIS', short: 'Sekretaris OSIS' },
      { title: 'Bendahara OSIS', short: 'Bendahara OSIS' }
    ]
  },
  {
    category: 'Qism Ibadah (Keagamaan & Masjid)',
    roles: [
      { title: 'Ketua Qism Ibadah', short: 'Ketua Q. Ibadah', isLeader: true },
      { title: 'Anggota Qism Ibadah', short: 'Anggota Q. Ibadah' }
    ]
  },
  {
    category: 'Qism Amni (Keamanan & Ketertiban)',
    roles: [
      { title: 'Ketua Qism Amni (Keamanan)', short: 'Ketua Q. Amni', isLeader: true },
      { title: 'Anggota Qism Amni (Keamanan)', short: 'Anggota Q. Amni' }
    ]
  },
  {
    category: 'Qism Lughoh (Bahasa Arab & Inggris)',
    roles: [
      { title: 'Ketua Qism Lughoh (Bahasa)', short: 'Ketua Q. Lughoh', isLeader: true },
      { title: 'Anggota Qism Lughoh (Bahasa)', short: 'Anggota Q. Lughoh' }
    ]
  },
  {
    category: 'Qism Nadzofah (Kebersihan & Lingkungan)',
    roles: [
      { title: 'Ketua Qism Nadzofah (Kebersihan)', short: 'Ketua Q. Nadzofah', isLeader: true },
      { title: 'Anggota Qism Nadzofah (Kebersihan)', short: 'Anggota Q. Nadzofah' }
    ]
  },
  {
    category: 'Qism Lainnya (Pendidikan, Olahraga, Konsumsi)',
    roles: [
      { title: "Ketua Qism Ta'lim (Pendidikan)", short: "Ketua Q. Ta'lim", isLeader: true },
      { title: "Anggota Qism Ta'lim (Pendidikan)", short: "Anggota Q. Ta'lim" },
      { title: 'Ketua Qism Riyadhoh (Olahraga & Seni)', short: 'Ketua Q. Riyadhoh', isLeader: true },
      { title: 'Anggota Qism Riyadhoh (Olahraga)', short: 'Anggota Q. Riyadhoh' },
      { title: "Ketua Qism Mat'am (Dapur & Konsumsi)", short: "Ketua Q. Mat'am", isLeader: true },
      { title: "Anggota Qism Mat'am (Dapur)", short: "Anggota Q. Mat'am" },
      { title: 'Anggota OSIS', short: 'Anggota OSIS' }
    ]
  },
  {
    category: 'Kepengurusan Kelas',
    roles: [
      { title: 'Ketua Kelas', short: 'Ketua Kelas', isLeader: true },
      { title: 'Wakil Ketua Kelas', short: 'Wakil Ketua Kelas' },
      { title: 'Sekretaris Kelas', short: 'Sekretaris Kelas' },
      { title: 'Bendahara Kelas', short: 'Bendahara Kelas' }
    ]
  }
];

export const ALL_PRESET_ROLE_TITLES: string[] = PRESET_ORGANIZATION_ROLES.flatMap(group =>
  group.roles.map(r => r.title)
);

export interface RoleBadgeInfo {
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
  iconType: 'crown' | 'shield' | 'ibadah' | 'lughoh' | 'nadzofah' | 'class' | 'award';
  isLeader: boolean;
  descriptionForParent: string;
}

export function getRoleBadgeInfo(role?: string | any): RoleBadgeInfo | null {
  if (!role) return null;
  const roleStr = typeof role === 'object' && role !== null 
    ? (role.title || role.short || role.name || '') 
    : String(role);
  if (!roleStr || !roleStr.trim() || roleStr.trim().toLowerCase() === 'santri' || roleStr.trim() === '-') {
    return null;
  }

  const cleanRole = roleStr.trim();
  const lower = cleanRole.toLowerCase();

  // Ketua OSIS / Wakil Ketua OSIS
  if (lower.includes('ketua osis') || lower.includes('wakil ketua osis') || lower.includes("presiden osis") || lower.includes("rais 'aam")) {
    return {
      label: cleanRole,
      shortLabel: lower.includes('wakil') ? 'Wakil OSIS' : 'Ketua OSIS',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm',
      borderClass: 'border-amber-300',
      textClass: 'text-amber-800',
      bgClass: 'bg-amber-50',
      iconType: 'crown',
      isLeader: true,
      descriptionForParent: 'Mengemban amanah memimpin Organisasi Santri Intra Sekolah (OSIS) untuk ketertiban & keteladanan seluruh santri.'
    };
  }

  // Qism Ibadah
  if (lower.includes('ibadah')) {
    const isLeader = lower.includes('ketua') || lower.includes('koordinator');
    return {
      label: cleanRole,
      shortLabel: isLeader ? 'Ketua Q. Ibadah' : 'Qism Ibadah',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm',
      borderClass: 'border-emerald-300',
      textClass: 'text-emerald-800',
      bgClass: 'bg-emerald-50',
      iconType: 'ibadah',
      isLeader,
      descriptionForParent: 'Bertanggung jawab dalam pembiasaan sholat berjamaah tepat waktu, adzan, wirid, qiyamul lail, dan keagamaan masjid.'
    };
  }

  // Qism Amni (Keamanan)
  if (lower.includes('amni') || lower.includes('keamanan') || lower.includes('disiplin')) {
    const isLeader = lower.includes('ketua') || lower.includes('koordinator');
    return {
      label: cleanRole,
      shortLabel: isLeader ? 'Ketua Q. Amni' : 'Qism Amni',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm',
      borderClass: 'border-rose-300',
      textClass: 'text-rose-800',
      bgClass: 'bg-rose-50',
      iconType: 'shield',
      isLeader,
      descriptionForParent: 'Mengawasi ketertiban, keamanan santri/siswa, kepatuhan jadwal sekolah, dan penegakan tata tertib disiplin Al Fajar Islamic School.'
    };
  }

  // Qism Lughoh (Bahasa)
  if (lower.includes('lughoh') || lower.includes('bahasa')) {
    const isLeader = lower.includes('ketua') || lower.includes('koordinator');
    return {
      label: cleanRole,
      shortLabel: isLeader ? 'Ketua Q. Lughoh' : 'Qism Lughoh',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 shadow-sm',
      borderClass: 'border-purple-300',
      textClass: 'text-purple-800',
      bgClass: 'bg-purple-50',
      iconType: 'lughoh',
      isLeader,
      descriptionForParent: 'Menggerakkan disiplin berbahasa resmi (Arab & Inggris), pemberian mufrodat harian, dan muhadhoroh santri/siswa.'
    };
  }

  // Qism Nadzofah (Kebersihan)
  if (lower.includes('nadzofah') || lower.includes('kebersihan') || lower.includes('lingkungan')) {
    const isLeader = lower.includes('ketua') || lower.includes('koordinator');
    return {
      label: cleanRole,
      shortLabel: isLeader ? 'Ketua Q. Nadzofah' : 'Qism Nadzofah',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 shadow-sm',
      borderClass: 'border-teal-300',
      textClass: 'text-teal-800',
      bgClass: 'bg-teal-50',
      iconType: 'nadzofah',
      isLeader,
      descriptionForParent: 'Memimpin kebersihan kelas, lingkungan sekolah Al Fajar Islamic School, dan pelaksanaan piket kebersihan santri/siswa.'
    };
  }

  // Ketua Kelas / Pengurus Kelas
  if (lower.includes('kelas') || lower.includes('fashl') || lower.includes('raisul fashl')) {
    const isLeader = lower.includes('ketua');
    return {
      label: cleanRole,
      shortLabel: isLeader ? 'Ketua Kelas' : cleanRole,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 shadow-sm',
      borderClass: 'border-sky-300',
      textClass: 'text-sky-800',
      bgClass: 'bg-sky-50',
      iconType: 'class',
      isLeader,
      descriptionForParent: 'Memimpin kelas dalam ketertiban KBM, koordinasi jadwal piket kelas, dan penghubung resmi dengan Wali Kelas.'
    };
  }

  // OSIS Inti Lainnya (Sekretaris / Bendahara)
  if (lower.includes('sekretaris') || lower.includes('bendahara')) {
    return {
      label: cleanRole,
      shortLabel: cleanRole,
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-sm',
      borderClass: 'border-indigo-300',
      textClass: 'text-indigo-800',
      bgClass: 'bg-indigo-50',
      iconType: 'award',
      isLeader: false,
      descriptionForParent: 'Mengemban amanah administrasi, pencatatan, dan keuangan dalam organisasi kepengurusan santri.'
    };
  }

  // Default / Qism Lainnya
  const isLeader = lower.includes('ketua') || lower.includes('koordinator') || lower.includes('kepala');
  return {
    label: cleanRole,
    shortLabel: cleanRole,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 shadow-sm',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-800',
    bgClass: 'bg-blue-50',
    iconType: 'award',
    isLeader,
    descriptionForParent: 'Mengemban amanah kepengurusan dan keteladanan bagi rekan-rekan santri di ma\'had.'
  };
}
