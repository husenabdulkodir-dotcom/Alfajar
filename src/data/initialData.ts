import { RuleItem, Santri, PointRecord, BKCounselingNote, BKRoutineSchedule, EkskulRecord } from '../types';

export const INITIAL_ACADEMIC_YEAR = '2026/2027';
export const DATA_VERSION = 'v5_bk_counseling';

export const INITIAL_EKSKUL: EkskulRecord[] = [
  {
    id: 'e1',
    santriId: 's-7-1',
    ekskulName: 'Pramuka (Wajib)',
    paymentStatus: 'Lunas Bulan Ini',
    isPaid: true,
    coachNote: 'Ananda sangat aktif dan terpilih menjadi pimpinan regu dalam kegiatan kemah Jumat-Sabtu. Mampu memberikan instruksi baris-berbaris dengan baik.',
    semester: 'Ganjil',
    academicYear: '2026/2027'
  },
  {
    id: 'e2',
    santriId: 's-7-1',
    ekskulName: 'Klub Panahan',
    paymentStatus: 'Belum Lunas (Rp 50.000)',
    isPaid: false,
    coachNote: 'Perkembangan fokus dan akurasi ananda memanah jarak 10 meter sudah sangat baik.',
    semester: 'Ganjil',
    academicYear: '2026/2027'
  }
];

