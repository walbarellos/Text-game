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
    // 🧠 Define tooltip com frase inspiradora (se existir no JSON)
    const hudDia = document.getElementById('hud-dia');
    if (hudDia && dadosDia.fraseInspiradora) {
      hudDia.setAttribute('data-frase', dadosDia.fraseInspiradora);
    }

    estado.eventoAtual = dadosDia.blocos[0];

    atualizarHUD(estado.nomeDia, estado.build);
    renderizarEvento(estado.eventoAtual, eventoContainer);
  } catch (erro) {
    console.error('❌ Erro ao carregar o dia:', erro);
    eventoContainer.innerHTML = `<p class="erro">⚠️ Dia não encontrado ou JSON inválido.</p>`;
    return; // ⬅️ ISSO AQUI É O QUE FALTAVA!

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

  // 🔚 Se chegou ao fim do dia
  if (!proximoEvento) {
    const blocoFinal = estado.eventos.find(ev => ev.tipo === 'fim');

    if (blocoFinal) {
      estado.eventoAtual = blocoFinal;
      salvarProgresso(estado);
      renderizarEvento(blocoFinal, eventoContainer);
      return;
    }

    // ⚠️ Fallback (não deveria ocorrer)
    avancarDia(estado);
    return;
  }

  // 🔁 Segue fluxo normal
  estado.eventoAtual = proximoEvento;
  salvarProgresso(estado);
  atualizarHUD(estado.nomeDia, estado.build);

  if (npc) {
    dispararNPC(npc, estado.build, () => {
      renderizarEvento(proximoEvento, eventoCcontainer);
    });
  } else {
    renderizarEvento(proximoEvento, eventoContainer);
  }
}

// 🎯 Escuta escolhas do jogador
document.addEventListener('opcaoSelecionada', (e) => {
  aoEscolherOpcao(e.detail);
});

// ⏭️ Escuta clique no botão de avanço de dia
document.addEventListener('avancarDia', () => {
  avancarDia(estado);
});

// 🔁 Inicializa
document.addEventListener('DOMContentLoaded', iniciarJogo);
