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
import { registrarEscolha, buildDominante, resetarBuild } from './core/buildTracker.js';
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
function aoEscolherOpcao(opcao) {
  const { proximo, build, npc } = opcao;

  console.log('🧭 Opção escolhida:', { proximo, build, npc });

  if (build) {
    registrarEscolha(build);
    estado.build = buildDominante();
  }

  const proximoEvento = estado.eventos.find(ev => ev.id === proximo);

  if (!proximoEvento) {
    const blocoFinal = estado.eventos.find(ev => ev.tipo === 'fim');

    if (blocoFinal) {
      estado.eventoAtual = blocoFinal;
      salvarProgresso(estado);
      renderizarEvento(blocoFinal, eventoContainer);
      return;
    }

    avancarDia(estado);
    return;
  }

  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);

  if (npc) {
    dispararNPC(npc, estado.build, () => {
      renderizarEvento(proximoEvento, eventoContainer);
    });
  } else {
    renderizarEvento(proximoEvento, eventoContainer);
  }
}

// 🎯 Escuta escolhas do jogador
document.addEventListener('opcaoSelecionada', (e) => {
  aoEscolherOpcao(e.detail);
});

document.addEventListener('avancarDia', () => {
  avancarDia(estado);
});

document.addEventListener('DOMContentLoaded', iniciarJogo);



// ✨ Aplica build ao body e glow
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

// 🔧 Corrigir sobreposição do título à HUD
document.addEventListener('DOMContentLoaded', () => {
  const tituloRitual = document.querySelector('.titulo-ritual');
  if (tituloRitual) {
    tituloRitual.style.pointerEvents = 'none';
  }
});


