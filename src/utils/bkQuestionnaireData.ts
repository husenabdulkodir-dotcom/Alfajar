export interface BKQuestionItem {
  id: string;
  category: string; // e.g., 'Rutinitas & Kesejahteraan Belajar', 'Adaptasi & Sosial', 'Minat, Karir & Masa Depan'
  question: string;
  purpose: string; // Insight / tujuan pertanyaan bagi Guru BK
  guidanceTip?: string; // Tips penggalian bagi konselor
  placeholderResponse?: string;
}

export interface BKQuestionnaireLevel {
  level: 'SMP' | 'SMA';
  title: string;
  subtitle: string;
  focusArea: string;
  badgeColor: string;
  questions: BKQuestionItem[];
}

export type QuestionnaireBank = Record<'SMP' | 'SMA', BKQuestionnaireLevel>;

export const DEFAULT_BK_QUESTIONNAIRES: Record<'SMP' | 'SMA', BKQuestionnaireLevel> = {
  SMP: {
    level: 'SMP',
    title: 'Tingkat SMP (Fase Awal Remaja - Sekolah Full Day)',
    subtitle: 'Kesejahteraan Belajar, Adaptasi Rutinitas Seharian & Emosi',
    focusArea: 'Fokus pada adaptasi jam belajar sekolah full day (pagi sampai sore), manajemen stamina fisik, dinamika pertemanan kelas, pola istirahat/makan siang, tugas di rumah, dan komunikasi keluarga.',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    questions: [
      {
        id: 'smp_q1',
        category: 'Latar Belakang & Perjalanan ke Sekolah',
        question: 'Tempat tinggal di mana? Berangkat ke sekolah naik apa dan pukul berapa?',
        purpose: 'Mengetahui jarak tempuh harian, durasi perjalanan pagi, moda transportasi, dan apakah siswa datang dalam kondisi terburu-buru atau cukup istirahat.',
        guidanceTip: 'Gali apakah siswa sering merasa lelah di perjalanan pagi atau diantar oleh orang tua/jemputan.',
        placeholderResponse: 'Tinggal di Sukajadi, berangkat naik motor bersama ayah pukul 06.30...'
      },
      {
        id: 'smp_q2',
        category: 'Kenyamanan & Stamina Belajar Seharian',
        question: 'Bagaimana rasanya menjalani kegiatan sekolah full day dari pagi hingga sore? Kapan biasanya kamu merasa paling bersemangat atau paling lelah?',
        purpose: 'Memetakan ritme energi harian siswa, jam-jam rawan kejenuhan/kelelahan, dan kenyamanan lingkungan kelas.',
        guidanceTip: 'Identifikasi apakah penurunan konsentrasi terjadi setelah makan siang atau di mata pelajaran terakhir sore hari.',
        placeholderResponse: 'Pagi sangat semangat, tapi sekitar jam 14.00 mulai mengantuk setelah istirahat siang...'
      },
      {
        id: 'smp_q3',
        category: 'Waktu Istirahat, Makan Siang & Ibadah',
        question: 'Saat jam istirahat siang dan sholat zuhur bersama, apa saja aktivitas yang biasa kamu lakukan?',
        purpose: 'Memastikan kebutuhan nutrisi (makan siang teratur/bekal), ibadah berjamaah, dan waktu rileks siswa terpenuhi dengan baik.',
        guidanceTip: 'Tanyakan apakah siswa makan siang teratur, menghabiskan makanannya, dan sempat berinteraksi santai dengan teman.',
        placeholderResponse: 'Makan bekal bersama teman di kelas, lanjut sholat zuhur berjamaah di masjid sekolah...'
      },
      {
        id: 'smp_q4',
        category: 'Minat, Pelajaran & Ekstrakurikuler',
        question: 'Pelajaran atau kegiatan ekstrakurikuler sore apa yang paling membuatmu merasa senang dan antusias?',
        purpose: 'Menggali potensi bakat, kecerdasan majemuk, mata pelajaran favorit, dan kegiatan penyalur minat positif.',
        guidanceTip: 'Berikan apresiasi pada minat siswa baik di bidang akademik, seni, sains, olahraga, maupun keagamaan.',
        placeholderResponse: 'Suka sekali praktikum IPA dan ikut ekskul robotik / futsal setiap hari Rabu sore...'
      },
      {
        id: 'smp_q5',
        category: 'Dinamika Pertemanan & Kelompok Kelas',
        question: 'Bagaimana suasana pertemanan di kelas? Apakah kamu punya teman dekat untuk diajak ngobrol dan belajar kelompok?',
        purpose: 'Mendeteksi integrasi sosial siswa, apakah ada indikasi terasing, kesulitan bergaul, atau kelompok pertemanan (circle) yang eksklusif.',
        guidanceTip: 'Perhatikan apakah siswa merasa nyaman dalam kerja kelompok atau sering merasa sendirian saat istirahat.',
        placeholderResponse: 'Pertemanan seru, punya 3 teman akrab yang sering belajar bareng dan duduk dekat...'
      },
      {
        id: 'smp_q6',
        category: 'Tantangan, Beban Tugas & Kesulitan Belajar',
        question: 'Apakah ada materi pelajaran atau tugas sekolah yang belakangan ini terasa cukup berat atau membingungkan?',
        purpose: 'Deteksi dini hambatan akademik sebelum berujung pada penurunan nilai, keputusasaan belajar, atau malas mengerjakan tugas.',
        guidanceTip: 'Dorong siswa agar tidak malu mengungkapkan ketidakpahaman materi dan tawarkan opsi konsultasi guru bidang studi.',
        placeholderResponse: 'Agak kesulitan di rumus matematika bab pecahan dan tugas proyek kelompok yang belum selesai...'
      },
      {
        id: 'smp_q7',
        category: 'Manajemen Waktu Setelah Pulang Sekolah',
        question: 'Setelah pulang sekolah di sore hari, bagaimana biasanya kamu membagi waktu antara istirahat, mengulang pelajaran/PR, dan bermain?',
        purpose: 'Membimbing keterampilan manajemen waktu (time-management) setelah menjalani hari panjang di sekolah full day.',
        guidanceTip: 'Bantu siswa menyusun jadwal yang seimbang: mandi & istirahat sore, belajar/PR 45 menit, lalu tidur malam tepat waktu.',
        placeholderResponse: 'Sampai rumah mandi dan istirahat 1 jam, ba\'da maghrib kerjakan tugas, jam 21.00 sudah tidur...'
      },
      {
        id: 'smp_q8',
        category: 'Penggunaan Gadget & Jam Tidur Malam',
        question: 'Bagaimana kebiasaan penggunaan HP/game di rumah setelah pulang sekolah? Jam berapa biasanya kamu tidur di malam hari?',
        purpose: 'Memantau regulasi diri terhadap layar (screen-time) dan kecukupan jam tidur malam yang memengaruhi konsentrasi pagi.',
        guidanceTip: 'Edukasi pentingnya tidur minimal 7-8 jam agar otak segar saat belajar seharian esok hari.',
        placeholderResponse: 'Boleh main HP 1 jam setelah selesai PR, biasanya tidur jam 21.30 malam...'
      },
      {
        id: 'smp_q9',
        category: 'Hubungan & Komunikasi dengan Orang Tua',
        question: 'Apakah kamu sering bercerita kepada ayah atau ibu tentang hal-hal yang dialami di sekolah saat di rumah?',
        purpose: 'Menilai kelekatan emosional (attachment) dan keterbukaan komunikasi antara siswa dengan orang tua di rumah.',
        guidanceTip: 'Gali apakah orang tua aktif bertanya kabar sekolah dengan hangat atau siswa cenderung memendam cerita.',
        placeholderResponse: 'Sering cerita ke ibu waktu makan malam tentang kejadian lucu bersama teman kelas...'
      },
      {
        id: 'smp_q10',
        category: 'Pencegahan Perundungan & Rasa Aman',
        question: 'Apakah di sekolah kamu merasa aman dan nyaman? Pernahkah melihat atau mengalami perlakuan teman yang menyakiti hati?',
        purpose: 'Menciptakan iklim sekolah yang bebas perundungan (anti-bullying) dan memastikan siswa tahu ruang aman melapor ke BK.',
        guidanceTip: 'Yakinkan siswa bahwa ruang BK adalah tempat yang aman, rahasia, dan siap melindungi setiap siswa.',
        placeholderResponse: 'Alhamdulillah merasa aman, guru-guru dan teman-teman sangat ramah...'
      },
      {
        id: 'smp_q11',
        category: 'Cita-Cita Awal & Harapan Diri',
        question: 'Apa impian atau hal baik yang ingin sekali kamu capai di semester ini?',
        purpose: 'Membangun motivasi intrinsik (self-determination) dan rasa percaya diri siswa untuk berkembang.',
        guidanceTip: 'Bantu siswa merumuskan target pribadi yang realistis dan langkah kecil untuk mencapainya.',
        placeholderResponse: 'Ingin nilai rapor rata-rata naik dan bisa tampil percaya diri saat presentasi kelas...'
      }
    ]
  },

  SMA: {
    level: 'SMA',
    title: 'Tingkat SMA (Fase Remaja Akhir - Sekolah Full Day)',
    subtitle: 'Minat Bakat, Orientasi Karir, Manajemen Stres & Well-being',
    focusArea: 'Fokus pada pemetaan jurusan perguruan tinggi / karir masa depan, strategi persiapan tes masuk PTN (SNBP/SNBT/Kedinasan), manajemen energi sekolah full day + organisasi, adaptasi emosi, dan kesehatan mental.',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    questions: [
      {
        id: 'sma_q1',
        category: 'Rutinitas Full Day & Manajemen Energi',
        question: 'Bagaimana kamu mengatur energi dan konsentrasi selama menjalani jadwal padat sekolah full day ditambah kegiatan lainnya?',
        purpose: 'Memahami bagaimana siswa mengelola stamina fisik dan kapasitas mental di antara jam pelajaran panjang, ekskul, dan bimbel.',
        guidanceTip: 'Periksa apakah ada tanda-tanda kelelahan kronis atau kurang tidur akibat tugas dan kegiatan malam hari.',
        placeholderResponse: 'Cukup padat karena ada bimbel luar setelah pulang sekolah, tapi mencoba tidur siang 15 menit saat istirahat...'
      },
      {
        id: 'sma_q2',
        category: 'Eksplorasi Minat, Bakat & Bidang Unggulan',
        question: 'Mata pelajaran atau bidang keahlian apa yang paling kamu sukai dan merasa memiliki potensi besar di situ?',
        purpose: 'Mengidentifikasi kekuatan minat (passion) dan bakat spesifik siswa (sains/teknologi/sosial humaniora/seni/bahasa).',
        guidanceTip: 'Ajak siswa merefleksikan nilai rapor dan proyek yang pernah mereka selesaikan dengan hasil membanggakan.',
        placeholderResponse: 'Sangat menyukai Fisika dan Komputer, senang membongkar kode pemrograman sederhana...'
      },
      {
        id: 'sma_q3',
        category: 'Orientasi Jurusan Kuliah & Karir Masa Depan',
        question: 'Jurusan perguruan tinggi atau jalur karir apa yang saat ini menjadi target utama impianmu? Mengapa tertarik ke sana?',
        purpose: 'Mengetahui kejelasan arah masa depan dan alasan di balik pemilihan jurusan (minat pribadi vs tuntutan sosial).',
        guidanceTip: 'Periksa apakah pilihan jurusan realistis dengan profil nilai dan apakah siswa telah memahami prospek kerjanya.',
        placeholderResponse: 'Target utama Teknik Informatika ITB atau UI karena prospek karir software engineering sangat luas...'
      },
      {
        id: 'sma_q4',
        category: 'Persiapan SNBP, SNBT, Kedinasan & Portofolio',
        question: 'Langkah persiapan nyata apa yang sudah mulai kamu jalani untuk menghadapi seleksi masuk perguruan tinggi?',
        purpose: 'Menilai kesiapan rencana aksi belajar (jadwal latihan soal, try out, menjaga konsistensi nilai rapor semester 1-5).',
        guidanceTip: 'Bantu menyusun jadwal target belajar berkala yang terukur agar tidak menumpuk saat mendekati ujian.',
        placeholderResponse: 'Mulai rutin drill soal TPS 20 soal per hari dan menjaga nilai rapor agar bisa ikut kuota SNBP...'
      },
      {
        id: 'sma_q5',
        category: 'Diskusi Pilihan Karir dengan Orang Tua',
        question: 'Bagaimana tanggapan orang tua mengenai jurusan atau jalur karir yang kamu minati? Apakah sudah ada kesepahaman?',
        purpose: 'Mendeteksi apakah ada perbedaan visi jurusan antara siswa dan orang tua (misal: ortu ingin kedokteran, anak ingin desain).',
        guidanceTip: 'Tawarkan bimbingan mediasi konsultasi bersama orang tua jika terdapat perbedaan harapan.',
        placeholderResponse: 'Orang tua mendukung, namun ayah menyarankan agar mempertimbangkan opsi sekolah kedinasan juga...'
      },
      {
        id: 'sma_q6',
        category: 'Manajemen Stres Akademik & Burnout',
        question: 'Ketika menghadapi beban tugas yang menumpuk atau jadwal ujian, apa yang biasanya kamu lakukan untuk mengatasi stres?',
        purpose: 'Menggali mekanisme koping (coping mechanism) siswa dalam menghadapi tekanan akademik dan menjaga kesehatan mental.',
        guidanceTip: 'Ajarkan teknik relaksasi, manajemen waktu dengan sistem prioritas, dan istirahat berkualitas tanpa rasa bersalah.',
        placeholderResponse: 'Mendengarkan musik akustik, olahraga lari sore di akhir pekan, dan membuat to-do list tugas prioritas...'
      },
      {
        id: 'sma_q7',
        category: 'Dinamika Sosial & Kolaborasi Sebaya',
        question: 'Bagaimana hubunganmu dengan teman-teman di kelas dan sekolah? Apakah lingkungan pertemanan mendukung perkembangan positifmu?',
        purpose: 'Memastikan siswa berada dalam lingkaran pergaulan sebaya (peer group) yang sehat, suportif, dan saling memotivasi.',
        guidanceTip: 'Diskusikan pentingnya memilih teman yang mengajak pada kebaikan dan kemampuan menolak ajakan yang merugikan.',
        placeholderResponse: 'Lingkungan sangat positif, kami sering membentuk kelompok belajar bersama menjelang asesmen...'
      },
      {
        id: 'sma_q8',
        category: 'Keaktifan Organisasi, Kepemimpinan & Soft Skill',
        question: 'Kegiatan organisasi (OSIS/MPK), kepanitiaan, atau proyek apa yang sedang atau pernah kamu ikuti?',
        purpose: 'Mendorong pengembangan soft skills: komunikasi, kepemimpinan (leadership), kerjasama tim, dan problem-solving.',
        guidanceTip: 'Bantu siswa merefleksikan keterampilan yang diperoleh untuk memperkaya portofolio prestasi dan beasiswa.',
        placeholderResponse: 'Aktif di seksi publikasi OSIS dan pernah menjadi ketua pelaksana pameran karya ilmiah sekolah...'
      },
      {
        id: 'sma_q9',
        category: 'Mengatasi Rasa Cemas & Perbandingan Sosial (Insecurity)',
        question: 'Pernahkah kamu merasa minder atau cemas saat melihat capaian atau nilai teman lain yang lebih tinggi? Bagaimana cara kamu meresponnya?',
        purpose: 'Membimbing siswa agar terhindar dari toxic comparison dan lebih fokus pada grafik perkembangan diri sendiri (self-growth).',
        guidanceTip: 'Tanamkan bahwa setiap orang memiliki garis start dan kecepatan bertumbuh yang berbeda-beda.',
        placeholderResponse: 'Dulu sempat cemas, tapi sekarang berusaha fokus mengevaluasi kelemahan diri sendiri...'
      },
      {
        id: 'sma_q10',
        category: 'Komitmen & Harapan Diri Semester Ini',
        question: 'Apa satu target penting yang ingin kamu buktikan pada dirimu sendiri di semester ini?',
        purpose: 'Menutup sesi bimbingan dengan komitmen aksi nyata dan afirmasi positif bagi masa depan siswa.',
        guidanceTip: 'Catat komitmen siswa dan jadikan sebagai bahan evaluasi tindak lanjut pada pertemuan bimbingan berkala berikutnya.',
        placeholderResponse: 'Ingin konsisten bangun pagi, mempertahankan peringkat 5 besar, dan menyelesaikan portofolio lomba...'
      }
    ]
  }
};

