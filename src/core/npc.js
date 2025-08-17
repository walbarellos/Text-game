// 📁 src/core/npc.js

let npcData = {}; // cache em memória

/** Utilitário simples para escapar HTML em texto dinâmico */
function escapeHTML(s) {
  return String(s ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'", '&#39;');
}

/**
 * Carrega os dados de NPCs do JSON externo (eventoNPC.json).
 * Shape esperado:
 * [
 *   { id, nome, falas: { virtuoso, profano, anomalia } }
 * ]
 */
export async function carregarNPCs() {
  try {
    const resposta = await fetch('/data/eventoNPC.json', { cache: 'no-store' });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const dataBruta = await resposta.json();

    const map = {};
    (Array.isArray(dataBruta) ? dataBruta : []).forEach((npc) => {
      map[npc.id] = {
        id: npc.id,
        nome: npc.nome || npc.id,
        falas: npc.falas || {}
      };
    });
    npcData = map;
  } catch (erro) {
    console.error('Erro ao carregar NPCs:', erro);
    npcData = {};
  }
}

// 🔎 helper para outros módulos pegarem o nome pelo id
export function getNPCNome(id) {
  return npcData?.[id]?.nome || null;
}

/** Tabela opcional de impacto na build por tipo de resposta. */
const impactoPorResposta = {
  virtuoso: { virtuoso: +1, profano: 0, anomalia: 0 },
  'firmeza-respeitosa': { virtuoso: +1, profano: 0, anomalia: 0 },
  'cético-educado': { virtuoso: 0, profano: 0, anomalia: +1 },
  'humor-leve': { virtuoso: 0, profano: 0, anomalia: +1 },
  'silencio-atento': { virtuoso: +1, profano: 0, anomalia: 0 },
  'pedir-detalhe': { virtuoso: +1, profano: 0, anomalia: 0 },
  profano: { virtuoso: 0, profano: +1, anomalia: 0 },
  anomalia: { virtuoso: 0, profano: 0, anomalia: +1 }
};

/**
 * Opções padrão de resposta (extensíveis por NPC no futuro).
 * label: texto do botão
 * key: tecla de atalho (1-9)
 * tone: id interno da resposta (usado p/ dispatch)
 * buildSugestao: rótulo de “caminho” básico (para compatibilidade)
 */
const OPCOES_PADRAO = [
  { label: 'Responder com empatia',            key: '1', tone: 'virtuoso',           buildSugestao: 'virtuoso' },
{ label: 'Falar com firmeza respeitosa',     key: '2', tone: 'firmeza-respeitosa', buildSugestao: 'virtuoso' },
{ label: 'Dialogar de forma cética (educado)', key: '3', tone: 'cético-educado',   buildSugestao: 'anomalia' },
{ label: 'Humor leve para aliviar',          key: '4', tone: 'humor-leve',         buildSugestao: 'anomalia' },
{ label: 'Pedir detalhe técnico',            key: '5', tone: 'pedir-detalhe',      buildSugestao: 'virtuoso' },
{ label: 'Silêncio atento',                  key: '6', tone: 'silencio-atento',    buildSugestao: 'virtuoso' },
{ label: 'Ignorar o comentário',             key: '7', tone: 'profano',            buildSugestao: 'profano' },
{ label: 'Responder de forma estranha',      key: '8', tone: 'anomalia',           buildSugestao: 'anomalia' }
];

/** Decide fala por caminho; possui fallbacks para nunca retornar undefined */
function pickLine(npc, caminho) {
  const f = npc?.falas;
  const key = String(caminho || '').toLowerCase();
  if (f && typeof f === 'object' && !Array.isArray(f)) {
    return f[key] || f.virtuoso || f.profano || f.anomalia || '…';
  }
  return '…';
}

/**
 * Cria HTML do diálogo com sanitização básica e “aura” nos botões.
 */
function renderNPCDialog({ container, nomeNPC, falaNPC, opcoes }) {
  container.innerHTML = `
  <section class="npc-dialogo" aria-live="polite" aria-label="Diálogo com ${escapeHTML(nomeNPC)}">
  <div class="npc-cabecalho">
  <div class="npc-avatar" aria-hidden="true"></div>
  <strong class="npc-nome" role="heading" aria-level="2">${escapeHTML(nomeNPC)}</strong>
  <span class="npc-badge" title="Diálogo de NPC">NPC</span>
  </div>
  <div class="npc-balao" role="textbox">
  <p class="npc-texto">“${escapeHTML(falaNPC)}”</p>
  </div>
  <div class="npc-instrucoes" id="npc-instrucoes">
  Use as teclas <kbd>1</kbd>–<kbd>${opcoes.length}</kbd> ou clique em uma opção.
  </div>
  <div class="npc-respostas" role="group" aria-labelledby="npc-instrucoes">
  ${opcoes.map((opt, i) => `
    <button
    class="btn-resposta aura"
    data-tone="${escapeHTML(opt.tone)}"
    data-build="${escapeHTML(opt.buildSugestao)}"
    data-key="${escapeHTML(opt.key || String(i + 1))}"
    aria-label="${escapeHTML(opt.label)} (tecla ${escapeHTML(opt.key || String(i + 1))})"
    >
    <span class="btn-key">${escapeHTML(opt.key || String(i + 1))}</span>
    <span class="btn-label">${escapeHTML(opt.label)}</span>
    <span class="aura-ring" aria-hidden="true"></span>
    </button>
    `).join('')}
    </div>
    </section>
    `;

    // Foco no primeiro botão para acessibilidade
    const primeiro = container.querySelector('.btn-resposta');
    if (primeiro) primeiro.focus();
}

/**
 * Exibe a fala do NPC e permite ao jogador responder.
 * Compatibilidade:
 *  - 3º parâmetro pode ser Array (opcoesExtras) ou Function (onDone callback legado)
 * Retorna Promise<{ idNPC, nome, caminho, fala }>
 */
export async function dispararNPC(idNPC, build, opcoesExtrasOrOnDone = null) {
  // Detecta assinatura: (id, build, opcoes) ou (id, build, onDone)
  let onDone = null;
  let opcoesExtras = null;
  if (typeof opcoesExtrasOrOnDone === 'function') onDone = opcoesExtrasOrOnDone;
  else if (Array.isArray(opcoesExtrasOrOnDone)) opcoesExtras = opcoesExtrasOrOnDone;

  try {
    if (!Object.keys(npcData).length) {
      await carregarNPCs();
    }

    const npc = npcData?.[idNPC];
    if (!npc) {
      console.warn(`NPC com id '${idNPC}' não encontrado em npcData:`, npcData);
      // resolve algo seguro
      const detail = { idNPC, nome: idNPC || 'NPC', caminho: build || '—', fala: '…' };
      window.dispatchEvent(new CustomEvent('npc:FALADA', { detail }));
      if (onDone) onDone();
      return detail;
    }

    const caminho = String(build || 'profano').toLowerCase();
    const fala = pickLine(npc, caminho);
    const nome = npc.nome || idNPC;

    const container = document.getElementById('evento');
    if (!container) {
      const detail = { idNPC, nome, caminho, fala };
      window.dispatchEvent(new CustomEvent('npc:FALADA', { detail }));
      if (onDone) onDone();
      return detail;
    }

    // Monte as opções
    const opcoes = Array.isArray(opcoesExtras) && opcoesExtras.length
    ? opcoesExtras
    : OPCOES_PADRAO;

    // Renderiza diálogo
    renderNPCDialog({
      container,
      nomeNPC: nome,
      falaNPC: fala,
      opcoes
    });

    // Emite evento de que a fala ocorreu (renderer pode registrar no relatório)
    const spokenDetail = { idNPC, nome, caminho, fala };
    window.dispatchEvent(new CustomEvent('npc:FALADA', { detail: spokenDetail }));

    // Compat: chama callback legado imediatamente após exibir o diálogo
    if (onDone) onDone();

    // Wire-up: clique único por botão
    container.querySelectorAll('.btn-resposta').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tone = btn.dataset.tone;
        const buildSugestao = btn.dataset.build;

        document.dispatchEvent(new CustomEvent('respostaNPC', {
          detail: {
            idNPC,
            nome,             // << inclui nome no detail
            fala,             // << inclui fala exibida
            tone,
            build: buildSugestao,
            impacto: impactoPorResposta[tone] || null
          }
        }));
      }, { once: true });
    });

    // Atalhos 1–9 (evita conflito com campos de texto)
    const keyHandler = (ev) => {
      const active = document.activeElement?.tagName;
      if (active === 'INPUT' || active === 'TEXTAREA') return;
      const k = ev.key;
      const alvo = container.querySelector(`.btn-resposta[data-key="${k}"]`);
      if (alvo) alvo.click();
    };
      document.addEventListener('keydown', keyHandler, { once: true });

      // Retorna payload útil para quem quiser await
      return spokenDetail;
  } catch (erro) {
    console.error('dispararNPC falhou:', erro);
    const detail = { idNPC, nome: idNPC || 'NPC', caminho: build || '—', fala: '…' };
    window.dispatchEvent(new CustomEvent('npc:FALADA', { detail }));
    if (onDone) onDone();
    return detail;
  }
}
