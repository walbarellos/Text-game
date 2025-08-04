// src/core/eventos.js

import { renderizarEvento } from '../ui/renderer.js';
import { salvarProgresso, carregarProgresso } from '../core/storage.js';

let dias = [];
let eventos = {};
let diaAtual = 0;
let eventoAtual = null;
let buildAtual = 'profano';

const PATH_DIAS = 'data/dias.json';
const PATH_DIA = (arquivo) => `data/${arquivo}`;

export async function iniciarJogo() {
  const progresso = carregarProgresso();
  if (progresso) {
    diaAtual = progresso.diaAtual;
    eventoAtual = progresso.eventoAtual;
    buildAtual = progresso.build;
  }

  dias = await fetchJson(PATH_DIAS);
  await carregarDia(dias[diaAtual]);
}

async function carregarDia(dia) {
  try {
    const conteudo = await fetchJson(PATH_DIA(dia.arquivo));

    if (Array.isArray(conteudo.blocos)) {
      // estrutura nova com "blocos"
      eventos = {};
      for (const bloco of conteudo.blocos) {
        eventos[bloco.id] = bloco;
      }

      // Define o primeiro evento se nenhum estiver salvo
      eventoAtual = eventoAtual || conteudo.blocos[0]?.id;
    } else {
      // estrutura antiga
      eventos = conteudo;
      eventoAtual = eventoAtual || Object.keys(conteudo)[0];
    }

    executarEvento(eventoAtual);
  } catch (erro) {
    console.error(`Erro ao carregar o dia: ${dia.nome}`, erro);
  }
}

export function executarEvento(id) {
  const evento = eventos[id];
  if (!evento) {
    console.error(`Evento ${id} não encontrado`);
    return;
  }

  eventoAtual = id;
  salvarProgresso({ diaAtual, eventoAtual, build: buildAtual });

    const containerOpcoes = destino.querySelector('.opcoes');

    // ⚠️ Só renderiza botões se houver opções
    if (Array.isArray(evento.opcoes)) {
      evento.opcoes.forEach((opcao) => {
        const botao = document.createElement('button');
        botao.className = 'btn-opcao';
        botao.textContent = opcao.texto;
        botao.addEventListener('click', () => {
          aoEscolherOpcao(opcao.proximo, opcao.buildImpact || buildAtual, opcao.npc || null);
        });
        containerOpcoes.appendChild(botao);
      });
    } else {
      // Tipo fim, sem opções — espera alguns segundos e avança
      setTimeout(() => {
        aoEscolherOpcao('FIM_DO_DIA');
      }, 4000); // tempo para exibir o texto final antes de avançar
    }
  }
}

function avancarDia() {
  diaAtual++;
  eventoAtual = null;
  if (diaAtual < dias.length) {
    carregarDia(dias[diaAtual]);
  } else {
    alert('🏁 Fim do jogo. Obrigado por jogar.');
    resetarProgresso();
  }
}

function resetarProgresso() {
  diaAtual = 0;
  eventoAtual = null;
  buildAtual = 'profano';
  salvarProgresso({ diaAtual, eventoAtual, build: buildAtual });
  iniciarJogo();
}

async function fetchJson(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Erro ao carregar ${caminho}`);
  return resposta.json();
}

// Expor funções para uso global (por exemplo em main.js)
export const jogo = {
  iniciar: iniciarJogo,
  executar: executarEvento,
  resetar: resetarProgresso,
  getBuild: () => buildAtual,
  getDia: () => dias[diaAtual]?.nome || '???'
};
