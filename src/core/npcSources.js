// 📁 src/core/npcSources.js
let _cache = { evento: null, personagens: null };

async function loadJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

export async function ensureSources() {
  if (!_cache.evento) _cache.evento = await loadJSON('/data/eventoNPC.json');
  if (!_cache.personagens) _cache.personagens = await loadJSON('/data/personagens.json');
  return _cache;
}

/**
 * Retorna fala por caminho (virtuoso/profano/anomalia) se existir.
 * Se for personagens.json (falas em array), sorteia uma.
 * Fallbacks garantem que nunca devolvemos undefined.
 */
export function pickLine(npcObj, caminho) {
  if (!npcObj) return '…';
  const f = npcObj.falas;

  // falas por caminho (eventoNPC.json)
  if (f && typeof f === 'object' && !Array.isArray(f)) {
    const prefer = (caminho || '').toLowerCase();
    return f[prefer] || f.virtuoso || f.profano || f.anomalia || '…';
  }

  // falas array (personagens.json)
  if (Array.isArray(f) && f.length) {
    const i = Math.floor(Math.random() * f.length);
    return f[i] ?? '…';
  }

  return '…';
}

/**
 * Busca um NPC por id em eventoNPC.json (id: "npc1"...)
 * ou dentro de personagens.json (id: "zangado_barbeiro"...).
 * Retorna objeto com { id, nome, falas }.
 */
export function findNPCById(id, { evento, personagens }) {
  if (!id) return null;

  // eventoNPC.json é um array
  const fromEvento = Array.isArray(evento)
    ? evento.find(x => x.id === id)
    : null;

  if (fromEvento) return fromEvento;

  // personagens.json tem shape { personagens: [] } ou []
  let arr = [];
  if (Array.isArray(personagens)) arr = personagens;
  else if (personagens && Array.isArray(personagens.personagens)) arr = personagens.personagens;

  return arr.find(x => x.id === id) || null;
}

