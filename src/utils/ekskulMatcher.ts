const STOP_WORDS = new Set(['bin', 'binti', 'putra', 'putri']);
const nameCache = new Map<string, string>();

export function cleanName(name: string): string {
  if (!name) return '';
  const hit = nameCache.get(name);
  if (hit !== undefined) return hit;

  const res = name
    .toLowerCase()
    .replace(/^m\.\s*/i, 'muhammad ')
    .replace(/\bm\.\s*/i, 'muhammad ')
    .replace(/^moch\.\s*/i, 'mochamad ')
    .replace(/^mohd\.\s*/i, 'muhammad ')
    .replace(/^muh\.\s*/i, 'muhammad ')
    .replace(/al\s+/g, 'al') // normalize al khalifi -> alkhalifi, al fatih -> alfatih
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  nameCache.set(name, res);
  return res;
}

export function isSantriEkskulMatch(
  itemA: { id?: string; name?: string; santriName?: string; nis?: string; nisn?: string; santriId?: string } | null | undefined,
  itemB: { id?: string; name?: string; santriName?: string; nis?: string; nisn?: string; santriId?: string } | null | undefined
): boolean {
  if (!itemA || !itemB) return false;

  // 1. Direct ID matching (santriId to id, or id to id)
  if (itemA.santriId && itemB.id && itemA.santriId === itemB.id) return true;
  if (itemB.santriId && itemA.id && itemB.santriId === itemA.id) return true;
  if (itemA.id && itemB.id && itemA.id === itemB.id) return true;

  // 2. Direct NIS / NISN exact match (length >= 5, not '-')
  const nisA = (itemA.nisn || itemA.nis || '').trim();
  const nisB = (itemB.nisn || itemB.nis || '').trim();

  if (nisA && nisB && nisA !== '-' && nisB !== '-' && nisA.length >= 5 && nisB.length >= 5) {
    if (nisA === nisB) {
      return true;
    }
  }

  // 3. Name matching
  const rawA = itemA.santriName || itemA.name || '';
  const rawB = itemB.santriName || itemB.name || '';
  const nameA = cleanName(rawA);
  const nameB = cleanName(rawB);

  if (!nameA || !nameB) return false;
  if (nameA === nameB) return true;

  // Double-letter reduction (e.g. musyaffa vs musyafa, fawwaz vs fawaz)
  const redA = nameA.replace(/(.)\1+/g, '$1');
  const redB = nameB.replace(/(.)\1+/g, '$1');
  if (redA === redB) return true;

  // Known typos
  if (nameA.replace('iskdar', 'iskandar') === nameB.replace('iskdar', 'iskandar')) return true;

  const wordsA = nameA.split(' ').filter(w => w.length > 0);
  const wordsB = nameB.split(' ').filter(w => w.length > 0);

  // Exact set of words match (e.g. "Muhammad Abdullah Azzam Yusuf" vs "Muhammad Abdullah Yusuf Azzam")
  if (wordsA.length >= 2 && wordsB.length >= 2 && wordsA.length === wordsB.length) {
    const sortedA = [...wordsA].sort().join(' ');
    const sortedB = [...wordsB].sort().join(' ');
    if (sortedA === sortedB) return true;
    
    // With double letter reduction
    const sortedRedA = wordsA.map(w => w.replace(/(.)\1+/g, '$1')).sort().join(' ');
    const sortedRedB = wordsB.map(w => w.replace(/(.)\1+/g, '$1')).sort().join(' ');
    if (sortedRedA === sortedRedB) return true;
  }

  // Prefix matching with single initial or trailing surname:
  // e.g. "Andi Barra L" vs "Andi Barra Latafat"
  // e.g. "Muhammad Wildan Putra" vs "Muhammad Wildan Putra Hariyadi"
  // e.g. "Ahmad Rayyan" vs "Ahmad Rayyan Maulana Hasan"
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    const minWords = wordsA.length < wordsB.length ? wordsA : wordsB;
    const maxWords = wordsA.length >= wordsB.length ? wordsA : wordsB;

    // The FIRST word MUST match exactly (to prevent "Umar Abdullah Hanif" matching "Abdullah Hanif")
    if (minWords[0] === maxWords[0] || (minWords[0].length === 1 && maxWords[0].startsWith(minWords[0]))) {
      let prefixMatch = true;
      for (let i = 0; i < minWords.length; i++) {
        const w1 = minWords[i];
        const w2 = maxWords[i];
        const matchWord = w1 === w2 || 
          (w1.length === 1 && w2.startsWith(w1)) || 
          (w2.length === 1 && w1.startsWith(w2)) ||
          (w1.replace(/(.)\1+/g, '$1') === w2.replace(/(.)\1+/g, '$1'));
        
        if (!matchWord) {
          prefixMatch = false;
          break;
        }
      }

      if (prefixMatch) {
        // Only allow if the longer name is at most 2 words longer
        if (maxWords.length - minWords.length <= 2) {
          return true;
        }
      }
    }
  }

  // Single word exact match (e.g. "Zahir" == "Zahir" or "Salman" == "Salman")
  if (wordsA.length === 1 && wordsB.length === 1 && wordsA[0] === wordsB[0] && wordsA[0].length >= 4) {
    return true;
  }

  return false;
}

