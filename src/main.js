//📦 Importações de estilo
import './styles/base.css';
import './styles/hud.css';
import './styles/evento.css';
import './styles/botoes.css';
import './styles/tema.css';
import './styles/dicas.css';

//🔧 Patch
import './styles/patch-responsivo-ritual-v1.css';
import './styles/intro.css';

//🔧 Módulos centrais
import { renderizarEvento } from './core/renderer.js';
import { carregarDiaAtual, salvarProgresso, avancarDia } from './core/storage.js';
import { atualizarHUD } from './ui/hud.js';
import { dispararNPC } from './core/npc.js';
import { registrarEscolha, buildDominante, resetarBuild, registrarInteracaoNPC, resetarInteracoesNPC } from './core/buildTracker.js';
import './ui/dicas.js';
import './ui/fog.js';

//📊 Estado Global
let estado = {
  diaAtual: 1,
  eventoAtual: null,
  eventos: [],
  build: 'profano',
  nomeDia: '',
};

const eventoContainer = document.getElementById('evento');

//🚀 Início do jogo
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

//📂 Carrega JSON do dia e renderiza primeiro evento
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
  }
}

//✨ Atualiza cor do título e body conforme build
function atualizarGlowTitulo(build) {
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);

  const titulo = document.querySelector('.titulo-animado');
  if (titulo) {
    titulo.classList.remove('glow');
    setTimeout(() => titulo.classList.add('glow'), 50);
  }
}

//🎯 Opção narrativa escolhida
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
    } else {
      avancarDia(estado);
    }
    return;
  }

  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, estado.build);
  atualizarGlowTitulo(estado.build);
  estado.eventoAtual = proximoEvento;
  callback?.(proximoEvento);
}

//📌 Avança para o próximo dia e reseta interações
document.addEventListener('avancarDia', () => {
  resetarInteracoesNPC();
  avancarDia(estado);
});

//🎮 Captura escolhas do jogador
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

  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, buildDominante());

  const continuar = () => {
    renderizarEvento(proximoEvento, eventoContainer);
  };

  if (dados.build) registrarEscolha(dados.build);
  estado.build = buildDominante();

  if (proximoEvento.npc) {
    dispararNPC(proximoEvento.npc, estado.build, continuar);
  } else {
    continuar();
  }
});

//🤝 Interação com NPC
document.addEventListener('respostaNPC', (event) => {
  const build = event.detail.build;
  registrarEscolha(build);
  registrarInteracaoNPC();

  const eventoAtual = estado.eventoAtual;
  const proximoId = eventoAtual?.opcoes?.[0]?.proximo;
  if (!proximoId) return;

  const proximoEvento = estado.eventos.find(e => e.id === proximoId);
  if (!proximoEvento) return;

  estado.eventoAtual = proximoEvento;
  atualizarHUD(estado.nomeDia, buildDominante());
  renderizarEvento(proximoEvento);
});

//🎬 Intro + Init
document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro-cinematica');
  const texto = document.getElementById('intro-texto');
  const botaoPular = document.getElementById('pular-intro');
  const titulo = document.querySelector('.titulo-animado');
  const tituloRitual = document.querySelector('.titulo-ritual');

  // ⚙️ Efeito digitando no título
  if (titulo && !titulo.classList.contains('glow')) {
    const textoTitulo = titulo.textContent || '';
    titulo.style.animation = `
    typing 3.5s steps(${textoTitulo.length}, end) forwards,
                          blink-caret 0.75s step-end infinite
                          `;
                          setTimeout(() => titulo.classList.add('glow'), 3600);
  }

  if (tituloRitual) {
    tituloRitual.style.pointerEvents = 'none';
  }

  // 🎥 Controle da intro
  const introExibida = localStorage.getItem('introExibida');
  const progressoSalvo = JSON.parse(localStorage.getItem('progresso'));
  const diaAtual = progressoSalvo?.diaAtual || 1;
  const deveExibirIntro = !introExibida && diaAtual === 1;

  if (deveExibirIntro && intro && texto && botaoPular) {
    intro.classList.add('mostrar'); // 👈 garante exibição
    const frases = [
      '☉ What Is Life',
      'Um jogo sobre moralidade, escolhas e degeneração.',
      'Você será julgado.',
      'E você sabe disso.',
      '...',
      'Comece.'
    ];

    let i = 0;

    const exibirFrase = () => {
      if (i >= frases.length) {
        esconderIntro();
        iniciarJogo();
        return;
      }

      texto.innerHTML = frases[i];
      i++;
      setTimeout(exibirFrase, 2500);
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
    setTimeout(() => {
      if (intro) intro.classList.add('ocultar');
      iniciarJogo();
    }, 50); // delay mínimo p/ evitar corridas visuais
  }

});
