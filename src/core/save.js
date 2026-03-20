/**
 * src/core/save.js
 * Sistema de save via IndexedDB.
 * - Assíncrono (não bloqueia a main thread)
 * - Suporta múltiplos slots
 * - Fallback automático para localStorage se IndexedDB não disponível
 *
 * INTEGRAÇÃO: substituir chamadas de localStorage no código existente
 *   import { salvar, carregar, listarSlots } from './core/save.js';
 *
 *   await salvar(estado);               // salva no slot 'auto'
 *   const estado = await carregar();    // carrega slot 'auto'
 *   await salvar(estado, 'slot2');      // slot manual
 */

const DB_NAME    = '7lives-saves';
const DB_VERSION = 1;
const STORE      = 'saves';

let _db = null;

async function getDB() {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db    = e.target.result;
      const store = db.createObjectStore(STORE, { keyPath: 'slot' });
      store.createIndex('updatedAt', 'updatedAt', { unique: false });
    };

    req.onsuccess = e => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = e => reject(e.target.error);
  });
}

/**
 * Salva o estado completo no IndexedDB.
 * @param {object} estado - Estado do jogo
 * @param {string} slot   - Identificador do slot (padrão: 'auto')
 */
export async function salvar(estado, slot = 'auto') {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).put({
        slot,
        estado: structuredClone(estado),
        updatedAt: Date.now(),
        versao: 1,
      });
      req.onsuccess = () => resolve(true);
      req.onerror   = () => reject(req.error);
    });
  } catch (err) {
    // Fallback: localStorage
    console.warn('[save] IndexedDB falhou, usando localStorage:', err);
    try {
      localStorage.setItem(`7lives-${slot}`, JSON.stringify({
        estado,
        updatedAt: Date.now(),
      }));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Carrega um slot salvo.
 * @param {string} slot
 * @returns {object|null}
 */
export async function carregar(slot = 'auto') {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(slot);
      req.onsuccess = () => resolve(req.result?.estado ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch (err) {
    // Fallback: localStorage
    try {
      const raw = localStorage.getItem(`7lives-${slot}`);
      return raw ? JSON.parse(raw).estado : null;
    } catch {
      return null;
    }
  }
}

/**
 * Lista todos os slots com metadados.
 * @returns {Array<{slot, updatedAt}>}
 */
export async function listarSlots() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx   = db.transaction(STORE, 'readonly');
      const req  = tx.objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(req.result.map(r => ({
          slot:      r.slot,
          updatedAt: r.updatedAt,
          dia:       r.estado?.dia ?? 1,
          build:     r.estado?.build ?? 'desconhecido',
        })));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Deleta um slot.
 * @param {string} slot
 */
export async function deletarSlot(slot = 'auto') {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).delete(slot);
      req.onsuccess = () => resolve(true);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

/** Verifica se existe save sem carregar tudo */
export async function temSave(slot = 'auto') {
  const slots = await listarSlots();
  return slots.some(s => s.slot === slot);
}
