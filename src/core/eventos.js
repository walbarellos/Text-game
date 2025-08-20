// 📁 src/core/eventos.js

// Se no seu projeto o renderer fica em core, troque para '../core/renderer.js'
import { renderizarEvento } from '../core/renderer.js';
import { salvarProgresso, carregarProgresso } from '../core/storage.js';

let dias = [];
let eventos = {};
let diaAtual = 0;               // índice no array `dias` (0 = Dia 1)
let eventoAtual = null;         // id do evento atual (string)
let buildAtual = 'profano';

// 🔧 URLs RELATIVAS (funciona em itch.io, Vercel, etc.)
const dataUrl = (name) => new URL(`./data/${name}`, document.baseURI).toString();
const PATH_DIAS = () => dataUrl('dias.json');
const PATH_DIA  = (arquivo) => dataUrl(arquivo);

// Utilitário de carregamento
async function fetchJson(url) {
  const resposta = await fetch(url, { cache: 'no-store' });
  if (!resposta.ok) throw new Error(`Erro ao carregar ${url}: ${resposta.status} ${resposta.statusText}`);
  return resposta.json();
}

/**
 * Inicializa o jogo usando storage existente (se houver),
 * carrega o catálogo de dias e carrega o dia corrente.
 */
export async function iniciarJogo() {
  try {
    const progresso = carregarProgresso();
    if (progresso) {
      // progresso.diaAtual aqui pode ser 1..N (humano) OU índice 0..N-1 (legado)
      // Normalizamos para índice (0-based) usando o catálogo assim que carregá-lo
      diaAtual    = progresso.diaAtual ?? 0;
      eventoAtual = progresso.eventoAtual ?? null;
      buildAtual  = progresso.build ?? 'profano';
    }

    dias = await fetchJson(PATH_DIAS());

    // Normalização robusta: se progresso trouxe "1..N", converte para índice 0..N-1
    if (Number.isFinite(diaAtual) && diaAtual >= 1 && diaAtual <= dias.length) {
      // heurística: se o valor parecer 1-based e for <= length, usamos índice
      // mas se for 0-based e válido, não alteramos
      if (diaAtual === 0 || diaAtual > dias.length - 1) {
        diaAtual = Math.max(0, Math.min(dias.length - 1, diaAtual - 1));
      }
    }
    // bounds finais
    if (!Number.isFinite(diaAtual) || diaAtual < 0 || diaAtual >= dias.length) {
      diaAtual = 0;
    }

    await carregarDia(dias[diaAtual]);
  } catch (erro) {
    console.error('💥 Falha ao iniciar o jogo em eventos.js:', erro);
  }
}

/**
 * Carrega um dia do catálogo `dias` (objeto do array),
 * popula o dicionário `eventos` e escolhe o primeiro bloco (ou âncora salva).
 */
async function carregarDia(dia) {
  try {
    if (!dia || !dia.arquivo) throw new Error('Dia inválido no catálogo.');
    const conteudo = await fetchJson(PATH_DIA(dia.arquivo));

    if (Array.isArray(conteudo.blocos)) {
      // Estrutura nova com "blocos": mapeia por id
      eventos = {};
      for (const bloco of conteudo.blocos) {
        if (bloco?.id) eventos[bloco.id] = bloco;
      }

      // Define o primeiro evento se nenhum estiver salvo
      if (!eventoAtual || !eventos[eventoAtual]) {
        eventoAtual = conteudo.blocos[0]?.id || null;
      }
    } else {
      // Estrutura antiga (objeto com chaves=ids)
      eventos = conteudo || {};
      if (!eventoAtual || !eventos[eventoAtual]) {
        const chaves = Object.keys(conteudo || {});
        eventoAtual = chaves.length ? chaves[0] : null;
      }
    }

    if (!eventoAtual || !eventos[eventoAtual]) {
      throw new Error(`Sem bloco inicial resolvível no dia "${dia.nome || dia.arquivo}".`);
    }

    executarEvento(eventoAtual);
  } catch (erro) {
    console.error(`Erro ao carregar o dia: ${dia?.nome || dia?.arquivo || '(desconhecido)'}`, erro);
    // fallback suave: tenta avançar para o próximo dia, se houver
    tentarAvancarOuFinalizar();
  }
}

