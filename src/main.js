// 🎨 ORDEM IMPORTANTE (do mais genérico → para o mais específico)

// Base / layout comuns
import './styles/base.css';

// HUD, evento e botões
import './styles/hud.css';
import './styles/evento.css';
import './styles/botoes.css';

// Utilitários e UI
import './styles/dicas.css';
import './styles/titulo-animado.css';
import './styles/tooltip-hud.css';
import './styles/intro.css';
import './styles/reward-choice.css';

// Tema (grimório/caverna) e patch responsivo
import './styles/tema.css';
import './styles/patch-responsivo-ritual-v1.css';

// 🔧 Hotfix deve ser sempre o ÚLTIMO para prevalecer
import './styles/hotfix.css';

// 🔧 Núcleo
import { renderizarEvento } from './core/renderer.js';
import { carregarDiaAtual, salvarProgresso, avancarDia } from './core/storage.js';
import { atualizarHUD } from './ui/hud.js';
import { dispararNPC } from './core/npc.js';
import {
  registrarEscolha,
  buildDominante,
  resetarBuild,
  registrarInteracaoNPC,
  resetarInteracoesNPC,
} from './core/buildTracker.js';

import './ui/dicas.js';
import './ui/fog.js';

// ✨ UI Rewards
import { playChoiceReward, pulseBuildBadge } from './ui/rewardChoice.js';

// ✨ UI mostrarCreditos
import { mostrarCreditos } from './ui/credits.js';

// 📊 Estado global
let estado = {
  diaAtual: 1,
  eventoAtual: null,
  eventos: [],
  build: 'profano',
  nomeDia: '',
};

const eventoContainer = document.getElementById('evento');

/* ---------------------------------------
 *   Boot
 * ----------------------------------------*/
async function iniciarJogo() {
  try {
    console.log('🎮 Iniciando jogo...');
    const progressoSalvo = carregarDiaAtual();
    if (progressoSalvo) {
      estado = progressoSalvo;
      console.log('📁 Progresso carregado:', progressoSalvo);
    }

    // 🔒 Normalizações leves (sem reset destrutivo)
    // - diaAtual mínimo = 1
    if (!Number.isFinite(estado.diaAtual) || estado.diaAtual < 1) {
      estado.diaAtual = 1;
    }
    // - se a âncora traz um "fim*" de outro dia, ignore no boot do novo dia
    if (typeof estado.eventoAtualId === 'string' && /^fim/i.test(estado.eventoAtualId)) {
      estado.eventoAtualId = null;
      try { salvarProgresso({ diaAtual: estado.diaAtual, eventoAtualId: null }); } catch {}
    }

    // 🔑 Preserve a build do save para exibir coerente no novo dia
    const buildInicial = typeof estado.build === 'string' ? estado.build : 'profano';

    // Carrega o dia atual (dinâmico; se não existir, o próprio carregamento tratará)
    await carregarDia(estado.diaAtual);

    // Aplica HUD/título com a build salva (sem recalcular dominante agora)
    estado.build = buildInicial;
    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);

    // Zera apenas o acumulador diário (não mexe no rótulo atual da build)
    try { resetarBuild(); } catch {}

  } catch (err) {
    console.error('💥 Falha ao iniciar o jogo:', err);
  }
}
/* ---------------------------------------
 *   Carregar e preparar o dia
 * ----------------------------------------*/
