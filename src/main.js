// 📁 src/main.js
import './performance-guard.js'; // PRIMEIRO
import './ui/fundo-geom.js'; // stub
import './ui/fog.js';       // stub

// Core
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

import {
  criarEstadoNarrativo,
  serializarEstadoNarrativo,
  deserializarEstadoNarrativo,
  aplicarConsequencia,
  eventoDisponivel,
  verificarExpiracoes,
  calcularBuild,
  registrarHistorico
} from './core/state-extensions.js';
import { salvar, carregar, temSave } from './core/save.js';
import { carregarEventosDoDia, filtrarEventosDisponiveis, carregarQuests } from './core/event-loader.js';

// UI
import { iniciarIntro } from './ui/intro.js';
import { abrirDiario } from './ui/diario.js';
import { transicaoDia, transicaoFinal } from './ui/dia-transicao.js';
import { playChoiceReward, pulseBuildBadge } from './ui/rewardChoice.js';
import { mostrarCreditos } from './ui/credits.js';
import { inicializarPatch, processarEscolha, avancarDia as avancarDiaPatch } from './core/renderer-patch.js';

// Styles
import './styles/base.css';
import './styles/hud.css';
import './styles/evento.css';
import './styles/botoes.css';
import './styles/dicas.css';
import './styles/titulo-animado.css';
import './styles/tooltip-hud.css';
import './styles/intro.css';
import './styles/reward-choice.css';
import './styles/tema.css';
import './styles/patch-responsivo-ritual-v1.css';
import './styles/hotfix.css';
import './styles/embed-fix.css';

// 📊 Estado global harmonizado
let estado = {
  ...criarEstadoNarrativo(),
  dia: 1,
  build: 'anomalia', // Default explícito
  nomeDia: 'Dia 1',
  eventoAtual: null,
  eventos: [],
};

const eventoContainer = document.getElementById('evento');

/* ---------------------------------------
 *   Boot
 * ----------------------------------------*/
async function iniciarJogo() {
  try {
    console.log('🎮 Iniciando jogo...');
    const raw = await carregar();
    if (raw) {
      const carregado = deserializarEstadoNarrativo(raw);
      Object.assign(estado, carregado);
      console.log('📁 Progresso carregado:', estado);
    }

    if (!Number.isFinite(estado.dia) || estado.dia < 1) estado.dia = 1;
    
    // Define build baseado no karma carregado (ou padrão)
    estado.build = calcularBuild(estado.karma);
    estado.nomeDia = `Dia ${estado.dia}`;

    await inicializarPatch(estado);
    await carregarDia(estado.dia);

    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);

  } catch (err) {
    console.error('💥 Falha ao iniciar o jogo:', err);
  }
}

/* ---------------------------------------
 *   Carregar e preparar o dia
 * ----------------------------------------*/
async function carregarDia(numeroDia) {
  try {
    console.log(`[carregarDia] numeroDia = ${numeroDia}`);
    const eventosValidos = await avancarDiaPatch(numeroDia);
    
    if (!eventosValidos || eventosValidos.length === 0) {
       console.warn('⚠️ Nenhum evento retornado para o dia', numeroDia);
       return;
    }

    estado.eventos = eventosValidos;
    estado.nomeDia = `Dia ${numeroDia}`;
    
    // Reset/Define evento inicial do dia
    estado.eventoAtual = eventosValidos[0];

    console.log(`[carregarDia] Renderizando evento inicial: ${estado.eventoAtual?.titulo}`);

    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);
    renderizarEvento(estado.eventoAtual, eventoContainer);

  } catch (erro) {
    console.error('❌ Erro ao carregar o dia:', erro);
    eventoContainer.innerHTML = `<div class="erro"><p>⚠️ Falha ao carregar o Dia ${numeroDia}.</p></div>`;
  }
}

function atualizarGlowTitulo(build) {
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);
  const titulo = document.querySelector('.titulo-animado');
  if (titulo) {
    titulo.classList.remove('glow');
    setTimeout(() => titulo.classList.add('glow'), 50);
  }
}

async function proximoDiaDisponivel(diaAtual) {
  try {
    const r = await fetch(new URL('./data/dias.json', document.baseURI), { cache: 'no-store' });
    if (!r.ok) return null;
    const dias = await r.json();
    const max = Array.isArray(dias) ? dias.length : 13;
    const candidato = Number(diaAtual) + 1;
    return candidato <= max ? candidato : null;
  } catch { return null; }
}

document.addEventListener('avancarDia', async () => {
  try { resetarInteracoesNPC?.(); } catch {}
  
  const prox = await proximoDiaDisponivel(estado.dia);
  if (!prox) {
    try { mostrarCreditos({ build: estado.build || 'misto' }); } catch {}
    return;
  }
  
  if (prox === 13) await transicaoFinal();
  else await transicaoDia(prox);
  
  estado.dia = prox;
  estado.eventoAtual = null;
  await salvar(serializarEstadoNarrativo(estado));
  window.location.reload();
});

