import { dispararNPC } from './npc.js'; // Certifique-se de ajustar o caminho se necessário

import { buildDominante, historicoBuilds } from './buildTracker.js';

const eventoContainer = document.getElementById('evento');

/**
 * Renderiza um evento na tela com efeitos e interações.
 * Suporta eventos do tipo padrão e tipo 'fim' com lógica própria.
 */
export function renderizarEvento(evento, destino = eventoContainer) {
  if (!destino || !evento) {
    console.error('🛑 Destino ou evento inválido.', { destino, evento });
    return;
  }

  const { titulo, descricao, opcoes = [], tipo = 'padrão', npc } = evento;

  // 🌌 Tipo "fim" recebe ritual completo
  if (tipo === 'fim') {
    const build = buildDominante();
    const contagem = historicoBuilds();
    const frase = evento.fraseChave || (evento.opcoes?.[0]?.fraseChave || 'desconhecida');

    const reflexao = {
      virtuoso: "Você tentou fazer o certo, mesmo sem garantias. Há luz em sua bússola.",
      profano: "Você cedeu à rotina e à ausência. Mas ainda há tempo para reacender.",
      anomalia: "Você recusou as regras. Talvez tenha visto algo que ninguém viu."
    }[build] || "Você caminhou... mas ainda não se revelou por inteiro.";

    const sugestao = {
      virtuoso: "Amanhã pode ser um dia de coragem.",
      profano: "O próximo dia testará sua apatia.",
      anomalia: "O inesperado aguarda no escuro."
    }[build] || "A próxima página está em branco.";

    const htmlFinal = `
    <div class="evento-fim fade-in" aria-live="polite">
    <h2>🕯️ ${titulo}</h2>
    <p>${descricao}</p>
    <div class="relatorio-final">
    <p><strong>🧭 Caminho dominante:</strong> ${build.toUpperCase()}</p>
    <p><strong>🧮 Escolhas:</strong> Virtuoso: ${contagem.virtuoso || 0} · Profano: ${contagem.profano || 0} · Anomalia: ${contagem.anomalia || 0}</p>
    <p><strong>🧩 Frase-chave final:</strong> "${frase}"</p>
    <p><strong>💭 Reflexão:</strong> ${reflexao}</p>
    <p><strong>🔮 Presságio:</strong> ${sugestao}</p>
    </div>
    <button id="btn-proximo-dia" class="ritual-final-btn">
    ▶️ Avançar para o próximo dia
    </button>
    </div>
    `;

    destino.innerHTML = htmlFinal;

    const botao = document.getElementById('btn-proximo-dia');
    botao?.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      ripple.style.left = `${e.offsetX}px`;
      ripple.style.top = `${e.offsetY}px`;
      botao.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);

      const evento = new CustomEvent('avancarDia');
      document.dispatchEvent(evento);
    });

    return;
  }

  // 🧠 Função de renderização principal do bloco
  const renderizarBloco = () => {
    const html = `
    <div class="evento-bloco fade-in" aria-live="polite">
    <h2>${titulo}</h2>
    <p>${descricao}</p>
    ${
      opcoes.length > 0
      ? `<div class="opcoes">
      ${opcoes
        .map(
          (opcao) => `
          <div class="opcao-bloco">
          <button
          class="btn-opcao efeito-${opcao.efeitoTexto || 'nenhum'}"
          title="${opcao.dica || ''}"
          data-id='${JSON.stringify({
            proximo: opcao.proximo,
            build: opcao.buildImpact || null,
            npc: opcao.npc || null,
            fraseChave: opcao.fraseChave || ''
          })}'
          >
          ${opcao.texto}
          </button>
          <span class="dica">${opcao.dica || ''}</span>
          </div>
          `
        )
        .join('')}
        </div>`
        : `<div class="sem-opcoes"><em>☕ Nada a escolher. Apenas sinta.</em></div>`
    }
    </div>`;

    destino.innerHTML = html;

    destino.querySelectorAll('.btn-opcao').forEach((botao) => {
      botao.addEventListener('click', () => {
        const dados = JSON.parse(botao.dataset.id);
        const eventoSelecionado = new CustomEvent('opcaoSelecionada', { detail: dados });
        document.dispatchEvent(eventoSelecionado);
      });
    });
  };

  // 👥 Se o evento tiver um NPC, mostra a fala antes de renderizar
  if (npc) {
    const buildAtual = document.body.className.match(/build-(\w+)/)?.[1] || 'profano';
    dispararNPC(npc, buildAtual, renderizarBloco);
  } else {
    renderizarBloco();
  }
}

