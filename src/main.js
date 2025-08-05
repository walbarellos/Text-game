// 📦 Importações de estilo
import './styles/base.css';
import './styles/hud.css';
import './styles/evento.css';
import './styles/botoes.css';
import './styles/tema.css';
import './styles/dicas.css';

// 🔧 Módulos centrais
import { renderizarEvento } from './core/renderer.js';
import { carregarDiaAtual, salvarProgresso, avancarDia } from './core/storage.js';
import { atualizarHUD } from './ui/hud.js';
import { dispararNPC } from './core/npc.js';
import { registrarEscolha, buildDominante, resetarBuild, registrarInteracaoNPC, resetarInteracoesNPC } from './core/buildTracker.js';
import './ui/dicas.js';
import './ui/fog.js';

// 📊 Estado Global
let estado = {
  diaAtual: 1,
  eventoAtual: null,
  eventos: [],
  build: 'profano',
  nomeDia: '',
};

const eventoContainer = document.getElementById('evento');

// 🚀 Início do jogo
async function iniciarJogo() {
  console.log('🎮 Iniciando jogo...');
  const progressoSalvo = carregarDiaAtual();

  if (progressoSalvo) {
    estado = progressoSalvo;
    console.log('📁 Progresso carregado:', progressoSalvo);
  }

  const maxDias = 7;
  if (estado.diaAtual > maxDias) {
    console.warn(`🧼 Dia ${estado.diaAtual} excede o máximo. Resetando...`);
    localStorage.clear();
    location.reload();
    return;
  }

  await carregarDia(estado.diaAtual);
  resetarBuild();
}

// 📂 Carrega JSON do dia e renderiza primeiro evento
async function carregarDia(numeroDia) {
  try {
    const resposta = await fetch(`/data/dia${numeroDia}.json`);
    if (!resposta.ok) throw new Error(`Status ${resposta.status} - ${resposta.statusText}`);

    const textoBruto = await resposta.text();
    console.log('📄 Conteúdo JSON recebido:', textoBruto);

    const dadosDia = JSON.parse(textoBruto);

    estado.eventos = dadosDia.blocos;
    estado.nomeDia = dadosDia.nome || `Dia ${numeroDia}`;
    const hudDia = document.getElementById('hud-dia');
    if (hudDia && dadosDia.fraseInspiradora) {
      hudDia.setAttribute('data-frase', dadosDia.fraseInspiradora);
    }

    estado.eventoAtual = dadosDia.blocos[0];

    atualizarHUD(estado.nomeDia, estado.build);
    atualizarGlowTitulo(estado.build);
    renderizarEvento(estado.eventoAtual, eventoContainer);
  } catch (erro) {
    console.error('❌ Erro ao carregar o dia:', erro);
    eventoContainer.innerHTML = `<p class="erro">⚠️ Dia não encontrado ou JSON inválido.</p>`;
    return;
  }
}

// 🎮 Ao escolher uma opção narrativa
function aoEscolherOpcao(opcao, callback) {
  const { proximo, build } = opcao;

  console.log('🧭 Opção escolhida:', opcao);

  if (build) {
    registrarEscolha(build);
    estado.build = buildDominante();
  }

  const proximoEvento = estado.eventos.find(ev => ev.id === proximo);

  if (!proximoEvento) {
    const blocoFinal = estado.eventos.find(ev => ev.tipo === 'fim');
    if (blocoFinal) {
      salvarProgresso(estado);
      estado.eventoAtual = blocoFinal;
      renderizarEvento(blocoFinal, eventoContainer);
      return;
    }

    avancarDia(estado);
    return;
  }

  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);

  estado.eventoAtual = proximoEvento;
  callback?.(proximoEvento);
}

// 🎯 Escuta escolhas do jogador (versão corrigida!)
document.addEventListener('opcaoSelecionada', (e) => {
  const dados = { ...e.detail };
  let proximoEvento = estado.eventos.find(ev => ev.id === dados.proximo);

  if (!proximoEvento) {
    proximoEvento = estado.eventos.find(ev => ev.tipo === 'fim');
    if (!proximoEvento) {
      console.warn('⚠️ Evento de destino e de fim não encontrados.');
      avancarDia(estado);
      return;
    }
  }

  // Atualiza o estado ANTES do NPC
  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, buildDominante());

  const continuar = () => {
    renderizarEvento(proximoEvento, eventoContainer);
  };

  if (dados.build) registrarEscolha(dados.build);
  estado.build = buildDominante();

  if (dados.npc) {
    dispararNPC(dados.npc, estado.build, continuar);
  } else {
    continuar();
  }
});

// 🔄 Avança para o próximo dia e reseta interações
document.addEventListener('avancarDia', () => {
  resetarInteracoesNPC();
  avancarDia(estado);
});

// 🚀 Inicia o jogo quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', iniciarJogo);

// ✨ Aplica build ao body e glow
function atualizarGlowTitulo(build) {
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);

  const titulo = document.querySelector('.titulo-animado');
  if (titulo) {
    titulo.classList.remove('glow');
    setTimeout(() => titulo.classList.add('glow'), 50);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const titulo = document.querySelector('.titulo-animado');
  if (titulo && !titulo.classList.contains('glow')) {
    const texto = titulo.textContent || '';
    titulo.style.animation = `
    typing 3.5s steps(${texto.length}, end) forwards,
                          blink-caret 0.75s step-end infinite
                          `;
                          setTimeout(() => {
                            titulo.classList.add('glow');
                          }, 3600);
  }

  const tituloRitual = document.querySelector('.titulo-ritual');
  if (tituloRitual) {
    tituloRitual.style.pointerEvents = 'none';
  }
});

// 💬 Registro de interação com NPC
document.addEventListener('respostaNPC', (e) => {
  const { build } = e.detail;
  const npc = estado.eventoAtual?.npc;

  registrarEscolha(build);
  registrarInteracaoNPC(npc, build);
  estado.build = buildDominante();
});
