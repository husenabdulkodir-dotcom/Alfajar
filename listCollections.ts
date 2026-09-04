import { ekskulDb } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function listAll() {
  const testCols = [
    'students', 'clubs', 'activities', 'attendance', 'payments', 'transactions', 'ekskul', 'pembayaran', 'users', 'coaches', 'data_ekskul', 'santri'
  ];

  for (const c of testCols) {
    try {
      const snap = await getDocs(collection(ekskulDb, c));
      if (snap.size > 0) {
        console.log(`COLLECTION: "${c}" (${snap.size} docs)`);
        snap.docs.slice(0, 3).forEach(d => {
          console.log(`  Sample doc:`, JSON.stringify(d.data()));
        });
      }
    } catch(e: any) {
      console.log(`Error on "${c}":`, e.message);
    }
  }
  process.exit(0);
}
listAll();
