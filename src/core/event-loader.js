/**
 * src/core/event-loader.js
 * Carregamento lazy de eventos por dia + pré-fetch especulativo.
 *
 * INTEGRAÇÃO:
 *   import { carregarEventosDoDia, carregarQuests } from './core/event-loader.js';
 *   const eventos = await carregarEventosDoDia(estado.dia);
 *
 * ESTRUTURA DE ARQUIVOS ESPERADA:
 *   public/data/eventos/dia-1.json
 *   public/data/eventos/dia-2.json
 *   ...
 *   public/data/quests/q_sombra_do_passado.json
 *   public/data/quests/q_fogo_no_mercado.json
 */

// Cache em memória — zero re-fetches
const _cache = new Map();

// ─── Carregar eventos de um dia específico ────────────────────────────
/**
 * @param {number} dia
 * @param {{ prefetch?: boolean }} opts
 */
export async function carregarEventosDoDia(dia, opts = {}) {
  const key = `dia-${dia}`;

  if (_cache.has(key)) return _cache.get(key);

  const data = await fetchJSON(`./data/eventos/${key}.json`);
  _cache.set(key, data);

  // Pré-fetch do próximo dia em background (baixa prioridade)
  if (opts.prefetch !== false && dia < 13) {
    prefetchSilencioso(`./data/eventos/dia-${dia + 1}.json`, `dia-${dia + 1}`);
  }

  return data;
}

// ─── Carregar definição de uma quest ─────────────────────────────────
export async function carregarQuest(questId) {
  const key = `quest-${questId}`;
  if (_cache.has(key)) return _cache.get(key);

  const data = await fetchJSON(`./data/quests/${questId}.json`);
  _cache.set(key, data);
  return data;
}

// ─── Carregar múltiplas quests de uma vez ─────────────────────────────
export async function carregarQuests(questIds) {
  return Promise.all(questIds.map(carregarQuest));
}

// ─── Pré-carregar assets de imagem do próximo evento ─────────────────
export function preloadImagemEvento(eventoId) {
  const link = document.createElement('link');
  link.rel  = 'preload';
  link.as   = 'image';
  link.href = `./assets/eventos/${eventoId}.webp`;
  link.type = 'image/webp';
  document.head.appendChild(link);
}

// ─── Filtrar eventos disponíveis ──────────────────────────────────────
/**
 * @param {object[]} eventos - lista bruta do JSON
 * @param {object}   estado  - estado atual do jogo
 * @param {Function} filtroFn - função eventoDisponivel de state-extensions.js
 */
export function filtrarEventosDisponiveis(eventos, estado, filtroFn) {
  return eventos.filter(e => filtroFn(estado, e.requer));
}

// ─── Utilitários internos ─────────────────────────────────────────────
async function fetchJSON(url) {
  const resp = await fetch(url, {
    // Usa cache do browser quando possível
    cache: 'default',
  });

  if (!resp.ok) {
    throw new Error(`[event-loader] Falha ao carregar ${url}: ${resp.status}`);
  }

  return resp.json();
}

function prefetchSilencioso(url, cacheKey) {
  if (_cache.has(cacheKey)) return;

  // requestIdleCallback: só faz o fetch quando o browser está ocioso
  const prefetch = () => {
    fetchJSON(url)
      .then(data => _cache.set(cacheKey, data))
      .catch(() => {}); // silencioso — é só um prefetch
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 3000 });
  } else {
    setTimeout(prefetch, 2000);
  }
}

// ─── Limpar cache (útil no New Game) ──────────────────────────────────
export function limparCache() {
  _cache.clear();
}