export const INITIAL_RULES: RuleItem[] = [
  // Pelanggaran (Minus)
  // Format Kategori:
  // - Ringan: -5 sampai -15
  // - Sedang: -20 sampai -25
  // - Berat: -30 sampai seterusnya
  { id: 'rule-1a', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', defaultPoints: -5, defaultPunishmentOrReward: 'Merapikan kelas & teguran' },
  { id: 'rule-2a', type: 'Pelanggaran', category: 'Ringan', title: '2a - Berada di kamar saat KBM', defaultPoints: -5, defaultPunishmentOrReward: 'Tugas resume pelajaran' },
  { id: 'rule-3a', type: 'Pelanggaran', category: 'Ringan', title: '3a - Mewarnai, menyemir rambut', defaultPoints: -5, defaultPunishmentOrReward: 'Rambut dicukur / hitamkan kembali' },
  { id: 'rule-4a', type: 'Pelanggaran', category: 'Ringan', title: '4a - Memanjangkan kuku', defaultPoints: -5, defaultPunishmentOrReward: 'Potong kuku di tempat' },
  { id: 'rule-5a', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', defaultPoints: -5, defaultPunishmentOrReward: 'Ganti seragam & puskes' },
  { id: 'rule-6a', type: 'Pelanggaran', category: 'Ringan', title: '6a - Memanggil santri lain dengan panggilan tidak elok', defaultPoints: -5, defaultPunishmentOrReward: 'Minta maaf & istighfar 100x' },
  { id: 'rule-7a', type: 'Pelanggaran', category: 'Ringan', title: '7a - Berbuat tidak sopan di dalam kelas', defaultPoints: -5, defaultPunishmentOrReward: 'Berdiri di depan kelas' },
  { id: 'rule-8a', type: 'Pelanggaran', category: 'Ringan', title: '8a - Mengancam/menyakiti saksi pelanggaran', defaultPoints: -5, defaultPunishmentOrReward: 'Pernyataan janji & pembinaan' },
  { id: 'rule-9a', type: 'Pelanggaran', category: 'Ringan', title: '9a - Tidak menghadiri apel pagi', defaultPoints: -10, defaultPunishmentOrReward: 'Piket lapangan & lari pagi' },
  { id: 'rule-10a', type: 'Pelanggaran', category: 'Ringan', title: '10a - Mangkir dari pemanggilan resmi ustadz', defaultPoints: -10, defaultPunishmentOrReward: 'Panggilan ulang & tugas kebersihan' },
  { id: 'rule-11a', type: 'Pelanggaran', category: 'Ringan', title: '11a - Masuk ruang kantor asatidzah tanpa izin', defaultPoints: -10, defaultPunishmentOrReward: 'Teguran keras kesiswaan' },
  { id: 'rule-12a', type: 'Pelanggaran', category: 'Ringan', title: '12a - Membuat kegaduhan atau keributan', defaultPoints: -10, defaultPunishmentOrReward: 'Piket kebersihan 3 hari' },
  { id: 'rule-13a', type: 'Pelanggaran', category: 'Ringan', title: '13a - Mengeluarkan kata kotor lisan/tulisan', defaultPoints: -10, defaultPunishmentOrReward: 'Menulis istighfar 100x & pembinaan' },
  { id: 'rule-14a', type: 'Pelanggaran', category: 'Ringan', title: '14a - Perkelahian tidak terencana (Emosi spontan)', defaultPoints: -10, defaultPunishmentOrReward: 'Islah & piket bersama' },
  { id: 'rule-15a', type: 'Pelanggaran', category: 'Ringan', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', defaultPoints: -15, defaultPunishmentOrReward: 'Skorsing & piket kebersihan' },
  { id: 'rule-16a', type: 'Pelanggaran', category: 'Ringan', title: '16a - Menggunakan barang orang lain tanpa izin', defaultPoints: -15, defaultPunishmentOrReward: 'Kembalikan barang & minta maaf' },
  { id: 'rule-17a', type: 'Pelanggaran', category: 'Ringan', title: '17a - Berpakaian tidak islami & aksesorisnya', defaultPoints: -15, defaultPunishmentOrReward: 'Sita aksesoris' },
  { id: 'rule-18a', type: 'Pelanggaran', category: 'Sedang', title: '18a - Perkelahian dengan terencana', defaultPoints: -20, defaultPunishmentOrReward: 'Panggilan orang tua & SP1' },
  { id: 'rule-19a', type: 'Pelanggaran', category: 'Sedang', title: '19a - Mengintimidasi atau mengancam santri lain', defaultPoints: -25, defaultPunishmentOrReward: 'SP1 & Panggilan Orang Tua' },
  { id: 'rule-20a', type: 'Pelanggaran', category: 'Sedang', title: '20a - Menolak sanksi / tidak sopan pada guru', defaultPoints: -25, defaultPunishmentOrReward: 'Pernyataan maaf tertulis & SP1' },
  { id: 'rule-21a', type: 'Pelanggaran', category: 'Sedang', title: '21a - Menerima & menyimpan barang terlarang', defaultPoints: -25, defaultPunishmentOrReward: 'Sita barang & Panggilan Wali' },
  { id: 'rule-22a', type: 'Pelanggaran', category: 'Sedang', title: '22a - Tasyabbuh (qoza, bioskop, dll)', defaultPoints: -25, defaultPunishmentOrReward: 'Potong rapi & SP1' },
  { id: 'rule-23a', type: 'Pelanggaran', category: 'Sedang', title: '23a - Mengajak santri lain melakukan pelanggaran', defaultPoints: -25, defaultPunishmentOrReward: 'SP1 & Pembinaan Kesiswaan' },
  { id: 'rule-24a', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', defaultPoints: -5, defaultPunishmentOrReward: 'Remedial Mufrodat' },
  { id: 'rule-25a', type: 'Pelanggaran', category: 'Ringan', title: '25a - Nyabut stop kontak cctv', defaultPoints: -10, defaultPunishmentOrReward: 'Pasang kembali & piket CCTV' },
  { id: 'rule-26a', type: 'Pelanggaran', category: 'Berat', title: '26a - Perusakan berat / Narkoba / Asusila / Pelanggaran Berat', defaultPoints: -35, defaultPunishmentOrReward: 'SP3 / Panggilan Orang Tua Khusus & Pembinaan' },
  { id: 'rule-ha', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', defaultPoints: -5, defaultPunishmentOrReward: 'Teguran lisan & piket' },

  // Kebaikan (Plus)
  { id: 'rule-1b', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', defaultPoints: 10, defaultPunishmentOrReward: 'Sertifikat & Apresiasi' },
  { id: 'rule-2b', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', defaultPoints: 5, defaultPunishmentOrReward: 'Catatan Keaktifan' },
  { id: 'rule-3b', type: 'Kebaikan', category: 'Ringan', title: '3b - Ranking 5 besar SMP / 3 besar SMA', defaultPoints: 10, defaultPunishmentOrReward: 'Piagam Prestasi Academic' },
  { id: 'rule-4b', type: 'Kebaikan', category: 'Ringan', title: '4b - Organisasi kelas dan osis', defaultPoints: 10, defaultPunishmentOrReward: 'Nilai Kepemimpinan' },
  { id: 'rule-5b', type: 'Kebaikan', category: 'Sedang', title: '5b - Mengikuti pengambilan sanad matan', defaultPoints: 15, defaultPunishmentOrReward: 'Sertifikat Sanad' },
  { id: 'rule-6b', type: 'Kebaikan', category: 'Sedang', title: '6b - Juara lomba internal ma\'had', defaultPoints: 15, defaultPunishmentOrReward: 'Hadiah & Piagam' },
  { id: 'rule-7b', type: 'Kebaikan', category: 'Sedang', title: '7b - Mendapatkan nilai mufrodat 100', defaultPoints: 15, defaultPunishmentOrReward: 'Apresiasi Mufrodat' },
  { id: 'rule-8b', type: 'Kebaikan', category: 'Sedang', title: '8b - Kehadiran 100% dalam satu semester', defaultPoints: 15, defaultPunishmentOrReward: 'Penghargaan Rajin' },
  { id: 'rule-9b', type: 'Kebaikan', category: 'Berat', title: '9b - Lulus Tasmi 5 juz sekali duduk', defaultPoints: 25, defaultPunishmentOrReward: 'Beasiswa Tahfizh' },
  { id: 'rule-10b', type: 'Kebaikan', category: 'Berat', title: '10b - Ranking 1 Kelas', defaultPoints: 25, defaultPunishmentOrReward: 'Trofi & Piagam Utama' },
  { id: 'rule-11b', type: 'Kebaikan', category: 'Berat', title: '11b - Juara lomba eksternal ma\'had', defaultPoints: 30, defaultPunishmentOrReward: 'Uang Pembinaan & Piagam' },
  { id: 'rule-12b', type: 'Kebaikan', category: 'Sedang', title: '12b - Lulus Tasmi 3 juz sekali duduk', defaultPoints: 15, defaultPunishmentOrReward: 'Sertifikat Tasmi 3 Juz' },
  { id: 'rule-13b', type: 'Kebaikan', category: 'Ringan', title: '13b - Lulus ujian mufrodat jilid 1', defaultPoints: 10, defaultPunishmentOrReward: 'Sertifikat Mufrodat Jilid 1' },
  { id: 'rule-14b', type: 'Kebaikan', category: 'Sedang', title: '14b - Lulus ujian mufrodat jilid 2', defaultPoints: 15, defaultPunishmentOrReward: 'Sertifikat Mufrodat Jilid 2' }
];

export const INITIAL_SANTRI: Santri[] = [
  { id: 's-10-1', nis: '202610001', name: 'Abdullah Azzam Fakhruddin', class: '11', parentName: 'Wali Azzam F', parentPhone: '08120001001', accessPin: '638294', academicYear: '2026/2027' },
  { id: 's-10-2', nis: '202610002', name: 'Alva Muhammad Prasista', class: '11', parentName: 'Wali Alva M', parentPhone: '08120001002', accessPin: '295817', academicYear: '2026/2027' },
  { id: 's-10-3', nis: '202610003', name: 'Ammar Alden Irawan', class: '11', parentName: 'Wali Ammar A', parentPhone: '08120001003', accessPin: '871429', academicYear: '2026/2027' },
  { id: 's-10-4', nis: '202610004', name: 'Arrazaqku huga niranta', class: '11', parentName: 'Wali Arrazaqku', parentPhone: '08120001004', accessPin: '419385', academicYear: '2026/2027' },
  { id: 's-10-5', nis: '202610005', name: 'Farish Favian Efendi', class: '11', parentName: 'Wali Farish', parentPhone: '08120001005', accessPin: '752941', academicYear: '2026/2027' },
  { id: 's-10-6', nis: '202610006', name: 'Fathan Almaisan Zhafar', class: '11', parentName: 'Wali Fathan', parentPhone: '08120001006', accessPin: '384192', academicYear: '2026/2027' },
  { id: 's-10-7', nis: '202610007', name: 'Fayaz Ibrahimovic', class: '11', parentName: 'Wali Fayaz', parentPhone: '08120001007', accessPin: '926518', academicYear: '2026/2027' },
  { id: 's-10-9', nis: '202610009', name: 'Muhammad Afif Azril', class: '11', parentName: 'Wali Afif', parentPhone: '08120001009', accessPin: '573841', academicYear: '2026/2027', organizationRole: 'Ketua Kelas' },
  { id: 's-10-10', nis: '202610010', name: 'Muhammad Althaf Zaidan', class: '11', parentName: 'Wali Althaf Z', parentPhone: '08120001010', accessPin: '829416', academicYear: '2026/2027' },
  { id: 's-10-11', nis: '202610011', name: 'Muhammad Emir Azka Lubis', class: '11', parentName: 'Wali Emir A', parentPhone: '08120001011', accessPin: '461952', academicYear: '2026/2027' },
  { id: 's-10-12', nis: '202610012', name: 'Muhammad Syamil', class: '11', parentName: 'Wali Syamil', parentPhone: '08120001012', accessPin: '793825', academicYear: '2026/2027' },
  { id: 's-10-13', nis: '202610013', name: 'Rafa Ghaisan Januar Ridwan', class: '11', parentName: 'Wali Rafa G', parentPhone: '08120001013', accessPin: '235194', academicYear: '2026/2027' },
  { id: 's-10-14', nis: '202610014', name: 'Rafkha Al Fakhri', class: '11', parentName: 'Wali Rafkha', parentPhone: '08120001014', accessPin: '684927', academicYear: '2026/2027' },
  { id: 's-10-15', nis: '202610015', name: 'Zahir', class: '11', parentName: 'Wali Zahir', parentPhone: '08120001015', accessPin: '917482', academicYear: '2026/2027' },
  { id: 's-7-1', nis: '202607001', name: 'Afkar Syaddad Safaraz', class: '8', parentName: 'Wali Afkar', parentPhone: '08120000701', accessPin: '839215', academicYear: '2026/2027', organizationRole: 'Ketua Kelas' },
  { id: 's-7-10', nis: '202607010', name: 'Fakhri Bahtiar Arsad', class: '8', parentName: 'Wali Fakhri B', parentPhone: '08120000710', accessPin: '820463', academicYear: '2026/2027' },
  { id: 's-7-11', nis: '202607011', name: 'Fakhri Maulana Ashadi', class: '8', parentName: 'Wali Fakhri M', parentPhone: '08120000711', accessPin: '439185', academicYear: '2026/2027' },
  { id: 's-7-12', nis: '202607012', name: 'Farhan M\'Arif', class: '8', parentName: 'Wali Farhan', parentPhone: '08120000712', accessPin: '681529', academicYear: '2026/2027' },
  { id: 's-7-13', nis: '202607013', name: 'Fatih Rasyid Chairullah', class: '8', parentName: 'Wali Fatih', parentPhone: '08120000713', accessPin: '295741', academicYear: '2026/2027' },
  { id: 's-7-14', nis: '202607014', name: 'Ghaisa Aulia Rahman', class: '8', parentName: 'Wali Ghaisa', parentPhone: '08120000714', accessPin: '714892', academicYear: '2026/2027' },
  { id: 's-7-15', nis: '202607015', name: 'Hudzaifah Fawwaz', class: '8', parentName: 'Wali Hudzaifah', parentPhone: '08120000715', accessPin: '358204', academicYear: '2026/2027' },
  { id: 's-7-16', nis: '202607016', name: 'Ibnu Habibi Achmad', class: '8', parentName: 'Wali Ibnu', parentPhone: '08120000716', accessPin: '942617', academicYear: '2026/2027' },
  { id: 's-7-17', nis: '202607017', name: 'Ibrahim khalid', class: '8', parentName: 'Wali Ibrahim', parentPhone: '08120000717', accessPin: '185394', academicYear: '2026/2027' },
  { id: 's-7-18', nis: '202607018', name: 'Mikael ardsy as sakha', class: '8', parentName: 'Wali Mikael', parentPhone: '08120000718', accessPin: '529471', academicYear: '2026/2027' },
  { id: 's-7-19', nis: '202607019', name: 'Muhammad', class: '8', parentName: 'Wali Muhammad', parentPhone: '08120000719', accessPin: '764183', academicYear: '2026/2027' },
  { id: 's-7-2', nis: '202607002', name: 'Ahmad Fauzan', class: '8', parentName: 'Wali Ahmad F', parentPhone: '08120000702', accessPin: '471928', academicYear: '2026/2027', organizationRole: 'Anggota Qism Ibadah' },
  { id: 's-7-20', nis: '202607020', name: 'Muhammad Arganta Pamungkaswara', class: '8', parentName: 'Wali Arganta', parentPhone: '08120000720', accessPin: '318952', academicYear: '2026/2027' },
  { id: 's-7-21', nis: '202607021', name: 'Muhammad Idris Assyahmi', class: '8', parentName: 'Wali Idris', parentPhone: '08120000721', accessPin: '892415', academicYear: '2026/2027' },
  { id: 's-7-22', nis: '202607022', name: 'Muhammad Shadraz Milanof Tinar', class: '8', parentName: 'Wali Shadraz', parentPhone: '08120000722', accessPin: '461739', academicYear: '2026/2027' },
  { id: 's-7-23', nis: '202607023', name: 'Musa Widiyanto', class: '8', parentName: 'Wali Musa', parentPhone: '08120000723', accessPin: '637924', academicYear: '2026/2027' },
  { id: 's-7-24', nis: '202607024', name: 'Naufal Ibrahim Ali', class: '8', parentName: 'Wali Naufal', parentPhone: '08120000724', accessPin: '284519', academicYear: '2026/2027' },
  { id: 's-7-25', nis: '202607025', name: 'Rafiqi zulmi arifin', class: '8', parentName: 'Wali Rafiqi', parentPhone: '08120000725', accessPin: '951382', academicYear: '2026/2027' },
  { id: 's-7-26', nis: '202607026', name: 'Rayyan Kurnia Yusuf Abdillah', class: '8', parentName: 'Wali Rayyan K', parentPhone: '08120000726', accessPin: '572946', academicYear: '2026/2027' },
  { id: 's-7-27', nis: '202607027', name: 'Sa\'id Al fajri', class: '8', parentName: 'Wali Sa\'id', parentPhone: '08120000727', accessPin: '148395', academicYear: '2026/2027' },
  { id: 's-7-28', nis: '202607028', name: 'Umar Abdullah Hanif', class: '8', parentName: 'Wali Umar H', parentPhone: '08120000728', accessPin: '836274', academicYear: '2026/2027' },
  { id: 's-7-29', nis: '202607029', name: 'Zahka Al Zahkila', class: '8', parentName: 'Wali Zahka', parentPhone: '08120000729', accessPin: '495183', academicYear: '2026/2027' },
  { id: 's-7-3', nis: '202607003', name: 'Ahmad Labib Fauzan', class: '8', parentName: 'Wali Ahmad L', parentPhone: '08120000703', accessPin: '625841', academicYear: '2026/2027' },
  { id: 's-7-4', nis: '202607004', name: 'Ahmad Rayyan Maulana Hasan', class: '8', parentName: 'Wali Rayyan', parentPhone: '08120000704', accessPin: '194732', academicYear: '2026/2027' },
  { id: 's-7-5', nis: '202607005', name: 'Amru Fauzi Hasibuan', class: '8', parentName: 'Wali Amru', parentPhone: '08120000705', accessPin: '753819', academicYear: '2026/2027' },
  { id: 's-7-6', nis: '202607006', name: 'Andi Umar Abdul Aziz', class: '8', parentName: 'Wali Andi', parentPhone: '08120000706', accessPin: '382946', academicYear: '2026/2027' },
  { id: 's-7-7', nis: '202607007', name: 'Daffa Primo Desantyo', class: '8', parentName: 'Wali Daffa', parentPhone: '08120000707', accessPin: '916428', academicYear: '2026/2027' },
  { id: 's-7-8', nis: '202607008', name: 'Evandra Khalfani Nugraha', class: '8', parentName: 'Wali Evandra', parentPhone: '08120000708', accessPin: '249581', academicYear: '2026/2027' },
  { id: 's-7-9', nis: '202607009', name: 'Faizha Malika Ar Razzaq', class: '8', parentName: 'Wali Faizha', parentPhone: '08120000709', accessPin: '573194', academicYear: '2026/2027' },
  { id: 's-8-1', nis: '202608001', name: 'Abdullah Fulvian Fulca', class: '9', parentName: 'Wali Fulvian', parentPhone: '08120000801', accessPin: '728419', academicYear: '2026/2027', organizationRole: 'Ketua OSIS' },
  { id: 's-8-10', nis: '202608010', name: 'Fadil Aryo Pratomo', class: '9', parentName: 'Wali Fadil', parentPhone: '08120000810', accessPin: '849512', academicYear: '2026/2027' },
  { id: 's-8-11', nis: '202608011', name: 'Fahri Ibrahim', class: '9', parentName: 'Wali Fahri', parentPhone: '08120000811', accessPin: '417389', academicYear: '2026/2027' },
  { id: 's-8-12', nis: '202608012', name: 'Fayi Al Muyassar Syafiq', class: '9', parentName: 'Wali Fayi', parentPhone: '08120000812', accessPin: '762941', academicYear: '2026/2027' },
  { id: 's-8-13', nis: '202608013', name: 'Huzaifah Fa\'iz Al Musyari', class: '9', parentName: 'Wali Huzaifah F', parentPhone: '08120000813', accessPin: '295184', academicYear: '2026/2027' },
  { id: 's-8-14', nis: '202608014', name: 'Jawad Al Ghifary', class: '9', parentName: 'Wali Jawad', parentPhone: '08120000814', accessPin: '938472', academicYear: '2026/2027' },
  { id: 's-8-15', nis: '202608015', name: 'Jibran Mishal Maulana', class: '9', parentName: 'Wali Jibran', parentPhone: '08120000815', accessPin: '516293', academicYear: '2026/2027', organizationRole: 'Ketua Qism Ibadah' },
  { id: 's-8-16', nis: '202608016', name: 'Kantasasmita Indraputra', class: '9', parentName: 'Wali Kanta', parentPhone: '08120000816', accessPin: '874125', academicYear: '2026/2027' },
  { id: 's-8-17', nis: '202608017', name: 'Miqdaad Bihaaru Mafaazan', class: '9', parentName: 'Wali Miqdaad', parentPhone: '08120000817', accessPin: '349581', academicYear: '2026/2027' },
  { id: 's-8-18', nis: '202608018', name: 'Mochamad Zakhwan Alravi', class: '9', parentName: 'Wali Zakhwan', parentPhone: '08120000818', accessPin: '682394', academicYear: '2026/2027', organizationRole: 'Ketua Qism Nadzofah (Kebersihan)' },
  { id: 's-8-19', nis: '202608019', name: 'Muhammad Ajmal Alfadee', class: '9', parentName: 'Wali Ajmal', parentPhone: '08120000819', accessPin: '195473', academicYear: '2026/2027' },
  { id: 's-8-2', nis: '202608002', name: 'Abdullah Musyaffa Ali', class: '9', parentName: 'Wali Musyaffa', parentPhone: '08120000802', accessPin: '394825', academicYear: '2026/2027' },
  { id: 's-8-20', nis: '202608020', name: 'Muhammad Althaf Amran', class: '9', parentName: 'Wali Althaf A', parentPhone: '08120000820', accessPin: '741829', academicYear: '2026/2027' },
  { id: 's-8-21', nis: '202608021', name: 'Muhammad Kholid Firmansyah', class: '9', parentName: 'Wali Kholid', parentPhone: '08120000821', accessPin: '428935', academicYear: '2026/2027' },
  { id: 's-8-22', nis: '202608022', name: 'Muhammad Rafi Wibisono', class: '9', parentName: 'Wali Rafi', parentPhone: '08120000822', accessPin: '963217', academicYear: '2026/2027' },
  { id: 's-8-23', nis: '202608023', name: 'Muhammad Rifqi Al Hamdani', class: '9', parentName: 'Wali Rifqi', parentPhone: '08120000823', accessPin: '257491', academicYear: '2026/2027' },
  { id: 's-8-24', nis: '202608024', name: 'Muhammad Tujuh Firdaus', class: '9', parentName: 'Wali Tujuh', parentPhone: '08120000824', accessPin: '819364', academicYear: '2026/2027' },
  { id: 's-8-25', nis: '202608025', name: 'Nasri Musyaffa Hasibuan', class: '9', parentName: 'Wali Nasri', parentPhone: '08120000825', accessPin: '534829', academicYear: '2026/2027', organizationRole: 'Ketua Qism Lughoh (Bahasa)' },
  { id: 's-8-26', nis: '202608026', name: 'Nekta Ranu Khairan', class: '9', parentName: 'Wali Nekta', parentPhone: '08120000826', accessPin: '381947', academicYear: '2026/2027' },
  { id: 's-8-27', nis: '202608027', name: 'Rizqy Abdurrohim', class: '9', parentName: 'Wali Rizqy', parentPhone: '08120000827', accessPin: '792518', academicYear: '2026/2027' },
  { id: 's-8-28', nis: '202608028', name: 'Umar Abdulloh', class: '9', parentName: 'Wali Umar A', parentPhone: '08120000828', accessPin: '463829', academicYear: '2026/2027' },
  { id: 's-8-29', nis: '202608029', name: 'Wisnu Abimanyu Hendarto', class: '9', parentName: 'Wali Wisnu', parentPhone: '08120000829', accessPin: '928174', academicYear: '2026/2027' },
  { id: 's-8-3', nis: '202608003', name: 'Adam Sinatrya Suwardoyo', class: '9', parentName: 'Wali Adam S', parentPhone: '08120000803', accessPin: '815293', academicYear: '2026/2027' },
  { id: 's-8-30', nis: '202608030', name: 'Zaid Muizzuddin Rhamdany', class: '9', parentName: 'Wali Zaid', parentPhone: '08120000830', accessPin: '175942', academicYear: '2026/2027' },
  { id: 's-8-31', nis: '202608031', name: 'Yazid Arif Fadhlan', class: '9', parentName: 'Wali Yazid', parentPhone: '08120000831', accessPin: '648291', academicYear: '2026/2027' },
  { id: 's-8-4', nis: '202608004', name: 'Arjuna Bhadrika Zaky', class: '9', parentName: 'Wali Arjuna', parentPhone: '08120000804', accessPin: '269471', academicYear: '2026/2027' },
  { id: 's-8-5', nis: '202608005', name: 'Akram Abdul Hakim', class: '9', parentName: 'Wali Akram', parentPhone: '08120000805', accessPin: '641835', academicYear: '2026/2027' },
  { id: 's-8-6', nis: '202608006', name: 'Azhar Farid Mumtaz Islam', class: '9', parentName: 'Wali Azhar', parentPhone: '08120000806', accessPin: '953182', academicYear: '2026/2027' },
  { id: 's-8-7', nis: '202608007', name: 'Azmi Hafizh Rabbani', class: '9', parentName: 'Wali Azmi', parentPhone: '08120000807', accessPin: '184926', academicYear: '2026/2027' },
  { id: 's-8-8', nis: '202608008', name: 'Azzam Hudzaifah Al Jauzi', class: '9', parentName: 'Wali Azzam', parentPhone: '08120000808', accessPin: '572394', academicYear: '2026/2027' },
  { id: 's-8-9', nis: '202608009', name: 'Danish Akbar Al-Ghazi', class: '9', parentName: 'Wali Danish', parentPhone: '08120000809', accessPin: '328175', academicYear: '2026/2027' },
  { id: 's-9-1', nis: '202609001', name: 'Abdul Karim Fauzi', class: '10', parentName: 'Wali Abdul Karim', parentPhone: '08120000901', accessPin: '852934', academicYear: '2026/2027' },
  { id: 's-9-10', nis: '202609010', name: 'Imam Fauzi Permana', class: '10', parentName: 'Wali Imam F', parentPhone: '08120000910', accessPin: '592817', academicYear: '2026/2027' },
  { id: 's-9-11', nis: '202609011', name: 'Kenzie Alessandro Al Fayyad', class: '10', parentName: 'Wali Kenzie', parentPhone: '08120000911', accessPin: '348195', academicYear: '2026/2027' },
  { id: 's-9-12', nis: '202609012', name: 'Malvin Khairul Azam', class: '10', parentName: 'Wali Malvin', parentPhone: '08120000912', accessPin: '716394', academicYear: '2026/2027' },
  { id: 's-9-13', nis: '202609013', name: 'Muhammad Asyraful Anam', class: '10', parentName: 'Wali Asyraful', parentPhone: '08120000913', accessPin: '284951', academicYear: '2026/2027' },
  { id: 's-9-14', nis: '202609014', name: 'Muhammad Azka As Shiddiq', class: '10', parentName: 'Wali Azka', parentPhone: '08120000914', accessPin: '953827', academicYear: '2026/2027' },
  { id: 's-9-15', nis: '202609015', name: 'Muhammad Fatih Al-Atsari', class: '10', parentName: 'Wali Fatih A', parentPhone: '08120000915', accessPin: '418269', academicYear: '2026/2027' },
  { id: 's-9-16', nis: '202609016', name: 'Muhammad Hafizh Fathurrizky', class: '10', parentName: 'Wali Hafizh F', parentPhone: '08120000916', accessPin: '674913', academicYear: '2026/2027' },
  { id: 's-9-17', nis: '202609017', name: 'Muhammad Khoirul Azam', class: '10', parentName: 'Wali Khoirul A', parentPhone: '08120000917', accessPin: '192847', academicYear: '2026/2027' },
  { id: 's-9-2', nis: '202609002', name: 'Abdurrahman', class: '10', parentName: 'Wali Abdurrahman', parentPhone: '08120000902', accessPin: '317495', academicYear: '2026/2027' },
  { id: 's-9-3', nis: '202609003', name: 'Adam Muzaman Sasih', class: '10', parentName: 'Wali Adam M', parentPhone: '08120000903', accessPin: '794182', academicYear: '2026/2027' },
  { id: 's-9-4', nis: '202609004', name: 'Bintang Riza Swid', class: '10', parentName: 'Wali Bintang', parentPhone: '08120000904', accessPin: '268519', academicYear: '2026/2027' },
  { id: 's-9-5', nis: '202609005', name: 'Dimas Rayhaan Pratama', class: '10', parentName: 'Wali Dimas', parentPhone: '08120000905', accessPin: '941728', academicYear: '2026/2027' },
  { id: 's-9-6', nis: '202609006', name: 'Eurico Deka Ramadhan', class: '10', parentName: 'Wali Eurico', parentPhone: '08120000906', accessPin: '483915', academicYear: '2026/2027' },
  { id: 's-9-7', nis: '202609007', name: 'Fabiyan Agzamiyuki Putra Dermawan', class: '10', parentName: 'Wali Fabiyan', parentPhone: '08120000907', accessPin: '629471', academicYear: '2026/2027' },
  { id: 's-9-8', nis: '202609008', name: 'Farizki Restu Nugroho', class: '10', parentName: 'Wali Farizki', parentPhone: '08120000908', accessPin: '175384', academicYear: '2026/2027' },
  { id: 's-9-9', nis: '202609009', name: 'Hanania Abdi Dzil Ikram', class: '10', parentName: 'Wali Hanania', parentPhone: '08120000909', accessPin: '839426', academicYear: '2026/2027' },
];

export const INITIAL_RECORDS: PointRecord[] = [
  // --- KELAS 7 RECORDS ---
  { id: 'rec-7-1a', santriId: 's-7-1', santriName: 'Afkar Syaddad Safaraz', santriNis: '202607001', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-1b', santriId: 's-7-1', santriName: 'Afkar Syaddad Safaraz', santriNis: '202607001', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & Pembinaan', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-1c', santriId: 's-7-1', santriName: 'Afkar Syaddad Safaraz', santriNis: '202607001', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-15', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-2a', santriId: 's-7-2', santriName: 'Ahmad Fauzan', santriNis: '202607002', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-2b', santriId: 's-7-2', santriName: 'Ahmad Fauzan', santriNis: '202607002', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-14', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-3a', santriId: 's-7-3', santriName: 'Ahmad Labib Fauzan', santriNis: '202607003', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 10, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-4a', santriId: 's-7-4', santriName: 'Ahmad Rayyan Maulana Hasan', santriNis: '202607004', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Poin Plus Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-4b', santriId: 's-7-4', santriName: 'Ahmad Rayyan Maulana Hasan', santriNis: '202607004', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-4c', santriId: 's-7-4', santriName: 'Ahmad Rayyan Maulana Hasan', santriNis: '202607004', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', points: -5, date: '2026-06-13', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Ganti seragam', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-4d', santriId: 's-7-4', santriName: 'Ahmad Rayyan Maulana Hasan', santriNis: '202607004', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', points: -5, date: '2026-06-14', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Puskes & rapi pakaian', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-4e', santriId: 's-7-4', santriName: 'Ahmad Rayyan Maulana Hasan', santriNis: '202607004', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-16', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-5a', santriId: 's-7-5', santriName: 'Amru Fauzi Hasibuan', santriNis: '202607005', type: 'Kebaikan', category: 'Ringan', title: '3b - Ranking 5 besar SMP / 3 besar SMA', points: 10, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Prestasi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-5b', santriId: 's-7-5', santriName: 'Amru Fauzi Hasibuan', santriNis: '202607005', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Apresiasi Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-5c', santriId: 's-7-5', santriName: 'Amru Fauzi Hasibuan', santriNis: '202607005', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-6a', santriId: 's-7-6', santriName: 'Andi Umar Abdul Aziz', santriNis: '202607006', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 5, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Apresiasi Tasmi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-6b', santriId: 's-7-6', santriName: 'Andi Umar Abdul Aziz', santriNis: '202607006', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & SP1', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-6c', santriId: 's-7-6', santriName: 'Andi Umar Abdul Aziz', santriNis: '202607006', type: 'Pelanggaran', category: 'Sedang', title: '12a - Membuat kegaduhan atau keributan', points: -10, date: '2026-06-14', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-7a', santriId: 's-7-7', santriName: 'Daffa Primo Desantyo', santriNis: '202607007', type: 'Kebaikan', category: 'Berat', title: '10b - Ranking 1 Kelas', points: 50, date: '2026-06-01', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Trofi & Beasiswa Prestasi', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-8a', santriId: 's-7-8', santriName: 'Evandra Khalfani Nugraha', santriNis: '202607008', type: 'Kebaikan', category: 'Berat', title: '10b - Ranking 1 Kelas', points: 25, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Trofi Prestasi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-8b', santriId: 's-7-8', santriName: 'Evandra Khalfani Nugraha', santriNis: '202607008', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-9a', santriId: 's-7-9', santriName: 'Faizha Malika Ar Razzaq', santriNis: '202607009', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & Pembinaan', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-7-10a', santriId: 's-7-10', santriName: 'Fakhri Bahtiar Arsad', santriNis: '202607010', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-11a', santriId: 's-7-11', santriName: 'Fakhri Maulana Ashadi', santriNis: '202607011', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-11b', santriId: 's-7-11', santriName: 'Fakhri Maulana Ashadi', santriNis: '202607011', type: 'Pelanggaran', category: 'Berat', title: '23a - Mengajak santri lain melakukan pelanggaran', points: -25, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP1 & Panggilan Wali', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-7-13a', santriId: 's-7-13', santriName: 'Fatih Rasyid Chairullah', santriNis: '202607013', type: 'Pelanggaran', category: 'Berat', title: '23a - Mengajak santri lain melakukan pelanggaran', points: -35, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP2 & Pembinaan Kesiswaan', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-13b', santriId: 's-7-13', santriName: 'Fatih Rasyid Chairullah', santriNis: '202607013', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -25, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-7-13c', santriId: 's-7-13', santriName: 'Fatih Rasyid Chairullah', santriNis: '202607013', type: 'Pelanggaran', category: 'Sedang', title: '12a - Membuat kegaduhan atau keributan', points: -10, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-7-13d', santriId: 's-7-13', santriName: 'Fatih Rasyid Chairullah', santriNis: '202607013', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-14', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-14a', santriId: 's-7-14', santriName: 'Ghaisa Aulia Rahman', santriNis: '202607014', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & Teguran', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-7-15a', santriId: 's-7-15', santriName: 'Hudzaifah Fawwaz', santriNis: '202607015', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-16a', santriId: 's-7-16', santriName: 'Ibnu Habibi Achmad', santriNis: '202607016', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-17a', santriId: 's-7-17', santriName: 'Ibrahim khalid', santriNis: '202607017', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-18a', santriId: 's-7-18', santriName: 'Mikael ardsy as sakha', santriNis: '202607018', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-19a', santriId: 's-7-19', santriName: 'Muhammad', santriNis: '202607019', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-23a', santriId: 's-7-23', santriName: 'Musa Widiyanto', santriNis: '202607023', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-24a', santriId: 's-7-24', santriName: 'Naufal Ibrahim Ali', santriNis: '202607024', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 15, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-25a', santriId: 's-7-25', santriName: 'Rafiqi zulmi arifin', santriNis: '202607025', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-7-26a', santriId: 's-7-26', santriName: 'Rayyan Kurnia Yusuf Abdillah', santriNis: '202607026', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-7-27a', santriId: 's-7-27', santriName: 'Sa\'id Al fajri', santriNis: '202607027', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 15, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-28a', santriId: 's-7-28', santriName: 'Umar Abdullah Hanif', santriNis: '202607028', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-7-29a', santriId: 's-7-29', santriName: 'Zahka Al Zahkila', santriNis: '202607029', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -15, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  // --- KELAS 8 RECORDS ---
  { id: 'rec-8-1a', santriId: 's-8-1', santriName: 'Abdullah Fulvian Fulca', santriNis: '202608001', type: 'Kebaikan', category: 'Sedang', title: '5b - Mengikuti pengambilan sanad matan', points: 20, date: '2026-06-01', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Sanad Matan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-2a', santriId: 's-8-2', santriName: 'Abdullah Musyaffa Ali', santriNis: '202608002', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -20, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & SP1', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-8-2b', santriId: 's-8-2', santriName: 'Abdullah Musyaffa Ali', santriNis: '202608002', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', points: -5, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Ganti seragam', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-2c', santriId: 's-8-2', santriName: 'Abdullah Musyaffa Ali', santriNis: '202608002', type: 'Pelanggaran', category: 'Sedang', title: '13a - Mengeluarkan kata kotor lisan/tulisan', points: -10, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Tulis istighfar 100x', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-2d', santriId: 's-8-2', santriName: 'Abdullah Musyaffa Ali', santriNis: '202608002', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-14', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-3a', santriId: 's-8-3', santriName: 'Adam Sinatrya Suwardoyo', santriNis: '202608003', type: 'Pelanggaran', category: 'Ringan', title: '24a - Nilai mufrodat di bawah KKM', points: -5, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Remedial Mufrodat', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-5a', santriId: 's-8-5', santriName: 'Akram Abdul Hakim', santriNis: '202608005', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-6a', santriId: 's-8-6', santriName: 'Azhar Farid Mumtaz Islam', santriNis: '202608006', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-7a', santriId: 's-8-7', santriName: 'Azmi Hafizh Rabbani', santriNis: '202608007', type: 'Kebaikan', category: 'Sedang', title: '6b - Juara lomba internal ma\'had', points: 15, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Penghargaan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-8a', santriId: 's-8-8', santriName: 'Azzam Hudzaifah Al Jauzi', santriNis: '202608008', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -25, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Skorsing & Piket', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-9a', santriId: 's-8-9', santriName: 'Danish Akbar Al-Ghazi', santriNis: '202608009', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-10a', santriId: 's-8-10', santriName: 'Fadil Aryo Pratomo', santriNis: '202608010', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-10b', santriId: 's-8-10', santriName: 'Fadil Aryo Pratomo', santriNis: '202608010', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', points: -5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Ganti seragam', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-10c', santriId: 's-8-10', santriName: 'Fadil Aryo Pratomo', santriNis: '202608010', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -20, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket Kebersihan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-10d', santriId: 's-8-10', santriName: 'Fadil Aryo Pratomo', santriNis: '202608010', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -20, date: '2026-06-13', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP1 & Panggilan Wali', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-12a', santriId: 's-8-12', santriName: 'Fayi Al Muyassar Syafiq', santriNis: '202608012', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-14a', santriId: 's-8-14', santriName: 'Jawad Al Ghifary', santriNis: '202608014', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -15, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket Kebersihan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-16a', santriId: 's-8-16', santriName: 'Kantasasmita Indraputra', santriNis: '202608016', type: 'Kebaikan', category: 'Berat', title: '9b - Lulus Tasmi 5 juz sekali duduk', points: 25, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 5 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-17a', santriId: 's-8-17', santriName: 'Miqdaad Bihaaru Mafaazan', santriNis: '202608017', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-20a', santriId: 's-8-20', santriName: 'Muhammad Althaf Amran', santriNis: '202608020', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-21a', santriId: 's-8-21', santriName: 'Muhammad Kholid Firmansyah', santriNis: '202608021', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -15, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-21b', santriId: 's-8-21', santriName: 'Muhammad Kholid Firmansyah', santriNis: '202608021', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -20, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP1 & Panggilan Wali', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-26a', santriId: 's-8-26', santriName: 'Nekta Ranu Khairan', santriNis: '202608026', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-26b', santriId: 's-8-26', santriName: 'Nekta Ranu Khairan', santriNis: '202608026', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Merapikan kelas', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-28a', santriId: 's-8-28', santriName: 'Umar Abdulloh', santriNis: '202608028', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-28b', santriId: 's-8-28', santriName: 'Umar Abdulloh', santriNis: '202608028', type: 'Kebaikan', category: 'Ringan', title: '3b - Ranking 5 besar SMP / 3 besar SMA', points: 5, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Prestasi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-28c', santriId: 's-8-28', santriName: 'Umar Abdulloh', santriNis: '202608028', type: 'Pelanggaran', category: 'Berat', title: '22a - Tasyabbuh (qoza, nonton bioskop, dll)', points: -50, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Cukur rapi & SP2', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-8-29a', santriId: 's-8-29', santriName: 'Wisnu Abimanyu Hendarto', santriNis: '202608029', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Apresiasi Tasmi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-8-29b', santriId: 's-8-29', santriName: 'Wisnu Abimanyu Hendarto', santriNis: '202608029', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-8-30a', santriId: 's-8-30', santriName: 'Zaid Muizzuddin Rhamdany', santriNis: '202608030', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  // --- KELAS 9 RECORDS ---
  { id: 'rec-9-1a', santriId: 's-9-1', santriName: 'Abdul Karim Fauzi', santriNis: '202609001', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-3a', santriId: 's-9-3', santriName: 'Adam Muzaman Sasih', santriNis: '202609003', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -20, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },
  { id: 'rec-9-3b', santriId: 's-9-3', santriName: 'Adam Muzaman Sasih', santriNis: '202609003', type: 'Pelanggaran', category: 'Berat', title: '20a - Menolak sanksi / tidak sopan pada guru', points: -25, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP2 & Panggilan Wali', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-9-4a', santriId: 's-9-4', santriName: 'Bintang Riza Swid', santriNis: '202609004', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-5a', santriId: 's-9-5', santriName: 'Dimas Rayhaan Pratama', santriNis: '202609005', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-6a', santriId: 's-9-6', santriName: 'Eurico Deka Ramadhan', santriNis: '202609006', type: 'Kebaikan', category: 'Sedang', title: '6b - Juara lomba internal ma\'had', points: 15, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Penghargaan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-7a', santriId: 's-9-7', santriName: 'Fabiyan Agzamiyuki Putra Dermawan', santriNis: '202609007', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -20, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang & Pembinaan', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-9-8a', santriId: 's-9-8', santriName: 'Farizki Restu Nugroho', santriNis: '202609008', type: 'Kebaikan', category: 'Sedang', title: '6b - Juara lomba internal ma\'had', points: 15, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Penghargaan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-10a', santriId: 's-9-10', santriName: 'Imam Fauzi Permana', santriNis: '202609010', type: 'Pelanggaran', category: 'Sedang', title: '12a - Membuat kegaduhan atau keributan', points: -10, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-11a', santriId: 's-9-11', santriName: 'Kenzie Alessandro Al Fayyad', santriNis: '202609011', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-13a', santriId: 's-9-13', santriName: 'Muhammad Asyraful Anam', santriNis: '202609013', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-13b', santriId: 's-9-13', santriName: 'Muhammad Asyraful Anam', santriNis: '202609013', type: 'Pelanggaran', category: 'Sedang', title: '13a - Mengeluarkan kata kotor lisan/tulisan', points: -10, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Tulis istighfar 100x', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-13c', santriId: 's-9-13', santriName: 'Muhammad Asyraful Anam', santriNis: '202609013', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Merapikan kelas', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-13d', santriId: 's-9-13', santriName: 'Muhammad Asyraful Anam', santriNis: '202609013', type: 'Pelanggaran', category: 'Ringan', title: '2a - Berada di kamar saat KBM', points: -5, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Resume materi', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-14a', santriId: 's-9-14', santriName: 'Muhammad Azka As Shiddiq', santriNis: '202609014', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-14b', santriId: 's-9-14', santriName: 'Muhammad Azka As Shiddiq', santriNis: '202609014', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-18a', santriId: 's-9-18', santriName: 'Muhammad Nashri Alzaqi', santriNis: '202609018', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-18b', santriId: 's-9-18', santriName: 'Muhammad Nashri Alzaqi', santriNis: '202609018', type: 'Pelanggaran', category: 'Berat', title: '22a - Tasyabbuh (qoza, nonton bioskop, dll)', points: -20, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Cukur rapi & SP1', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-9-19a', santriId: 's-9-19', santriName: 'Muhammad Ramadhan', santriNis: '202609019', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-19b', santriId: 's-9-19', santriName: 'Muhammad Ramadhan', santriNis: '202609019', type: 'Pelanggaran', category: 'Ringan', title: '2a - Berada di kamar saat KBM', points: -5, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Resume materi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-19c', santriId: 's-9-19', santriName: 'Muhammad Ramadhan', santriNis: '202609019', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -10, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Merapikan kelas', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-19d', santriId: 's-9-19', santriName: 'Muhammad Ramadhan', santriNis: '202609019', type: 'Pelanggaran', category: 'Ringan', title: '5a - Tidak memakai seragam/sepatu yang telah ditentukan', points: -5, date: '2026-06-13', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Ganti seragam', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-20a', santriId: 's-9-20', santriName: 'Muhammad Rayyan Putra Garsya', santriNis: '202609020', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-21a', santriId: 's-9-21', santriName: 'Muhammad Reza Wibowo', santriNis: '202609021', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Apresiasi Tasmi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-21b', santriId: 's-9-21', santriName: 'Muhammad Reza Wibowo', santriNis: '202609021', type: 'Pelanggaran', category: 'Berat', title: '21a - Menerima & menyimpan barang terlarang', points: -20, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sita barang terlarang', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-9-23a', santriId: 's-9-23', santriName: 'Muhammad Yusuf', santriNis: '202609023', type: 'Pelanggaran', category: 'Sedang', title: '15a - Keluar dari lingkungan ma\'had tanpa izin', points: -15, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-24a', santriId: 's-9-24', santriName: 'Muhammad Zahid Keandra', santriNis: '202609024', type: 'Kebaikan', category: 'Sedang', title: '5b - Mengikuti pengambilan sanad matan', points: 20, date: '2026-06-01', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Sanad', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-25a', santriId: 's-9-25', santriName: 'Musa', santriNis: '202609025', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 1 Juz', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-27a', santriId: 's-9-27', santriName: 'Qais Abdel Rasheed', santriNis: '202609027', type: 'Kebaikan', category: 'Berat', title: '11b - Juara lomba eksternal ma\'had', points: 35, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Juara & Uang Pembinaan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-28a', santriId: 's-9-28', santriName: 'Raka Barru Arviputra', santriNis: '202609028', type: 'Kebaikan', category: 'Berat', title: '9b - Lulus Tasmi 5 juz sekali duduk', points: 25, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Tasmi 5 Juz', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-28b', santriId: 's-9-28', santriName: 'Raka Barru Arviputra', santriNis: '202609028', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-9-29a', santriId: 's-9-29', santriName: 'Rasyad Sidqi', santriNis: '202609029', type: 'Kebaikan', category: 'Ringan', title: '1b - Lulus Tasmi 1 juz sekali duduk', points: 10, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Apresiasi Tasmi', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-9-29b', santriId: 's-9-29', santriName: 'Rasyad Sidqi', santriNis: '202609029', type: 'Pelanggaran', category: 'Berat', title: '20a - Menolak sanksi / tidak sopan pada guru', points: -25, date: '2026-06-10', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'SP1 & Panggilan Wali', recordedBy: 'Ust. Kesiswaan', isHeavyViolation: true },

  { id: 'rec-9-31a', santriId: 's-9-31', santriName: 'Rabani Asryad Haidar', santriNis: '202609031', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-11', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  // --- KELAS 10 RECORDS ---
  { id: 'rec-10-1a', santriId: 's-10-1', santriName: 'Abdullah Azzam Fakhruddin', santriNis: '202610001', type: 'Kebaikan', category: 'Sedang', title: '5b - Mengikuti pengambilan sanad matan', points: 20, date: '2026-06-01', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Sanad', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-4a', santriId: 's-10-4', santriName: 'Arrazaqku huga niranta', santriNis: '202610004', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-6a', santriId: 's-10-6', santriName: 'Fathan Almaisan Zhafar', santriNis: '202610006', type: 'Kebaikan', category: 'Sedang', title: '5b - Mengikuti pengambilan sanad matan', points: 20, date: '2026-06-02', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Sertifikat Sanad', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-7a', santriId: 's-10-7', santriName: 'Fayaz Ibrahimovic', santriNis: '202610007', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-03', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Poin Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-7b', santriId: 's-10-7', santriName: 'Fayaz Ibrahimovic', santriNis: '202610007', type: 'Pelanggaran', category: 'Sedang', title: '10a - Mangkir dari pemanggilan resmi ustadz', points: -10, date: '2026-06-06', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piket kebersihan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-7c', santriId: 's-10-7', santriName: 'Fayaz Ibrahimovic', santriNis: '202610007', type: 'Pelanggaran', category: 'Ringan', title: '3a - Mewarnai, menyemir rambut', points: -5, date: '2026-06-09', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Rambut dihitamkan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-7d', santriId: 's-10-7', santriName: 'Fayaz Ibrahimovic', santriNis: '202610007', type: 'Pelanggaran', category: 'Ringan', title: '1a - Datang terlambat ke kelas', points: -5, date: '2026-06-12', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-10a', santriId: 's-10-10', santriName: 'Muhammad Althaf Zaidan', santriNis: '202610010', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-10b', santriId: 's-10-10', santriName: 'Muhammad Althaf Zaidan', santriNis: '202610010', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-11a', santriId: 's-10-11', santriName: 'Muhammad Emir Azka Lubis', santriNis: '202610011', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-04', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-11b', santriId: 's-10-11', santriName: 'Muhammad Emir Azka Lubis', santriNis: '202610011', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-08', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-12a', santriId: 's-10-12', santriName: 'Muhammad Syamil', santriNis: '202610012', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-14a', santriId: 's-10-14', santriName: 'Rafkha Al Fakhri', santriNis: '202610014', type: 'Kebaikan', category: 'Berat', title: '11b - Juara lomba eksternal ma\'had', points: 40, date: '2026-06-01', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Piagam Juara', recordedBy: 'Ust. Kesiswaan' },
  { id: 'rec-10-14b', santriId: 's-10-14', santriName: 'Rafkha Al Fakhri', santriNis: '202610014', type: 'Pelanggaran', category: 'Ringan', title: '#a - Catatan Pelanggaran Disiplin Umum', points: -5, date: '2026-06-07', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Teguran lisan', recordedBy: 'Ust. Kesiswaan' },

  { id: 'rec-10-15a', santriId: 's-10-15', santriName: 'Zahir', santriNis: '202610015', type: 'Kebaikan', category: 'Ringan', title: '2b - Apresiasi Keaktifan / Kebaikan Santri', points: 5, date: '2026-06-05', academicYear: '2026/2027', semester: 'Ganjil', punishmentOrReward: 'Catatan Keaktifan', recordedBy: 'Ust. Kesiswaan' }
];

export const INITIAL_BK_NOTES: BKCounselingNote[] = [
  {
    id: 'bk-sample-1',
    santriId: 's-10-7',
    santriName: 'Fayaz Ibrahimovic',
    santriClass: '10',
    santriNis: '202610007',
    sessionDate: '2026-06-14',
    counselorName: 'Ust. Abdul Kodir (Guru BK & Kesiswaan)',
    counselingType: 'Kedisiplinan & Tata Tertib',
    urgencyLevel: 'Tinggi',
    problemDescription: 'Santri terakumulasi beberapa pelanggaran disiplin (terlambat kelas, mewarnai rambut, mangkir dari pemanggilan ustadz). Menunjukkan resistensi awal saat ditegur.',
    counselingNotes: 'Dilakukan pendekatan konseling individual secara empatik namun tegas. Digali akar masalah: santri merasa jenuh dengan rutinitas sekolah dan mengalami kesulitan manajemen waktu tidur di malam hari. Diberikan pemahaman mengenai adab tholabul ilmi dan pentingnya keteladanan santri tingkat MA/SMA.',
    studentCommitment: 'Santri mengakui kekhilafannya, berjanji tidur tepat waktu pukul 22.00, segera menghitamkan kembali warna rambutnya, dan siap mematuhi jadwal piket serta panggilan ustadz.',
    actionPlan: '1. Jadwal pendampingan bangun pagi bersama wali kelas & pembina sekolah.\n2. Laporan mingguan kartu kendali disiplin ke Guru BK.\n3. Evaluasi berkala sebelum rapat evaluasi semester.',
    followUpDate: '2026-06-28',
    status: 'Dalam Pantauan',
    semester: 'Ganjil',
    academicYear: '2026/2027',
    isPrivate: true,
    aiAnalysis: {
      summaryText: 'Konseling kedisiplinan terkait penurunan motivasi kepatuhan tata tertib akibat kejenuhan rutinitas dan ritme tidur tidak teratur. Santri bersikap kooperatif setelah dialog terarah.',
      psychologicalFactors: 'Faktor pemicu utama adalah kejenuhan adaptasi fase remaja dan peer-influence dalam penampilan fisik (rambut), bukan motif agresi atau perlawanan institusional.',
      evaluationReportSnippet: 'Ananda Fayaz Ibrahimovic menunjukkan dinamika fluktuasi kedisiplinan di awal semester, namun responsif terhadap bimbingan konseling individual dan berkomitmen memperbaiki ritme belajar serta kepatuhan tata tertib sekolah.',
      followUpRecommendations: [
        'Koordinasi dengan wali kelas dan pembina sekolah untuk memantau ritme belajar santri.',
        'Pemberian ruang peran positif di kepengurusan kelas/OSIS untuk menyalurkan energi kepemimpinan.',
        'Pemeriksaan rutin kartu kendali disiplin setiap hari Jumat.'
      ],
      generatedAt: '2026-06-14T10:30:00Z'
    },
    createdAt: '2026-06-14T10:30:00Z',
    updatedAt: '2026-06-14T10:30:00Z'
  },
  {
    id: 'bk-sample-2',
    santriId: 's-7-1',
    santriName: 'Afkar Syaddad Safaraz',
    santriClass: '7',
    santriNis: '202607001',
    sessionDate: '2026-06-10',
    counselorName: 'Ust. Abdul Kodir (Guru BK & Kesiswaan)',
    counselingType: 'Keluarga & Adaptasi Sekolah',
    urgencyLevel: 'Sedang',
    problemDescription: 'Siswa baru kelas 7 mengalami masa adaptasi awal dan sering menyendiri di jam istirahat sekolah.',
    counselingNotes: 'Sesi konseling suportif. Mendengarkan curahan hati ananda. Diberikan afirmasi positif, pengenalan teman sebaya yang aktif, dan penguatan mental kemandirian di sekolah Al Fajar Islamic School.',
    studentCommitment: 'Siswa bersedia ikut kegiatan ekstrakurikuler dan olahraga bersama teman sebaya.',
    actionPlan: 'Dihubungkan dengan mentor siswa senior kelas 9 untuk pendampingan adaptasi sosial.',
    followUpDate: '2026-06-20',
    status: 'Progres Membaik',
    semester: 'Ganjil',
    academicYear: '2026/2027',
    isPrivate: true,
    aiAnalysis: {
      summaryText: 'Proses adaptasi transisi awal sekolah (penyesuaian diri). Memerlukan stimulasi kegiatan sosial dan lingkungan pertemanan positif.',
      psychologicalFactors: 'Fase penyesuaian diri wajar bagi siswa baru jenjang SMP yang berada dalam lingkungan baru di Al Fajar Islamic School.',
      evaluationReportSnippet: 'Ananda Afkar Syaddad Safaraz tengah berada dalam proses adaptasi kemandirian sekolah dengan progres adaptasi sosial yang semakin positif pasca pendampingan bimbingan konseling.',
      followUpRecommendations: [
        'Pantau keaktifan ananda dalam kegiatan kelompok santri.',
        'Komunikasi berkala dengan wali santri saat jadwal kunjungan resmi untuk memberikan dukungan moril.'
      ],
      generatedAt: '2026-06-10T09:00:00Z'
    },
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-10T09:00:00Z'
  }
];

export const INITIAL_BK_SCHEDULES: BKRoutineSchedule[] = [
  {
    id: 'bks-1',
    santriId: 's-7-1',
    santriName: 'Afkar Syaddad Safaraz',
    santriClass: '7',
    santriNis: '202607001',
    scheduledDate: '2026-09-03',
    scheduledTime: '12:30 - 13:00 (Istirahat Siang)',
    sessionFocus: 'Check-in Rutin Kesejahteraan Belajar Full Day',
    counselorName: 'Guru BK & Kesiswaan',
    location: 'Ruang Bimbingan Konseling',
    status: 'Menunggu Giliran',
    notes: 'Jadwal rutin giliran pekan pertama. Pemantauan kenyamanan belajar seharian dan pertemanan kelas.',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bks-2',
    santriId: 's-10-7',
    santriName: 'Fayaz Ibrahimovic',
    santriClass: '10',
    santriNis: '202610007',
    scheduledDate: '2026-09-04',
    scheduledTime: '15:30 - 16:00 (Selesai KBM Full Day)',
    sessionFocus: 'Konsultasi Minat, Bakat & Studi Lanjut',
    counselorName: 'Guru BK & Kesiswaan',
    location: 'Ruang Bimbingan Konseling',
    status: 'Menunggu Giliran',
    notes: 'Pemetaan minat jurusan saintek/soshum dan pembagian waktu kegiatan ekstrakurikuler sore.',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bks-3',
    santriId: 's-10-15',
    santriName: 'Zahir',
    santriClass: '10',
    santriNis: '202610015',
    scheduledDate: '2026-09-05',
    scheduledTime: '09:45 - 10:15 (Istirahat Ke-1)',
    sessionFocus: 'Bimbingan Rutin Berkala / Check-in Kesejahteraan Siswa',
    counselorName: 'Guru BK & Kesiswaan',
    location: 'Ruang Bimbingan Konseling',
    status: 'Menunggu Giliran',
    notes: 'Check-in berkala keaktifan belajar full day dan manajemen tugas sekolah.',
    createdAt: '2026-09-01T08:00:00Z'
  }
];