/* ---------------------------------------
 *   Escolha do jogador
 * ----------------------------------------*/
document.addEventListener('opcaoSelecionada', async (e) => {
  const dados = { ...e.detail };
  console.log('[opcaoSelecionada]', dados.texto);

  try {
    const { buildAtualizado } = await processarEscolha(dados, estado.eventoAtual);
    if (buildAtualizado) estado.build = buildAtualizado;

    playChoiceReward(estado.build);
    pulseBuildBadge();

    let proximoEvento = null;
    if (dados.proximo) proximoEvento = estado.eventos.find((ev) => ev.id === dados.proximo);

    if (!proximoEvento) {
      const idx = estado.eventos.findIndex(ev => ev.id === estado.eventoAtual?.id);
      if (idx !== -1 && idx < estado.eventos.length - 1) proximoEvento = estado.eventos[idx + 1];
    }

    if (!proximoEvento) {
      console.log('[main] Fim dos eventos do dia.');
      document.dispatchEvent(new CustomEvent('avancarDia'));
      return;
    }

    estado.eventoAtual = proximoEvento;
    
    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);
    renderizarEvento(estado.eventoAtual, eventoContainer);
  } catch (err) {
    console.error('Erro ao processar escolha:', err);
  }
});

/* ---------------------------------------
 *   Resposta de NPC
 * ----------------------------------------*/
document.addEventListener('respostaNPC', (event) => {
  const det = event?.detail || {};
  console.log('[respostaNPC]', det.fala);

  const buildEscolha = det.build || null;
  const impacto = det.impacto || null;

  if (buildEscolha) registrarEscolha(buildEscolha);
  if (impacto) aplicarConsequencia(estado, { karma: impacto });

  registrarInteracaoNPC({
    idNPC: det.idNPC,
    nome: det.nome,
    fala: det.fala,
    caminho: buildEscolha || buildDominante()
  });

  estado.build = calcularBuild(estado.karma);
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);

  const escolhas = estado.eventoAtual?.escolhas || estado.eventoAtual?.opcoes || [];
  let proximoId = null;
  if (buildEscolha) {
    const match = escolhas.find(o => (o.buildImpact || o.build) === buildEscolha);
    proximoId = match?.proximo || null;
  }

  if (!proximoId && escolhas.length > 0) {
    const fim = escolhas.find(o => o.proximo?.toLowerCase().includes('fim'));
    proximoId = fim?.proximo || escolhas[0]?.proximo || null;
  }

  let proximoEvento = proximoId ? estado.eventos.find(e => e.id === proximoId) : null;
  if (!proximoEvento) {
    const idx = estado.eventos.findIndex(ev => ev.id === estado.eventoAtual?.id);
    if (idx !== -1 && idx < estado.eventos.length - 1) proximoEvento = estado.eventos[idx + 1];
  }

  if (!proximoEvento) {
    document.dispatchEvent(new CustomEvent('avancarDia'));
    return;
  }

  estado.eventoAtual = proximoEvento;
  renderizarEvento(proximoEvento, eventoContainer);
});

/* ---------------------------------------
 *   Intro + início
 * ----------------------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
  const telaInicial = document.getElementById('tela-inicial');
  const btnIniciar  = document.getElementById('btn-iniciar');
  const btnContinuar = document.getElementById('btn-continuar');

  if (await temSave()) btnContinuar?.removeAttribute('hidden');

  btnIniciar?.addEventListener('click', async () => {
    console.log('[main] Iniciar novo jogo');
    localStorage.clear();
    telaInicial?.classList.add('oculta');
    
    const introCinematica = document.getElementById('intro-cinematica');
    if (introCinematica) {
      introCinematica.classList.remove('oculta');
      
      // Iniciar carregamento em paralelo com a intro
      const pJogo = iniciarJogo(); 
      
      await iniciarIntro();
      await pJogo;
    } else {
      iniciarJogo();
    }
  });

  btnContinuar?.addEventListener('click', () => {
    console.log('[main] Botão Continuar clicado');
    telaInicial?.classList.add('oculta');
    iniciarJogo();
  });

  const btnDiario = document.getElementById('btn-diario');
  btnDiario?.addEventListener('click', () => abrirDiario(estado));

  const titulo = document.querySelector('.titulo-animado');
  if (titulo && !titulo.classList.contains('glow')) {
    const txt = titulo.textContent || '';
    titulo.style.animation = `typing 3.5s steps(${txt.length || 24}, end) forwards, blink-caret 0.75s step-end infinite`;
    setTimeout(() => titulo.classList.add('glow'), 3600);
  }
});