async function carregarDia(numeroDia) {
  try {
    const url = `/data/dia${numeroDia}.json`;
    const resposta = await fetch(url);

    if (!resposta.ok) {
      // 👉 Dia inexistente: encerramento elegante com Créditos
      throw new Error(`Dia ${numeroDia} indisponível (${resposta.status} ${resposta.statusText}).`);
    }

    const textoBruto = await resposta.text();
    const dadosDia = JSON.parse(textoBruto);

    // Eventos do dia
    const blocos = Array.isArray(dadosDia.blocos) ? dadosDia.blocos : [];
    estado.eventos = blocos;
    estado.nomeDia = dadosDia.nome || `Dia ${numeroDia}`;

    // Se o JSON está vazio/sem blocos, trate como final (Créditos)
    if (blocos.length === 0) {
      throw new Error(`Dia ${numeroDia} sem blocos válidos.`);
    }

    // Seleção do bloco inicial guiada por âncora (ignorando âncoras "fim*")
    const ancoraValida =
    (typeof estado.eventoAtualId === 'string' && !/^fim/i.test(estado.eventoAtualId))
    ? estado.eventoAtualId
    : null;

    const blocoInicial = ancoraValida
    ? (blocos.find(b => b?.id === ancoraValida) || blocos[0] || null)
    : (blocos[0] || null);

    if (!blocoInicial) {
      // Sem bloco inicial resolvível → final (Créditos)
      throw new Error(`Dia ${numeroDia} sem bloco inicial resolvível.`);
    }

    estado.eventoAtual = blocoInicial;

    // Tooltip do botão "DIA"
    const hudDia = document.getElementById('hud-dia');
    if (hudDia) {
      if (dadosDia.fraseInspiradora) {
        hudDia.setAttribute('data-frase', dadosDia.fraseInspiradora);
      } else {
        hudDia.removeAttribute('data-frase');
      }
    }

    // HUD coerente com a build atual
    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);

    // Persiste âncora leve do bloco atual (se houver)
    try {
      const idAtual = typeof blocoInicial.id === 'string' ? blocoInicial.id : null;
      salvarProgresso({ diaAtual: numeroDia, eventoAtualId: idAtual });
    } catch {}

    // Renderização
    renderizarEvento(estado.eventoAtual, eventoContainer);

  } catch (erro) {
    console.error('❌ Erro ao carregar o dia:', erro);

    // 👉 Encerramento elegante com Créditos, respeitando a build atual
    try {
      mostrarCreditos({
        build: estado.build || 'misto',
        stats: {} // opcional: passe métricas agregadas aqui
      });
    } catch (e2) {
      // Fallback visual se, por algum motivo, os créditos não puderem ser exibidos
      eventoContainer.innerHTML = `
      <div class="erro">
      <p>⚠️ Dia não encontrado ou JSON inválido.</p>
      <p>Se você pretendia jogar o Dia ${numeroDia}, verifique se o arquivo <code>data/dia${numeroDia}.json</code> existe e está válido.</p>
      </div>
      `;
    }
  }
}

/* ---------------------------------------
 *   Visual — título ritualístico
 * ----------------------------------------*/
function atualizarGlowTitulo(build) {
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);

  const titulo = document.querySelector('.titulo-animado');
  if (titulo) {
    // reativa o glow para animar transição de cor conforme a build
    titulo.classList.remove('glow');
    setTimeout(() => titulo.classList.add('glow'), 50);
  }
}

/* ---------------------------------------
 *   Avanço de dia
 * ----------------------------------------*/
document.addEventListener('avancarDia', () => {
  try {
    resetarInteracoesNPC?.();
  } catch {}
  avancarDia(estado);
});

/* ---------------------------------------
 *   Escolha do jogador (evento vindo do renderer)
 * ----------------------------------------*/
document.addEventListener('opcaoSelecionada', (e) => {
  // e.detail = { proximo, build, npc, fraseChave }
  const dados = { ...e.detail };

  // 1) registra build e recalcula dominante
  if (dados.build) registrarEscolha(dados.build);
  estado.build = buildDominante();

  // 2) feedback visual (reward + pulso no badge)
  try {
    playChoiceReward(estado.build);
    pulseBuildBadge();
  } catch (err) {
    // silencioso: caso CSS/JS do reward não exista
  }

  // 3) encontra próximo evento
  let proximoEvento = estado.eventos.find((ev) => ev.id === dados.proximo);

  // se não houver, tenta bloco de FIM
  if (!proximoEvento) {
    proximoEvento = estado.eventos.find((ev) => ev.tipo === 'fim');
    if (!proximoEvento) {
      console.warn('⚠️ Evento de destino e de fim não encontrados.');
      avancarDia(estado);
      return;
    }
  }

  // 4) atualiza estado, HUD e render
  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);

  // Deixe o renderer decidir se há NPC e disparar o diálogo.
  renderizarEvento(proximoEvento, eventoContainer);

});

/* ---------------------------------------
 *   Resposta de NPC (seu sistema de NPC aciona este evento)
 * ----------------------------------------*/
// Mapeia tones → build (mesmo mapa do NPC)

const TONE2BUILD = {
  'virtuoso': 'virtuoso',
  'firmeza-respeitosa': 'virtuoso',
  'cético-educado': 'anomalia',
  'humor-leve': 'anomalia',
  'pedir-detalhe': 'virtuoso',
  'silencio-atento': 'virtuoso',
  'profano': 'profano',
  'anomalia': 'anomalia'
};