// Aliased for backward compatibility
export const BK_QUESTIONNAIRES = DEFAULT_BK_QUESTIONNAIRES;

const STORAGE_KEY_CUSTOM_QUESTIONS = 'sistem_poin_bk_custom_questions';

/**
 * Loads custom BK questionnaire from localStorage, falling back to default full-day school bank
 */
export function loadBKQuestionnaires(): Record<'SMP' | 'SMA', BKQuestionnaireLevel> {
  if (typeof window === 'undefined') return DEFAULT_BK_QUESTIONNAIRES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.SMP && parsed.SMA && Array.isArray(parsed.SMP.questions) && Array.isArray(parsed.SMA.questions)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom BK questionnaires:', e);
  }
  return DEFAULT_BK_QUESTIONNAIRES;
}

/**
 * Saves custom BK questionnaires to localStorage
 */
export function saveBKQuestionnaires(data: Record<'SMP' | 'SMA', BKQuestionnaireLevel>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(data));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bk_questions_updated', { detail: data }));
      window.dispatchEvent(new CustomEvent('sistem_poin_bk_questionnaires_updated', { detail: data }));
    }, 0);
  } catch (e) {
    console.error('Error saving custom BK questionnaires:', e);
  }
}

/**
 * Resets questions back to the default full-day school instruments
 */
export function resetBKQuestionnairesToDefault(): Record<'SMP' | 'SMA', BKQuestionnaireLevel> {
  saveBKQuestionnaires(DEFAULT_BK_QUESTIONNAIRES);
  return DEFAULT_BK_QUESTIONNAIRES;
}

export const resetBKQuestionnaires = resetBKQuestionnairesToDefault;

/**
 * Helper to auto-detect whether a student is SMP or SMA based on class string
 */
export function detectLevelFromClass(className?: string): 'SMP' | 'SMA' {
  if (!className) return 'SMP';
  const c = className.toUpperCase().trim();
  // SMA markers: 10, 11, 12, X, XI, XII, IPA, IPS, MA, SMK
  if (
    c.startsWith('10') ||
    c.startsWith('11') ||
    c.startsWith('12') ||
    c.startsWith('X') ||
    c.startsWith('XI') ||
    c.startsWith('XII') ||
    c.includes('IPA') ||
    c.includes('IPS') ||
    c.includes('MA') ||
    c.includes('SMA') ||
    c.includes('SMK')
  ) {
    return 'SMA';
  }
  // Default to SMP (7, 8, 9, VII, VIII, IX, MTs, SMP)
  return 'SMP';
}
