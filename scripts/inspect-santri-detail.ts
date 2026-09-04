import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function inspect() {
  const resetSnap = await getDocs(collection(db, 'resetLogs'));
  console.log(`RESET LOGS COUNT: ${resetSnap.size}`);
  resetSnap.forEach(d => console.log('RESET LOG:', JSON.stringify(d.data())));

  const santriSnap = await getDocs(collection(db, 'santri'));
  const all: any[] = [];
  santriSnap.forEach(d => all.push({ docId: d.id, ...d.data() }));

  // Print all santri where class is 10 or 11
  console.log('\n--- ALL SANTRI IN CLASS 11 ---');
  all.filter(s => String(s.class) === '11').forEach(s => {
    console.log(`[11] id:${s.id} docId:${s.docId} nis:${s.nis} name:${s.name} role:${s.organizationRole}`);
  });

  console.log('\n--- ALL SANTRI IN CLASS 10 ---');
  all.filter(s => String(s.class) === '10').forEach(s => {
    console.log(`[10] id:${s.id} docId:${s.docId} nis:${s.nis} name:${s.name} role:${s.organizationRole}`);
  });

  console.log('\n--- ALL SANTRI IN CLASS 8 ---');
  console.log(`Count class 8: ${all.filter(s => String(s.class) === '8').length}`);

  console.log('\n--- ALL SANTRI IN CLASS 9 ---');
  console.log(`Count class 9: ${all.filter(s => String(s.class) === '9').length}`);

  console.log('\n--- ALL SANTRI IN CLASS 7 ---');
  console.log(`Count class 7: ${all.filter(s => String(s.class) === '7').length}`);

  // Let's check how many santri have 's-imp-' IDs
  const imp = all.filter(s => s.id?.startsWith('s-imp-'));
  console.log(`Santri with s-imp- IDs: ${imp.length}`);
  imp.forEach(s => console.log(`  s-imp: id:${s.id} name:${s.name} class:${s.class} role:${s.organizationRole}`));

  process.exit(0);
}

inspect().catch(e => {
  console.error(e);
  process.exit(1);
});