document.addEventListener('respostaNPC', (event) => {
  const det = event?.detail || {};
  const buildEscolha = det.build || TONE2BUILD[det.tone] || null;
  const impacto = det.impacto || null;

  // 1) Aplica moral de forma atômica (se você tiver registrarEscolhaComImpacto)
  try {
    if (typeof registrarEscolhaComImpacto === 'function') {
      registrarEscolhaComImpacto(buildEscolha || buildDominante(), impacto || undefined);
    } else {
      if (buildEscolha) registrarEscolha(buildEscolha);
      // se não tiver a helper, aplica impacto manualmente (se você tiver aplicarImpacto):
      if (impacto && typeof aplicarImpacto === 'function') aplicarImpacto(impacto);
    }
  } catch (e) {
    // fallback silencioso
    if (buildEscolha) registrarEscolha(buildEscolha);
  }

  // 2) Registra a interação completa (nome/fala/tone/impacto)
  if (typeof registrarInteracaoNPC === 'function') {
    registrarInteracaoNPC({
      idNPC: det.idNPC,
      nome: det.nome,         // virá do npc.js atualizado; se não vier, renderer resolve por id
      fala: det.fala,         // idem
      caminho: buildEscolha || det.build || det.caminho || buildDominante(),
                          tone: det.tone || null,
                          impacto: impacto || null
    });
  }

  // 3) Recalcula estado visual pós-escolha
  estado.build = buildDominante();
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);

  // 4) Decide o próximo bloco de forma JUSTA
  const eventoAtual = estado.eventoAtual;
  if (!eventoAtual?.opcoes?.length) return; // nada a seguir

  // preferir opção cujo buildImpact combine com a escolha (ou com mapeamento de tone)
  const prefer = buildEscolha || TONE2BUILD[det.tone] || null;

  let proximoId = null;
  if (prefer) {
    const match = eventoAtual.opcoes.find(o => o.buildImpact === prefer);
    if (match) proximoId = match.proximo || null;
  }

  // fallback: se alguma opção aponta para fim, usa; caso contrário, a primeira
  if (!proximoId) {
    const fim = eventoAtual.opcoes.find(o => o.proximo && o.proximo.toLowerCase().includes('fim'));
    proximoId = fim?.proximo || eventoAtual.opcoes[0]?.proximo || null;
  }
  if (!proximoId) return;

  // 5) Avança
  const proximoEvento = estado.eventos.find((e) => e.id === proximoId);
  if (!proximoEvento) return;

  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  renderizarEvento(proximoEvento, eventoContainer);
});

/* ---------------------------------------
 *   Intro + início
 * ----------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  // Título: typing + glow dinâmico
  const titulo = document.querySelector('.titulo-animado');
  if (titulo && !titulo.classList.contains('glow')) {
    const textoTitulo = titulo.textContent || '';
    titulo.style.animation = `
    typing 3.5s steps(${textoTitulo.length || 24}, end) forwards,
                          blink-caret 0.75s step-end infinite
                          `;
                          setTimeout(() => titulo.classList.add('glow'), 3600);
  }

  // Impede o título de bloquear cliques
  const tituloRitual = document.querySelector('.titulo-ritual');
  if (tituloRitual) tituloRitual.style.pointerEvents = 'none';

  // Cinemática de abertura (opcional)
  const intro = document.getElementById('intro-cinematica');
  const texto = document.getElementById('intro-texto');
  const botaoPular = document.getElementById('pular-intro');

  const introExibida = localStorage.getItem('introExibida');
  const progressoSalvo = JSON.parse(localStorage.getItem('progresso') || 'null');
  const diaAtual = progressoSalvo?.diaAtual ?? 1;
  const deveExibirIntro = !introExibida && diaAtual === 1;

  if (deveExibirIntro && intro && texto && botaoPular) {
    intro.classList.add('mostrar');

    const frases = [
      '☉ What Is Life',
      'Um jogo sobre moralidade, escolhas e degeneração.',
      'Você será julgado.',
      'E você sabe disso.',
      '...',
      'Comece.',
    ];

    let i = 0;
    const exibirFrase = () => {
      if (i >= frases.length) {
        esconderIntro();
        iniciarJogo();
        return;
      }
      texto.innerHTML = frases[i++];
      setTimeout(exibirFrase, 2200);
    };

    const esconderIntro = () => {
      intro.classList.add('ocultar');
      localStorage.setItem('introExibida', 'true');
    };

    botaoPular.addEventListener('click', () => {
      esconderIntro();
      iniciarJogo();
    });

    exibirFrase();
  } else {
    // sem intro — segue o jogo
    setTimeout(() => {
      if (intro) intro.classList.add('ocultar');
      iniciarJogo();
    }, 30);
  }
});

