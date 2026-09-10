(function () {
  const DB_NAME = 'mbg_draft_db';
  const VERSION = 1;
  const STORE = 'drafts';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function request(mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const os = tx.objectStore(STORE);
      let req;
      try { req = fn(os); } catch (e) { db.close(); reject(e); return; }
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
    });
  }

  window.MBGDraftDB = {
    get: id => request('readonly', os => os.get(id)),
    put: data => request('readwrite', os => os.put(data)),
    remove: id => request('readwrite', os => os.delete(id))
  };
})();
