let npcData = {}; // Variável global para armazenar NPCs

/**
 * Carrega os dados de NPCs do JSON externo.
 */
async function carregarNPCs() {
  try {
    const resposta = await fetch("/data/eventoNPC.json");
    const dataBruta = await resposta.json();

    npcData = {};
    dataBruta.forEach(npc => {
      npcData[npc.id] = {
        nome: npc.nome,
        ...npc.falas
      };
    });

  } catch (erro) {
    console.error('Erro ao carregar NPCs:', erro);
    npcData = {};
  }
}

/**
 * Exibe a fala do NPC e permite ao jogador responder com 3 opções.
 * @param {string} idNPC - ID do NPC
 * @param {string} build - Build atual
 * @param {Function} onFim - Callback após resposta
 */
export async function dispararNPC(idNPC, build, onFim) {
  if (!Object.keys(npcData).length) {
    await carregarNPCs();
  }

  const npc = npcData?.[idNPC];
  if (!npc) {
    console.warn(`NPC com id '${idNPC}' não encontrado em npcData:`, npcData);
    onFim?.();
    return;
  }

  const fala = npc[build] || npc['profano'] || '...';

  const container = document.getElementById('evento');
  if (!container) return;

  container.innerHTML = `
  <div class="npc-fala fade-in">
  <strong class="npc-nome">${npc.nome}:</strong>
  <p class="npc-texto">"${fala}"</p>
  <div class="respostas-npc">
  <button class="btn-resposta" data-build="virtuoso">Responder com empatia</button>
  <button class="btn-resposta" data-build="profano">Ignorar o comentário</button>
  <button class="btn-resposta" data-build="anomalia">Responder de forma estranha</button>
  </div>
  </div>
  `;

  document.querySelectorAll('.btn-resposta').forEach(btn => {
    btn.addEventListener('click', () => {
      const respostaBuild = btn.dataset.build;
      const eventoResposta = new CustomEvent('respostaNPC', {
        detail: {
          build: respostaBuild
        }
      });
      document.dispatchEvent(eventoResposta);
      onFim?.();
    });
  });
}
