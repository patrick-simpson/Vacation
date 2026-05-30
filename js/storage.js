/* storage.js — IndexedDB wrapper for trip media (photos & voice memos).
 * Photos and audio are far too large for localStorage's ~5MB cap, so the
 * binary blobs live here. Lightweight text (notes, ratings, moods, stamps,
 * players) stays in localStorage via app.js / players.js. */

var MediaStore = (function () {
  var DB_NAME = 'storybook401';
  var DB_VERSION = 1;
  var STORE = 'media';
  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function tx(mode) {
    return open().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  // key is "<chapterId>:photo" or "<chapterId>:audio".
  function saveMedia(key, blob) {
    return tx('readwrite').then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.put(blob, key);
        r.onsuccess = function () { resolve(key); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function getMedia(key) {
    return tx('readonly').then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.get(key);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function getAllMedia() {
    return tx('readonly').then(function (store) {
      return new Promise(function (resolve, reject) {
        var out = {};
        var r = store.openCursor();
        r.onsuccess = function () {
          var cursor = r.result;
          if (cursor) {
            out[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            resolve(out);
          }
        };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function deleteMedia(key) {
    return tx('readwrite').then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.delete(key);
        r.onsuccess = function () { resolve(); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  return {
    saveMedia: saveMedia,
    getMedia: getMedia,
    getAllMedia: getAllMedia,
    deleteMedia: deleteMedia
  };
})();