/**
 * Renderiza um evento por id, persiste e delega UI ao renderer.
 * O `renderer` é quem cria os botões e dispara 'opcaoSelecionada'.
 */
export function executarEvento(id) {
  const evento = eventos[id];
  if (!evento) {
    console.error(`Evento "${id}" não encontrado`);
    tentarAvancarOuFinalizar();
    return;
  }

  eventoAtual = id;
  salvarProgresso({ diaAtual, eventoAtual, build: buildAtual });

  // Delega a renderização: o renderer cria botões e dispara 'opcaoSelecionada'
  try {
    renderizarEvento(evento);
  } catch (e) {
    console.error('Falha ao renderizar evento:', e);
    tentarAvancarOuFinalizar();
  }
}

/**
 * Trata a escolha do jogador: define próximo evento, atualiza build,
 * ou conclui o dia quando não há próximo/finais.
 */
function aoEscolherOpcao(proximoId, buildImpact, npcId) {
  // Atualiza build atual se veio impacto específico
  if (typeof buildImpact === 'string' && buildImpact.trim()) {
    buildAtual = buildImpact.trim().toLowerCase();
  }

  // Resolve próximo evento
  let proximo = null;

  if (proximoId && typeof proximoId === 'string') {
    proximo = eventos[proximoId] || null;
  }

  // Se o alvo não existir, tenta um bloco de fim dentro do dia
  if (!proximo) {
    proximo = Object.values(eventos).find(ev => String(ev?.tipo).toLowerCase() === 'fim') || null;
  }

  if (proximo) {
    executarEvento(proximo.id);
    return;
  }

  // Sem próximo e sem FIM → avança de dia
  avancarDia();
}

/**
 * Avança o índice do dia e carrega o próximo; se acabou, finaliza.
 */
function avancarDia() {
  diaAtual++;
  eventoAtual = null;

  if (diaAtual < dias.length) {
    carregarDia(dias[diaAtual]);
  } else {
    // Fim da campanha (este módulo não conhece "mostrarCreditos", então final suave)
    console.log('🏁 Fim do jogo (eventos.js). Obrigado por jogar.');
    resetarProgresso();
  }
}

/**
 * Tenta avançar para o próximo dia; se não houver, finaliza.
 */
function tentarAvancarOuFinalizar() {
  if (diaAtual + 1 < dias.length) {
    avancarDia();
  } else {
    console.log('🏁 Fim do jogo (falha ao carregar último dia).');
    resetarProgresso();
  }
}

/**
 * Zera progresso e recomeça do primeiro dia do catálogo.
 */
function resetarProgresso() {
  diaAtual = 0;
  eventoAtual = null;
  buildAtual = 'profano';
  salvarProgresso({ diaAtual, eventoAtual, build: buildAtual });
  iniciarJogo();
}

/* -------------------------------
 * Integração com o renderer:
 * - renderer dispara 'opcaoSelecionada' com detail { proximo, build, npc, ... }
 * - aqui apenas atualizamos estado e seguimos fluxo
 * -------------------------------*/
document.addEventListener('opcaoSelecionada', (e) => {
  const det = e?.detail || {};
  const proximo = det.proximo || null;
  const build = det.build || null;
  const npc = det.npc || null;
  aoEscolherOpcao(proximo, build, npc);
});

// Expor funções, se necessário em main.js
export const jogo = {
  iniciar: iniciarJogo,
  executar: executarEvento,
  resetar: resetarProgresso,
  getBuild: () => buildAtual,
  getDia: () => dias[diaAtual]?.nome || '???'
};
