/**
 * src/core/quest-engine.js
 * Engine de quests — conecta eventos, flags e progressão narrativa.
 *
 * INTEGRAÇÃO em src/main.js ou src/core/renderer.js:
 *   import { QuestEngine } from './core/quest-engine.js';
 *
 *   const quests = new QuestEngine(estado);
 *   await quests.init();
 *
 *   // Ao avançar um dia:
 *   const expiradas = await quests.verificarDia(estado.dia);
 *
 *   // Ao aplicar consequência de uma escolha:
 *   const novasQuests = await quests.processar(escolha.consequencias);
 */

import { carregarQuest, carregarQuests } from './event-loader.js';
import { eventoDisponivel, aplicarConsequencia, verificarExpiracoes } from './state-extensions.js';

// IDs de todas as quests do jogo (em ordem de ativação possível)
const TODAS_QUESTS = [
  'q_sombra_do_passado',
  'q_fogo_no_mercado',
  'q_guardiao_do_templo',
  'q_carta_sem_remetente',
  'q_acordo_no_beco',
];

export class QuestEngine {
  constructor(estado) {
    this.estado   = estado;
    this._defs    = new Map(); // id → definição carregada
    this._etapas  = new Map(); // questId → etapaAtualId
  }

  /** Pré-carrega as defs de quests (idle) */
  async init() {
    // Carrega silenciosamente todas as defs em background
    for (const id of TODAS_QUESTS) {
      try {
        const def = await carregarQuest(id);
        this._defs.set(id, def);
      } catch {
        // Quest não existe ainda no servidor — ok
      }
    }
  }

  /**
   * Processa consequências de uma escolha.
   * Ativa novas quests se os gatilhos forem satisfeitos.
   * @param {object} consequencias
   * @returns {Array} quests recém-ativadas
   */
  async processar(consequencias) {
    if (!consequencias) return [];

    // Aplicar ao estado
    aplicarConsequencia(this.estado, consequencias);

    // Verificar se alguma quest nova deve ser ativada
    const novasQuests = [];
    for (const [id, def] of this._defs) {
      if (this.estado.quests.ativas.has(id))     continue;
      if (this.estado.quests.concluidas.has(id)) continue;
      if (this.estado.quests.expiradas.has(id))  continue;

      if (this._satisfazGatilho(def.gatilho)) {
        this.estado.quests.ativas.add(id);
        novasQuests.push(def);
        console.info(`[quests] Ativada: ${def.titulo}`);
      }
    }

    return novasQuests;
  }

  /**
   * Avança a etapa de uma quest com base na escolha feita.
   * @param {string} questId
   * @param {string} etapaId
   * @param {string} escolhaId
   * @returns {{ etapaAtual, concluiu }}
   */
  async avancarEtapa(questId, etapaId, escolhaId) {
    const def = this._defs.get(questId);
    if (!def) return null;

    const etapaAtual = def.etapas.find(e => e.id === etapaId);
    if (!etapaAtual) return null;

    const escolha = etapaAtual.escolhas.find(c => c.id === escolhaId);
    if (!escolha) return null;

    // Aplicar consequências da escolha
    await this.processar(escolha.consequencias);

    const proximaId = escolha.consequencias?.proxima_etapa;

    // Quest concluída?
    if (!proximaId) {
      this.estado.quests.ativas.delete(questId);
      this.estado.quests.concluidas.add(questId);

      // Aplicar recompensa final
      if (def.recompensa_final) {
        aplicarConsequencia(this.estado, def.recompensa_final);
      }

      return { etapaAtual: null, concluiu: true, def };
    }

    const proximaEtapa = def.etapas.find(e => e.id === proximaId);
    this._etapas.set(questId, proximaId);

    return { etapaAtual: proximaEtapa, concluiu: false };
  }

  /**
   * Verifica expiração de quests de crise ao virar o dia.
   * @param {number} diaAtual
   * @returns {Array} quests expiradas
   */
  async verificarDia(diaAtual) {
    const defs = [...this.estado.quests.ativas].map(id => this._defs.get(id)).filter(Boolean);
    const expiradas = verificarExpiracoes(this.estado, defs);

    // Disparar evento DOM para o renderer mostrar consequências
    if (expiradas.length > 0) {
      window.dispatchEvent(new CustomEvent('quests:expiradas', {
        detail: expiradas,
      }));
    }

    return expiradas;
  }

  /**
   * Retorna quests ativas com suas definições (para o renderer mostrar).
   */
  getQuestsAtivas() {
    return [...this.estado.quests.ativas]
      .map(id => this._defs.get(id))
      .filter(Boolean);
  }

  /**
   * Retorna a etapa atual de uma quest ativa.
   * @param {string} questId
   */
  getEtapaAtual(questId) {
    const def      = this._defs.get(questId);
    const etapaId  = this._etapas.get(questId) ?? def?.etapas?.[0]?.id;
    return def?.etapas?.find(e => e.id === etapaId) ?? null;
  }

  // ── Private ──────────────────────────────────────────────────────

  _satisfazGatilho(gatilho) {
    if (!gatilho) return false;
    return eventoDisponivel(this.estado, gatilho);
  }
}
