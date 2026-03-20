// 📁 src/core/storage.js

const STORAGE_KEY = 'what-is-life:save:v1';
const LEGACY_KEY  = 'what-is-life-save';

function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function readRaw(key) {
  return safeParse(localStorage.getItem(key), null);
}

function writeRaw(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.warn('⚠️ Falha ao salvar progresso:', e);
  }
}

function migrateLegacy() {
  const legacy = readRaw(LEGACY_KEY);
  if (!legacy) return null;

  const eventoAtualId =
  (legacy.eventoAtual && legacy.eventoAtual.id) ? legacy.eventoAtual.id : legacy.eventoAtualId ?? null;

  const migrated = {
    dia: Number(legacy.diaAtual || legacy.dia) || 1,
    build: legacy.build || 'anomalia',
    eventoAtualId: eventoAtualId ?? null,
  };

  writeRaw(STORAGE_KEY, migrated);
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
  return migrated;
}

export function carregarProgresso() {
  let data = readRaw(STORAGE_KEY);

  if (!data) {
    data = migrateLegacy();
  }

  if (!data) {
    data = { dia: 1, build: 'anomalia', eventoAtualId: null };
  }

  const dia = Number(data.dia || data.diaAtual) || 1;
  const build = typeof data.build === 'string' ? data.build : 'anomalia';
  const eventoAtualId = data.eventoAtualId ?? (
    data.eventoAtual && data.eventoAtual.id ? data.eventoAtual.id : null
  );

  return {
    dia,
    build,
    eventoAtualId,
    eventoAtual: null,
  };
}

export function carregarDiaAtual() {
  return carregarProgresso();
}

export function salvarProgresso(partial = {}) {
  const atual = carregarProgresso();

  const evtId = partial.eventoAtualId ??
  (partial.eventoAtual && partial.eventoAtual.id) ??
  atual.eventoAtualId ?? null;

  const dia   = (partial.dia != null) ? Number(partial.dia) : (partial.diaAtual != null ? Number(partial.diaAtual) : atual.dia);
  const build = (typeof partial.build === 'string') ? partial.build : atual.build;

  const novo = {
    dia,
    build,
    eventoAtualId: evtId
  };

  writeRaw(STORAGE_KEY, novo);
  return novo;
}

export function salvarBuild(build) {
  if (!build) return;
  const atual = carregarProgresso();
  salvarProgresso({ build, dia: atual.dia, eventoAtualId: atual.eventoAtualId });
}

export function avancarDia(estado) {
  const novoDia = Number(estado?.dia || 1) + 1;
  const build   = typeof estado?.build === 'string' ? estado.build : carregarProgresso().build;

  salvarProgresso({ dia: novoDia, build, eventoAtualId: null });

  try { window.location.reload(); } catch {}
}

export function apagarProgresso() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
}

export function resetarProgresso() {
  apagarProgresso();
}
