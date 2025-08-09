let npcData = {}; // Variável global para armazenar NPCs

/**
 * Carrega os dados de NPCs do JSON externo.
 */
async function carregarNPCs() {
  try {
    const resposta = await fetch("/data/eventoNPC.json");
    const dataBruta = await resposta.json();

    npcData = {};
    dataBruta.forEach((npc) => {
      npcData[npc.id] = {
        nome: npc.nome,
        ...npc.falas
      };
    });
  } catch (erro) {
    console.error("Erro ao carregar NPCs:", erro);
    npcData = {};
  }
}

/**
 * Tabela opcional de impacto na build por tipo de resposta.
 * Se não quiser aplicar impacto agora, ignore este objeto.
 */
const impactoPorResposta = {
  virtuoso: { virtuoso: +1, profano: 0, anomalia: 0 },
  "firmeza-respeitosa": { virtuoso: +1, profano: 0, anomalia: 0 },
  "cético-educado": { virtuoso: 0, profano: 0, anomalia: +1 },
  "humor-leve": { virtuoso: 0, profano: 0, anomalia: +1 },
  "silencio-atento": { virtuoso: +1, profano: 0, anomalia: 0 },
  "pedir-detalhe": { virtuoso: +1, profano: 0, anomalia: 0 },
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
  { label: "Responder com empatia", key: "1", tone: "virtuoso", buildSugestao: "virtuoso" },
{ label: "Falar com firmeza respeitosa", key: "2", tone: "firmeza-respeitosa", buildSugestao: "virtuoso" },
{ label: "Dialogar de forma cética (educado)", key: "3", tone: "cético-educado", buildSugestao: "anomalia" },
{ label: "Humor leve para aliviar", key: "4", tone: "humor-leve", buildSugestao: "anomalia" },
{ label: "Pedir detalhe técnico", key: "5", tone: "pedir-detalhe", buildSugestao: "virtuoso" },
{ label: "Silêncio atento", key: "6", tone: "silencio-atento", buildSugestao: "virtuoso" },
{ label: "Ignorar o comentário", key: "7", tone: "profano", buildSugestao: "profano" },
{ label: "Responder de forma estranha", key: "8", tone: "anomalia", buildSugestao: "anomalia" }
];

/**
 * Cria HTML seguro com “aura” nos botões e diferenciação visual de diálogo de NPC.
 */
function renderNPCDialog({ container, nomeNPC, falaNPC, opcoes }) {
  container.innerHTML = `
  <section class="npc-dialogo" aria-live="polite" aria-label="Diálogo com ${nomeNPC}">
  <div class="npc-cabecalho">
  <div class="npc-avatar" aria-hidden="true"></div>
  <strong class="npc-nome" role="heading" aria-level="2">${nomeNPC}</strong>
  <span class="npc-badge" title="Diálogo de NPC">NPC</span>
  </div>
  <div class="npc-balao" role="textbox">
  <p class="npc-texto">“${falaNPC}”</p>
  </div>
  <div class="npc-instrucoes" id="npc-instrucoes">
  Use as teclas <kbd>1</kbd>–<kbd>${opcoes.length}</kbd> ou clique em uma opção.
  </div>
  <div class="npc-respostas" role="group" aria-labelledby="npc-instrucoes">
  ${opcoes
    .map(
      (opt, i) => `
      <button
      class="btn-resposta aura"
      data-tone="${opt.tone}"
      data-build="${opt.buildSugestao}"
      data-key="${opt.key || String(i + 1)}"
      aria-label="${opt.label} (tecla ${opt.key || String(i + 1)})"
      >
      <span class="btn-key">${opt.key || String(i + 1)}</span>
      <span class="btn-label">${opt.label}</span>
      <span class="aura-ring" aria-hidden="true"></span>
      </button>
      `
    )
    .join("")}
    </div>
    </section>
    `;

    // Foco no primeiro botão para acessibilidade
    const primeiro = container.querySelector(".btn-resposta");
    if (primeiro) primeiro.focus();
}

/**
 * Exibe a fala do NPC e permite ao jogador responder.
 * @param {string} idNPC - ID do NPC
 * @param {string} build - Build atual (virtuoso | profano | anomalia)
 * @param {Array} opcoesExtras - (opcional) sobrescrever/adicionar opções
 */
export async function dispararNPC(idNPC, build, opcoesExtras = null) {
  if (!Object.keys(npcData).length) {
    await carregarNPCs();
  }

  const npc = npcData?.[idNPC];
  if (!npc) {
    console.warn(`NPC com id '${idNPC}' não encontrado em npcData:`, npcData);
    return;
  }

  // Fala prioritária pela build, fallback para profano, depois reticências
  const fala = npc[build] || npc["profano"] || "...";

  const container = document.getElementById("evento");
  if (!container) return;

  // Monte as opções (permite sobrescrever via parâmetro)
  const opcoes = Array.isArray(opcoesExtras) && opcoesExtras.length
  ? opcoesExtras
  : OPCOES_PADRAO;

  renderNPCDialog({
    container,
    nomeNPC: npc.nome,
    falaNPC: fala,
    opcoes
  });

  // Clique único por botão (evita duplo dispatch)
  container.querySelectorAll(".btn-resposta").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const tone = btn.dataset.tone;
        const buildSugestao = btn.dataset.build;

        document.dispatchEvent(
          new CustomEvent("respostaNPC", {
            detail: {
              idNPC,
              tone,
              build: buildSugestao,
              impacto: impactoPorResposta[tone] || null
            }
          })
        );
      },
      { once: true }
    );
  });

  // Teclas de atalho 1–9
  const keyHandler = (ev) => {
    // evita conflito quando o jogador está digitando em input
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    const k = ev.key;
    const alvo = container.querySelector(`.btn-resposta[data-key="${k}"]`);
    if (alvo) {
      alvo.click();
    }
  };
  document.addEventListener("keydown", keyHandler, { once: true });
}
