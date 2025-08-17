// 📁 src/core/storage.js

const STORAGE_KEY = 'what-is-life:save:v1';
const LEGACY_KEY  = 'what-is-life-save'; // compat: sua chave anterior (CHAVE_PROGRESO)

// Helpers
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

// Migração do formato antigo (eventoAtual objeto → eventoAtualId)
function migrateLegacy() {
  const legacy = readRaw(LEGACY_KEY);
  if (!legacy) return null;

  const eventoAtualId =
  (legacy.eventoAtual && legacy.eventoAtual.id) ? legacy.eventoAtual.id : legacy.eventoAtualId ?? null;

  const migrated = {
    diaAtual: Number(legacy.diaAtual) || 1,
    build: legacy.build || 'profano',
    eventoAtualId: eventoAtualId ?? null,
  };

  // Guarda no novo formato e remove o velho
  writeRaw(STORAGE_KEY, migrated);
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
  return migrated;
}

/**
 * Carrega o progresso persistido (com defaults seguros).
 * Retorna sempre um objeto do tipo:
 * { diaAtual: number, build: string, eventoAtualId: string|null, eventoAtual: null }
 * (eventoAtual fica sempre null para o main.js reconstruir pelo JSON do dia)
 */
export function carregarProgresso() {
  // Tenta novo formato
  let data = readRaw(STORAGE_KEY);

  // Se não existir, tenta migrar o antigo
  if (!data) {
    data = migrateLegacy();
  }

  // Se ainda assim nada, cria default
  if (!data) {
    data = { diaAtual: 1, build: 'profano', eventoAtualId: null };
  }

  // Normaliza campos
  const diaAtual = Number(data.diaAtual) || 1;
  const build = typeof data.build === 'string' ? data.build : 'profano';
  const eventoAtualId = data.eventoAtualId ?? (
    data.eventoAtual && data.eventoAtual.id ? data.eventoAtual.id : null
  );

  return {
    diaAtual,
    build,
    eventoAtualId,
    eventoAtual: null, // 🔸 main.js decide o bloco inicial
  };
}

/**
 * Atalho usado pelo main.js
 */
export function carregarDiaAtual() {
  return carregarProgresso();
}

/**
 * Salva progresso mesclando com o existente (salva só ids leves).
 * Aceita um objeto parcial: { diaAtual?, eventoAtual?, eventoAtualId?, build? }
 */
export function salvarProgresso(partial = {}) {
  const atual = carregarProgresso();

  // Extrai o id do evento caso venha objeto
  const evtId = partial.eventoAtualId ??
  (partial.eventoAtual && partial.eventoAtual.id) ??
  atual.eventoAtualId ?? null;

  const diaAtual = (partial.diaAtual != null) ? Number(partial.diaAtual) : atual.diaAtual;
  const build    = (typeof partial.build === 'string') ? partial.build : atual.build;

  const novo = {
    diaAtual,
    build,
    eventoAtualId: evtId
  };

  writeRaw(STORAGE_KEY, novo);
  return novo;
}

/**
 * Define apenas a build e persiste.
 */
export function salvarBuild(build) {
  if (!build) return;
  const atual = carregarProgresso();
  salvarProgresso({ build, diaAtual: atual.diaAtual, eventoAtualId: atual.eventoAtualId });
}

/**
 * Avança um dia mantendo a build atual e limpando ponteiro de evento.
 * (Mantém seu reload por simplicidade)
 */
export function avancarDia(estado) {
  const novoDia = Number(estado?.diaAtual || 1) + 1;
  const build   = typeof estado?.build === 'string' ? estado.build : carregarProgresso().build;

  salvarProgresso({ diaAtual: novoDia, build, eventoAtualId: null });

  // Simples por enquanto: recarrega a página
  try { window.location.reload(); } catch {}
}

/** Remove todo o progresso (debug) */
export function apagarProgresso() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
}

/** Reset completo (alias) */
export function resetarProgresso() {
  apagarProgresso();
}
