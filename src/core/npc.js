/**
 * Sistema de NPCs simbólicos com falas condicionais à Build do jogador.
 * As falas vêm do arquivo data/eventoNPC.json, com estrutura modular.
 */

let npcData = {};

/**
 * Carrega os dados de NPCs do JSON externo.
 */
async function carregarNPCs() {
  try {
    const resposta = await fetch("/dados/eventoNPC.json");
    npcData = await resposta.json();
  } catch (erro) {
    console.error('Erro ao carregar NPCs:', erro);
    npcData = {};
  }
}

/**
 * Dispara um evento de NPC com base na Build do jogador.
 * @param {string} idNPC - ID do NPC a ser chamado
 * @param {string} build - Build atual do jogador (profano, virtuoso, anomalia)
 * @param {Function} callback - Função a executar após o diálogo do NPC
 */
export async function dispararNPC(idNPC, build, callback) {
  if (!Object.keys(npcData).length) {
    await carregarNPCs();
  }

  const npc = npcData[idNPC];
  if (!npc) {
    console.warn(`NPC com id '${idNPC}' não encontrado.`);
    callback?.();
    return;
  }

  const fala = npc[build] || npc['profano'] || '...';
  exibirFalaNPC(npc.nome || '???', fala, callback);
}

/**
 * Exibe a fala do NPC em tela, com temporizador.
 * @param {string} nome - Nome do NPC
 * @param {string} fala - Texto a ser mostrado
 * @param {Function} onFim - Callback após diálogo
 */
function exibirFalaNPC(nome, fala, onFim) {
  const container = document.getElementById('evento');
  if (!container) return;

  container.innerHTML = `
    <div class="npc-fala fade-in">
      <strong class="npc-nome">${nome}:</strong>
      <p class="npc-texto">"${fala}"</p>
    </div>
  `;

  setTimeout(() => {
    onFim?.();
  }, 2500); // duração simbólica da fala
}
