/**
 * src/core/renderer-patch.js
 * Patch de integração — conecta todos os módulos ao renderer existente.
 *
 * NÃO substitui o renderer.js atual. Adiciona os hooks necessários.
 *
 * INTEGRAÇÃO: importar no final de src/main.js (ou no renderer.js):
 *   import { inicializarPatch } from './core/renderer-patch.js';
 *   await inicializarPatch(estado);
 */

import { iniciarIntro }      from '../ui/intro.js';
import { renderHudKarma, atualizarHudKarma, pulsarEixo } from '../ui/hud-karma.js';
import { QuestEngine }       from './quest-engine.js';
import { calcularFinal, renderizarFinal } from './endings.js';
import { carregarEventosDoDia, filtrarEventosDisponiveis } from './event-loader.js';
import { eventoDisponivel, aplicarConsequencia, calcularBuild, registrarHistorico, verificarExpiracoes, serializarEstadoNarrativo } from './state-extensions.js';
import { salvar }            from './save.js';
import { isLowEnd }          from '../performance-guard.js';

let _estado     = null;
let _questEngine = null;

/**
 * Ponto de entrada único.
 * @param {object} estado - estado completo do jogo (já com criarEstadoNarrativo() aplicado)
 */
export async function inicializarPatch(estado) {
  _estado      = estado;
  _questEngine = new QuestEngine(estado);

  // Inicializa engine de quests em background
  _questEngine.init().catch(() => {});

  // HUD de karma (renderiza ao lado do badge atual)
  renderHudKarma(estado.karma);

  // Escuta atualizações de estado
  window.addEventListener('estado:atualizado', e => {
    atualizarHudKarma(e.detail.karma);
    const novaBuild = calcularBuild(e.detail.karma);
    window.dispatchEvent(new CustomEvent('build:set', { detail: novaBuild }));
  });

  // Tema por tipo de evento
  window.addEventListener('evento:renderizado', e => {
    if (e.detail?.tipo) {
      document.body.dataset.eventoTipo = e.detail.tipo;
    }
  });

  // Quests expiradas → mostrar consequência
  window.addEventListener('quests:expiradas', e => {
    const expiradas = e.detail;
    expiradas.forEach(q => {
      if (q.se_expirar?.texto_consequencia) {
        _mostrarNotificacaoQuest(q.titulo, q.se_expirar.texto_consequencia, 'expirada');
      }
    });
  });

  // Reiniciar jogo
  window.addEventListener('jogo:reiniciar', () => {
    window.location.reload();
  });
}

/**
 * Chamada ao jogador fazer uma escolha.
 * Substitui/complementa a função existente que processa escolhas.
 *
 * @param {object} escolha   - { id, texto, resumo, consequencias }
 * @param {object} evento    - evento atual (para histórico)
 * @returns {{ novasQuests, buildAtualizado }}
 */
export async function processarEscolha(escolha, evento) {
  if (!_estado || !_questEngine) return {};

  // Aplicar consequências e ativar quests
  const novasQuests = await _questEngine.processar(escolha.consequencias);

  // Animação de pulso nos eixos que mudaram
  if (escolha.consequencias?.karma) {
    Object.entries(escolha.consequencias.karma).forEach(([eixo, delta]) => {
      pulsarEixo(eixo, delta);
    });
  }

  // Registrar no histórico
  registrarHistorico(_estado, {
    dia:           _estado.dia,
    eventoTitulo:  evento?.titulo ?? '',
    escolhaTitulo: escolha.texto,
    resumo:        escolha.resumo ?? '',
  });

  // Notificar quest recém-ativada
  novasQuests.forEach(q => {
    _mostrarNotificacaoQuest(q.titulo, q.descricao, 'nova');
  });

  // Verificar caminho especial do Dia 7
  if (escolha.consequencias?.ativa_caminho) {
    _estado.caminho = escolha.consequencias.ativa_caminho;
  }

  // Autosave
  await salvar(serializarEstadoNarrativo(_estado));

  const buildAtualizado = calcularBuild(_estado.karma);
  return { novasQuests, buildAtualizado };
}

/**
 * Chamada ao virar o dia.
 * @param {number} novoDia
 * @returns {object[]} eventos disponíveis para o novo dia
 */
export async function avancarDia(novoDia) {
  if (!_estado) return [];

  _estado.dia = novoDia;

  // Verificar expiração de quests de crise
  const expiradas = await _questEngine.verificarDia(novoDia);

  // Verificar se chegou ao Dia 13
  if (novoDia >= 13) {
    return await encerrarJogo();
  }

  // Carregar eventos do novo dia
  let eventos;
  try {
    eventos = await carregarEventosDoDia(novoDia);
  } catch {
    console.warn(`[patch] Sem eventos para o dia ${novoDia}`);
    return [];
  }

  // Filtrar por disponibilidade (flags, karma, etc.)
  const disponiveis = filtrarEventosDisponiveis(eventos, _estado, eventoDisponivel);

  // Verificar se quests ativas têm etapa para este dia
  const questsAtivas = _questEngine.getQuestsAtivas();
  const eventosDeQuest = questsAtivas.map(q => {
    const etapa = _questEngine.getEtapaAtual(q.id);
    if (!etapa) return null;
    return {
      ...etapa,
      _questId: q.id,
      _questTitulo: q.titulo,
      tipo: 'arco',
    };
  }).filter(Boolean);

  // Misturar: quests têm prioridade mas não dominam o dia inteiro
  const pool = [...eventosDeQuest, ...disponiveis];

  // Disparar para a tela
  window.dispatchEvent(new CustomEvent('dia:eventos', {
    detail: { dia: novoDia, eventos: pool, expiradas },
  }));

  return pool;
}

/**
 * Finaliza o jogo no Dia 13 com o final correto.
 */
export async function encerrarJogo() {
  const container = document.getElementById('evento');
  if (!container) return;

  const final = await calcularFinal(_estado);
  await renderizarFinal(final, container);

  // Salvar estado final
  await salvar(serializarEstadoNarrativo({ ..._estado, finalObtido: final.id }));
}

// ── UI de notificação de quest ────────────────────────────────────────

function _mostrarNotificacaoQuest(titulo, descricao, tipo) {
  const el = document.createElement('div');
  const cor = tipo === 'nova'
    ? 'rgba(201,162,39,0.85)'
    : 'rgba(220,80,80,0.85)';
  const prefixo = tipo === 'nova' ? '☉ novo caminho' : '☉ consequência';

  el.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(8,10,11,0.95);
    border: 1px solid ${cor.replace('0.85', '0.3')};
    border-radius: 8px;
    padding: 12px 20px;
    max-width: 320px;
    z-index: 9999;
    text-align: center;
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.4s ease;
    transform: translateX(-50%) translateY(8px);
  `;

  el.innerHTML = `
    <div style="font-size:9px;letter-spacing:.18em;color:${cor};font-family:'Share Tech Mono',monospace;text-transform:lowercase;margin-bottom:4px">${prefixo}</div>
    <div style="font-size:13px;color:rgba(232,220,200,0.9);font-family:'Share Tech Mono',monospace">${titulo}</div>
    ${descricao ? `<div style="font-size:11px;color:rgba(201,162,39,0.55);margin-top:4px;font-family:'Share Tech Mono',monospace">${descricao.slice(0, 80)}${descricao.length > 80 ? '…' : ''}</div>` : ''}
  `;

  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => el.remove(), 400);
  }, 4000);
}
