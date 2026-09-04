import { ekskulDb } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function scan() {
  const possibleCollections = [
    'data_ekskul',
    'ekskul',
    'ekstrakurikuler',
    'data_ekstrakurikuler',
    'dataEkskul',
    'santri_ekskul',
    'pembayaran_ekskul',
    'kegiatan_ekskul',
    'ekskulRecords',
    'pembayaran',
    'santri',
    'siswa',
    'students',
    'activities',
    'nilai_ekskul',
    'presensi_ekskul',
    'absensi_ekskul',
    'kas_ekskul'
  ];

  console.log('--- SCANNING FIRESTORE COLLECTIONS in sistem-kesiswaan-b68a0 ---');
  let foundAny = false;
  for (const col of possibleCollections) {
    try {
      const snap = await getDocs(collection(ekskulDb, col));
      if (snap.size > 0) {
        foundAny = true;
        console.log(`\n>>> FOUND COLLECTION: [${col}] (${snap.size} documents)`);
        snap.forEach(d => {
          console.log(`  [Doc ID: ${d.id}]:`, JSON.stringify(d.data()));
        });
      }
    } catch(e: any) {
      console.log(`Error checking [${col}]:`, e.message);
    }
  }

  if (!foundAny) {
    console.log('\nResult: All tested collection names returned 0 documents or are empty in Firestore.');
  }
  process.exit(0);
}

scan();
