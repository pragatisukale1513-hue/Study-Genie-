/**
 * StudyGenie - Local Database Layer
 * IndexedDB with automatic localStorage fallback for offline persistent storage
 */

const DB_NAME = 'StudyGenieDB';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syllabi')) {
        db.createObjectStore('syllabi', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('questionBanks')) {
        db.createObjectStore('questionBanks', { keyPath: 'syllabusId' });
      }
      if (!db.objectStoreNames.contains('flashcards')) {
        db.createObjectStore('flashcards', { keyPath: 'syllabusId' });
      }
      if (!db.objectStoreNames.contains('summaries')) {
        db.createObjectStore('summaries', { keyPath: 'syllabusId' });
      }
      if (!db.objectStoreNames.contains('studyPlans')) {
        db.createObjectStore('studyPlans', { keyPath: 'syllabusId' });
      }
      if (!db.objectStoreNames.contains('testResults')) {
        db.createObjectStore('testResults', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('IndexedDB failed to open, falling back to localStorage');
      resolve(null);
    };
  });

  return dbPromise;
}

// Fallback localStorage helpers
function lsGet(key, def = null) {
  try {
    const item = localStorage.getItem(`studygenie_${key}`);
    return item ? JSON.parse(item) : def;
  } catch (e) {
    return def;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(`studygenie_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage set failed:', e);
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(`studygenie_${key}`);
  } catch (e) {}
}

// Generic IndexedDB Put
async function idbPut(storeName, data) {
  const db = await openDB();
  if (!db) {
    lsSet(`${storeName}_${data.id || data.syllabusId}`, data);
    return;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      // Fallback
      lsSet(`${storeName}_${data.id || data.syllabusId}`, data);
      resolve();
    };
  });
}

// Generic IndexedDB Get
async function idbGet(storeName, key) {
  const db = await openDB();
  if (!db) {
    return lsGet(`${storeName}_${key}`);
  }

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || lsGet(`${storeName}_${key}`));
    req.onerror = () => resolve(lsGet(`${storeName}_${key}`));
  });
}

// Generic IndexedDB GetAll
async function idbGetAll(storeName) {
  const db = await openDB();
  if (!db) {
    // Scan localStorage
    const items = [];
    const prefix = `studygenie_${storeName}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        try {
          items.push(JSON.parse(localStorage.getItem(k)));
        } catch (e) {}
      }
    }
    return items;
  }

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

// Generic IndexedDB Delete
async function idbDelete(storeName, key) {
  const db = await openDB();
  lsRemove(`${storeName}_${key}`);
  if (!db) return;

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

/* ========================================================
   Exported API Methods
   ======================================================== */

export async function saveSyllabus(syllabus) {
  await idbPut('syllabi', syllabus);
  lsSet('activeSyllabusId', syllabus.id);
  return syllabus;
}

export async function getAllSyllabi() {
  return await idbGetAll('syllabi');
}

export async function getSyllabus(id) {
  return await idbGet('syllabi', id);
}

export async function deleteSyllabus(id) {
  await idbDelete('syllabi', id);
  await idbDelete('questionBanks', id);
  await idbDelete('flashcards', id);
  await idbDelete('summaries', id);
  await idbDelete('studyPlans', id);
  
  if (lsGet('activeSyllabusId') === id) {
    lsRemove('activeSyllabusId');
  }
}

export async function getActiveSyllabusId() {
  return lsGet('activeSyllabusId');
}

export async function setActiveSyllabusId(id) {
  lsSet('activeSyllabusId', id);
}

export async function saveQuestionBank(syllabusId, questions) {
  await idbPut('questionBanks', { syllabusId, questions, updatedAt: new Date().toISOString() });
}

export async function getQuestionBank(syllabusId) {
  const record = await idbGet('questionBanks', syllabusId);
  return record ? record.questions : null;
}

export async function saveFlashcards(syllabusId, flashcards) {
  await idbPut('flashcards', { syllabusId, flashcards, updatedAt: new Date().toISOString() });
}

export async function getFlashcards(syllabusId) {
  const record = await idbGet('flashcards', syllabusId);
  return record ? record.flashcards : null;
}

export async function saveSummaries(syllabusId, summaries) {
  await idbPut('summaries', { syllabusId, summaries, updatedAt: new Date().toISOString() });
}

export async function getSummaries(syllabusId) {
  const record = await idbGet('summaries', syllabusId);
  return record ? record.summaries : null;
}

export async function saveStudyPlan(syllabusId, plan) {
  await idbPut('studyPlans', { syllabusId, plan, updatedAt: new Date().toISOString() });
}

export async function getStudyPlan(syllabusId) {
  const record = await idbGet('studyPlans', syllabusId);
  return record ? record.plan : null;
}

export async function saveTestResult(result) {
  await idbPut('testResults', result);
}

export async function getAllTestResults(syllabusId = null) {
  const all = await idbGetAll('testResults');
  if (syllabusId) {
    return all.filter(r => r.syllabusId === syllabusId);
  }
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function exportAllData() {
  const syllabi = await idbGetAll('syllabi');
  const questionBanks = await idbGetAll('questionBanks');
  const flashcards = await idbGetAll('flashcards');
  const summaries = await idbGetAll('summaries');
  const studyPlans = await idbGetAll('studyPlans');
  const testResults = await idbGetAll('testResults');

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    syllabi,
    questionBanks,
    flashcards,
    summaries,
    studyPlans,
    testResults
  };
}

export async function importAllData(jsonData) {
  if (!jsonData || !Array.isArray(jsonData.syllabi)) {
    throw new Error('Invalid StudyGenie backup file format.');
  }

  for (const s of jsonData.syllabi) await idbPut('syllabi', s);
  if (jsonData.questionBanks) {
    for (const q of jsonData.questionBanks) await idbPut('questionBanks', q);
  }
  if (jsonData.flashcards) {
    for (const f of jsonData.flashcards) await idbPut('flashcards', f);
  }
  if (jsonData.summaries) {
    for (const sm of jsonData.summaries) await idbPut('summaries', sm);
  }
  if (jsonData.studyPlans) {
    for (const p of jsonData.studyPlans) await idbPut('studyPlans', p);
  }
  if (jsonData.testResults) {
    for (const t of jsonData.testResults) await idbPut('testResults', t);
  }

  if (jsonData.syllabi.length > 0) {
    lsSet('activeSyllabusId', jsonData.syllabi[0].id);
  }
}

export async function clearAllStorage() {
  const db = await openDB();
  if (db) {
    const tx = db.transaction(['syllabi', 'questionBanks', 'flashcards', 'summaries', 'studyPlans', 'testResults'], 'readwrite');
    tx.objectStore('syllabi').clear();
    tx.objectStore('questionBanks').clear();
    tx.objectStore('flashcards').clear();
    tx.objectStore('summaries').clear();
    tx.objectStore('studyPlans').clear();
    tx.objectStore('testResults').clear();
  }

  // Clear localStorage items prefixed with studygenie_
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('studygenie_')) {
      keysToRemove.push(k);
    }
  }
  for (const k of keysToRemove) localStorage.removeItem(k);
}
