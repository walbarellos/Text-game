// 📁 src/core/renderer.js
import { dispararNPC, getNPCNome } from './npc.js';
import {
  buildDominante,
  historicoBuilds,
  obterInteracoesNPC,
  registrarInteracaoNPC
} from './buildTracker.js';

// Efeitos de reward
import { playChoiceReward, rippleOnButton, pulseBuildBadge } from '../ui/rewardChoice.js';

const eventoContainer = document.getElementById('evento');

/* ---------------------------------------
 * Utilitários de render
 * --------------------------------------*/

/**
 * Substitui o conteúdo do destino de forma segura e performática.
 * Aceita string ou Node/DocumentFragment.
 */
function renderSafeHTML(destino, html) {
  if (!destino) return;
  if (html instanceof Node) {
    destino.replaceChildren(html);
    return;
  }
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html ?? '').trim();
  destino.replaceChildren(tpl.content);
}

/** Escape básico para strings que irão para HTML */
function escapeHTML(s) {
  return String(s ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
}

/**
 * Remove metanotas "Se ... → ..." em finais (sem alterar o resto do texto).
 */
function ocultarMetanotasDeFim(texto) {
  if (!texto) return '';
  let t = String(texto);

  // Remove linhas inteiras que contenham "Se ... → ..."
  t = t.split('\n').filter(l => !/\b[Ss]e\s[^→\n]+→/.test(l)).join('\n');

  // Remove metanota colada no fim da frase (mesma linha)
  t = t.replace(/\s*[–—-]?\s*\b[Ss]e\s[^→\n]+→[^\n]*/g, '');

  // Normaliza espaços em branco
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

/** Sobe a viewport pro topo do container ao trocar de bloco */
function scrollToTop(el) {
  try {
    (el ?? window).scrollTo?.({ top: 0, behavior: 'smooth' });
  } catch {}
}

/** Move o foco para o primeiro botão de opção (acessibilidade) */
function focusFirstOption(container) {
  try {
    const firstBtn = container?.querySelector?.('.opcoes .btn-opcao');
    (firstBtn ?? container)?.focus?.();
  } catch {}
}

/* ---------------------------------------
 * Render principal
 * --------------------------------------*/
export function renderizarEvento(evento, destino = eventoContainer) {
  if (!destino || !evento) {
    console.error('🛑 Destino ou evento inválido.', { destino, evento });
    return;
  }

  const {
    titulo = '—',
    descricao = '',
    opcoes = [],
    tipo = 'padrão',
    npc
  } = evento;

  // 🌌 Tela de fim do dia com relatório
  if (String(tipo).toLowerCase() === 'fim') {
    const build = buildDominante();
    const contagem = historicoBuilds();
    const interacoes = obterInteracoesNPC() || [];
    const frase = evento.fraseChave && String(evento.fraseChave).trim()
    ? evento.fraseChave
    : 'desconhecida';

    const reflexao = {
      virtuoso: 'Você tentou fazer o certo, mesmo sem garantias. Há luz em sua bússola.',
      profano:  'Você cedeu à rotina e à ausência. Mas ainda há tempo para reacender.',
      anomalia: 'Você recusou as regras. Talvez tenha visto algo que ninguém viu.'
    }[build] || 'Você caminhou... mas ainda não se revelou por inteiro.';

    const sugestao = {
      virtuoso: 'Amanhã pode ser um dia de coragem.',
      profano:  'O próximo dia testará sua apatia.',
      anomalia: 'O inesperado aguarda no escuro.'
    }[build] || 'A próxima página está em branco.';

    const resumoNPC = interacoes.length
    ? (() => {
      const itens = interacoes.map((i) => {
        const nome =
        i?.nome ||
        getNPCNome(i?.idNPC) ||   // <- puxa do cache carregado em npc.js
        i?.idNPC ||
        'NPC';
    const caminho = String(i?.caminho || i?.build || '—').toUpperCase();
    const fraseFalada = (i?.fala ?? i?.resposta ?? '…'); // evita “undefined”
    return `<li>${escapeHTML(nome)}: <em>${escapeHTML(fraseFalada)}</em> <small>(${escapeHTML(caminho)})</small></li>`;
      }).join('');
      return `
      <div class="relatorio-npc">
      <p><strong>📜 Diálogos com NPCs:</strong></p>
      <ul>${itens}</ul>
      </div>`;
    })()
    : `<p><em>💬 Nenhuma interação com NPC registrada.</em></p>`;

    const html = `
    <section class="evento-fim fade-in" aria-live="polite" aria-label="Relatório do dia">
    <h2>🕯️ ${escapeHTML(titulo)}</h2>
    <p>${escapeHTML(ocultarMetanotasDeFim(descricao))}</p>

    <div class="relatorio-final">
    <p><strong>🧭 Caminho dominante:</strong> ${escapeHTML(build.toUpperCase())}</p>
    <p><strong>🧮 Escolhas:</strong> Virtuoso: ${contagem.virtuoso || 0} · Profano: ${contagem.profano || 0} · Anomalia: ${contagem.anomalia || 0}</p>
    <p><strong>🧩 Frase-chave final:</strong> "${escapeHTML(frase)}"</p>
    <p><strong>💭 Reflexão:</strong> ${escapeHTML(reflexao)}</p>
    <p><strong>🔮 Presságio:</strong> ${escapeHTML(sugestao)}</p>
    ${resumoNPC}
    </div>

    <button id="btn-proximo-dia" class="ritual-final-btn" type="button" aria-label="Avançar para o próximo dia">
    ▶️ Avançar para o próximo dia
    </button>
    </section>
    `;

    renderSafeHTML(destino, html);
    scrollToTop(destino);

    document.getElementById('btn-proximo-dia')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('avancarDia'));
    });

    // micro-reward quando chega ao fim
    try { playChoiceReward(build); pulseBuildBadge(); } catch {}

    return;
  }

  // 🎭 Bloco comum (com reward ao clicar)
  const renderizarBloco = () => {
    const html = `
    <section class="evento-bloco fade-in" aria-live="polite">
    <h2>${escapeHTML(titulo)}</h2>
    <p>${escapeHTML(descricao)}</p>

    ${
      Array.isArray(opcoes) && opcoes.length > 0
      ? `<div class="opcoes" role="group" aria-label="Opções de escolha">
      ${opcoes.map(opcao => {
        const dados = {
          proximo:    opcao.proximo ?? null,
          build:      opcao.buildImpact ?? null,
          npc:        opcao.npc ?? null,
          fraseChave: opcao.fraseChave ?? ''
        };
        return `
        <div class="opcao-bloco">
        <button type="button"
        class="btn-opcao efeito-${escapeHTML(opcao.efeitoTexto || 'nenhum')}"
        title="${escapeHTML(opcao.dica || '')}"
        aria-label="${escapeHTML(opcao.texto || 'Opção')}"
        data-id='${encodeURIComponent(JSON.stringify(dados))}'>
        ${escapeHTML(opcao.texto)}
        </button>
        <span class="dica">${escapeHTML(opcao.dica || '')}</span>
        </div>`;
      }).join('')}
      </div>`
      : `<div class="sem-opcoes"><em>☕ Nada a escolher. Apenas sinta.</em></div>`
    }
    </section>
    `;

    renderSafeHTML(destino, html);
    scrollToTop(destino);

    // Acessibilidade: foca a primeira opção
    focusFirstOption(destino);

    // Handlers com reward visual
    destino.querySelectorAll('.btn-opcao').forEach(botao => {
      botao.addEventListener('click', (ev) => {
        // efeito ripple local no botão (tolerante a falhas)
        try { rippleOnButton(botao, ev); } catch {}

        // despacha escolha
        const dadosRaw = botao.dataset.id || '';
        let dados = {};
        try { dados = JSON.parse(decodeURIComponent(dadosRaw)); } catch {}
        const buildEscolha = dados.build || buildDominante();

        // reward coerente com a escolha
        try { playChoiceReward(buildEscolha); pulseBuildBadge(); } catch {}

        document.dispatchEvent(new CustomEvent('opcaoSelecionada', { detail: dados }));
      }, { once: true }); // evita cliques duplos
    });
  };

  // 🗣️ Se houver NPC, mostra antes do bloco
  if (npc) {
    const buildAtual = buildDominante();

    let finalizou = false;
    const seguraRender = () => {
      if (finalizou) return;
      finalizou = true;
      renderizarBloco();
    };

    try {
      // Suporta Promise OU callback legado
      const ret = dispararNPC(npc, buildAtual, seguraRender);

      if (ret && typeof ret.then === 'function') {
        ret.then(payload => {
          if (payload && payload.idNPC) {
            try {
              registrarInteracaoNPC({
                idNPC: payload.idNPC,
                caminho: payload.caminho || buildAtual,
                fala: payload.fala || ''
              });
            } catch {}
          }
        }).finally(seguraRender);
      } else {
        // API Legada: o próprio dispararNPC chamará a callback.
        // Ainda assim, garantimos o bloco se nada vier:
        setTimeout(() => {
          const noConteudo = !destino.querySelector('.evento-bloco');
          if (noConteudo) seguraRender();
        }, 50);
      }
    } catch (e) {
      console.warn('NPC falhou, seguindo sem diálogo.', e);
      renderizarBloco();
    }
  } else {
    renderizarBloco();
  }
}
