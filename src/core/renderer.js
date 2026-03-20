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

// import { typewriter } from '../ui/typewriter.js'; // REMOVIDO PARA TESTE DE VISIBILIDADE

const eventoContainer = document.getElementById('evento');

function escapeHTML(s) {
  return String(s ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
}

/* ---------------------------------------
 * Render principal — VERSÃO ULTRA SEGURA
 * --------------------------------------*/
export function renderizarEvento(evento, destino = eventoContainer) {
  if (!destino || !evento) {
    console.error('🛑 Destino ou evento inválido.', { destino, evento });
    return;
  }

  console.log('[renderer] Renderizando:', evento.id);

  // Normalização total de propriedades
  const titulo = evento.titulo || evento.nome || '—';
  const texto = evento.texto || evento.descricao || '';
  const pRaw = evento.paragrafos || (texto ? [texto] : []);
  const listaParagrafos = Array.isArray(pRaw) ? pRaw : [String(pRaw)];
  
  const escolhasRaw = evento.escolhas || evento.opcoes || [];
  const escolhas = Array.isArray(escolhasRaw) ? escolhasRaw : [];
  
  const tipo = evento.tipo || 'padrão';
  const npc = evento.npc;

  document.body.dataset.eventoTipo = tipo;

  // 1. Montar HTML direto (SEM TYPEWRITER PARA TESTE)
  const htmlNarrativa = listaParagrafos.map(p => `<p class="evento-narrativa" style="margin-bottom: 0.8em; opacity: 1; display: block;">${escapeHTML(p)}</p>`).join('');
  
  const htmlEscolhas = escolhas.map((escolha, idx) => {
    const dados = {
      id:            escolha.id || `c${idx}`,
      proximo:       escolha.proximo ?? null,
      consequencias: escolha.consequencias ?? null,
      build:         escolha.buildImpact ?? escolha.build ?? null,
      npc:           escolha.npc ?? null,
      texto:         escolha.texto,
      resumo:        escolha.resumo
    };
    return `
    <div class="opcao-bloco" style="margin-bottom: 10px;">
      <button type="button"
        class="btn-opcao btn-escolha"
        style="opacity: 1 !important; visibility: visible !important; display: block !important; width: 100%; text-align: left; padding: 14px 18px; cursor: pointer;"
        data-id='${encodeURIComponent(JSON.stringify(dados))}'>
        ${escapeHTML(escolha.texto)}
      </button>
    </div>`;
  }).join('');

  const htmlFinal = `
  <section class="evento-bloco" style="opacity: 1; visibility: visible; display: block;">
    <h2 class="evento-titulo" style="margin-bottom: 12px;">${escapeHTML(titulo)}</h2>
    <div class="evento-texto">${htmlNarrativa}</div>
    <div class="opcoes evento-escolhas" role="group" aria-label="Opções de escolha" style="opacity: 1; visibility: visible; display: flex; flex-direction: column; margin-top: 20px;">
      ${htmlEscolhas}
    </div>
    ${escolhas.length === 0 ? '<div class="sem-opcoes"><em>☕ Nada a escolher.</em></div>' : ''}
  </section>
  `;

  // 2. Injeção direta no DOM
  destino.innerHTML = htmlFinal;
  
  // Força scroll para o topo do container
  destino.scrollTop = 0;

  // 3. Ativar Handlers
  destino.querySelectorAll('.btn-opcao').forEach(botao => {
    botao.onclick = (ev) => {
      try { rippleOnButton(botao, ev); } catch {}
      const dadosRaw = botao.dataset.id || '';
      try {
        const dados = JSON.parse(decodeURIComponent(dadosRaw));
        console.log('[renderer] Opção selecionada:', dados.texto);
        document.dispatchEvent(new CustomEvent('opcaoSelecionada', { detail: dados }));
      } catch (e) {
        console.error('Erro ao processar clique:', e);
      }
    };
  });

  // Notificar sistema
  window.dispatchEvent(new CustomEvent('evento:renderizado', { detail: evento }));

  // Se houver NPC, disparar também
  if (npc) {
    try {
      dispararNPC(npc, buildDominante());
    } catch (e) {
      console.warn('NPC falhou:', e);
    }
  }
}
