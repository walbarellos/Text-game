/**
 * src/core/state-extensions.js
 * Extensões de estado para sistema narrativo completo.
 * Adicionar ao estado existente do jogo.
 *
 * INTEGRAÇÃO: no seu state.js ou onde o estado é inicializado:
 *   import { criarEstadoNarrativo, aplicarConsequencia, eventoDisponivel } from './core/state-extensions.js';
 *   Object.assign(estado, criarEstadoNarrativo());
 */

// ─── Estado narrativo inicial ──────────────────────────────────────────
export function criarEstadoNarrativo() {
  return {
    // Escolhas passadas do jogador (Set serializado como Array no save)
    flags: new Set(),

    // Relações com NPCs: { mendigo: 3, comerciante: -1 }
    relacoes: {},

    // Karma multidimensional — substitui/complementa "virtude" única
    karma: {
      coragem: 50,  // confronto, risco, sacrifício próprio
      empatia: 50,  // ajuda, compaixão, sacrifício pelos outros
      astucia: 50,  // engano, estratégia, pragmatismo
      fe:      50,  // escolhas espirituais, simbólicas, transcendentes
    },

    // Itens e recursos
    itens: [],

    // Quests ativas/concluídas/expiradas
    quests: {
      ativas:     new Set(),
      concluidas: new Set(),
      expiradas:  new Set(),
    },

    // Histórico resumido de escolhas (para "Diário" in-game)
    historico: [], // [{ dia, evento, escolha, resumo }]
  };
}

// ─── Serializar para save (Set → Array) ───────────────────────────────
export function serializarEstadoNarrativo(estado) {
  return {
    ...estado,
    flags: [...estado.flags],
    quests: {
      ativas:     [...estado.quests.ativas],
      concluidas: [...estado.quests.concluidas],
      expiradas:  [...estado.quests.expiradas],
    },
  };
}

// ─── Deserializar do save (Array → Set) ───────────────────────────────
export function deserializarEstadoNarrativo(raw) {
  return {
    ...raw,
    flags: new Set(raw.flags ?? []),
    quests: {
      ativas:     new Set(raw.quests?.ativas     ?? []),
      concluidas: new Set(raw.quests?.concluidas ?? []),
      expiradas:  new Set(raw.quests?.expiradas  ?? []),
    },
  };
}

// ─── Aplicar consequências de uma escolha ─────────────────────────────
/**
 * @param {object} estado
 * @param {object} consequencias - shape da escolha no JSON de eventos
 * {
 *   flag:    "string",        // adiciona ao Set de flags
 *   flags:   ["a","b"],      // adiciona múltiplas
 *   relacao: { mendigo: +2 }, // atualiza relação com NPC
 *   karma:   { coragem: +10, empatia: -5 },
 *   virtude: +5,             // compatibilidade com sistema atual
 *   item:    "diario_rasgado",
 *   proxima_etapa: "e2_confronto", // retornado para o engine de quests
 * }
 */
export function aplicarConsequencia(estado, consequencias) {
  if (!consequencias) return;

  // Flags
  if (consequencias.flag)
    estado.flags.add(consequencias.flag);
  if (Array.isArray(consequencias.flags))
    consequencias.flags.forEach(f => estado.flags.add(f));

  // Relações com NPCs
  if (consequencias.relacao) {
    Object.entries(consequencias.relacao).forEach(([npc, delta]) => {
      estado.relacoes[npc] = Math.max(-100, Math.min(100,
        (estado.relacoes[npc] ?? 0) + delta
      ));
    });
  }

  // Karma multidimensional
  if (consequencias.karma) {
    Object.entries(consequencias.karma).forEach(([eixo, delta]) => {
      if (eixo in estado.karma) {
        estado.karma[eixo] = Math.max(0, Math.min(100,
          estado.karma[eixo] + delta
        ));
      }
    });
  }

  // Compatibilidade: virtude simples → empatia + fe
  if (typeof consequencias.virtude === 'number') {
    const v = consequencias.virtude;
    estado.karma.empatia = Math.max(0, Math.min(100, estado.karma.empatia + v * 0.6));
    estado.karma.fe      = Math.max(0, Math.min(100, estado.karma.fe      + v * 0.4));
  }

  // Item
  if (consequencias.item)
    estado.itens.push(consequencias.item);

  // Disparar evento DOM para o HUD atualizar
  window.dispatchEvent(new CustomEvent('estado:atualizado', { detail: estado }));
}

// ─── Verificar se um evento/quest está disponível ─────────────────────
/**
 * @param {object} estado
 * @param {object} requer - objeto `requer` do JSON do evento
 * {
 *   flag:          "string",   // precisa ter essa flag
 *   sem_flag:      "string",   // precisa NÃO ter essa flag
 *   flags:         ["a","b"],  // precisa ter TODAS essas flags
 *   dia_min:       3,          // dia atual >= dia_min
 *   dia_max:       10,         // dia atual <= dia_max
 *   relacao:       { mendigo: 3 },  // relação com NPC >= valor
 *   karma:         { coragem: 60 }, // karma no eixo >= valor
 *   sem_quest:     "q_id",     // quest não pode estar ativa
 *   quest_concluida: "q_id",   // quest precisa estar concluída
 * }
 */
export function eventoDisponivel(estado, requer) {
  if (!requer) return true;

  // Flag obrigatória
  if (requer.flag && !estado.flags.has(requer.flag)) return false;

  // Flag proibida
  if (requer.sem_flag && estado.flags.has(requer.sem_flag)) return false;

  // Múltiplas flags obrigatórias
  if (Array.isArray(requer.flags)) {
    if (!requer.flags.every(f => estado.flags.has(f))) return false;
  }

  // Dia
  if (requer.dia_min != null && estado.dia < requer.dia_min) return false;
  if (requer.dia_max != null && estado.dia > requer.dia_max) return false;

  // Relação com NPC
  if (requer.relacao) {
    const [npc, min] = Object.entries(requer.relacao)[0];
    if ((estado.relacoes[npc] ?? 0) < min) return false;
  }

  // Karma multidimensional
  if (requer.karma) {
    for (const [eixo, min] of Object.entries(requer.karma)) {
      if ((estado.karma[eixo] ?? 50) < min) return false;
    }
  }

  // Quests
  if (requer.sem_quest && estado.quests.ativas.has(requer.sem_quest)) return false;
  if (requer.quest_concluida && !estado.quests.concluidas.has(requer.quest_concluida)) return false;

  return true;
}

// ─── Verificar expiração de quests de crise ───────────────────────────
/**
 * Chama a cada virada de dia.
 * @param {object} estado
 * @param {Array}  todasAsQuests - array de definições de quests carregadas
 * @returns {Array} quests que expiraram neste dia (para mostrar consequência)
 */
export function verificarExpiracoes(estado, todasAsQuests) {
  const expiradas = [];

  for (const questId of estado.quests.ativas) {
    const def = todasAsQuests.find(q => q.id === questId);
    if (!def || def.tipo !== 'crise') continue;
    if (estado.dia > def.dia_expira) {
      estado.quests.ativas.delete(questId);
      estado.quests.expiradas.add(questId);

      if (def.se_expirar) {
        aplicarConsequencia(estado, def.se_expirar);
      }
      expiradas.push(def);
    }
  }

  return expiradas;
}

// ─── Calcular build a partir do karma ────────────────────────────────
/**
 * Retorna 'virtuoso' | 'profano' | 'anomalia' baseado nos 4 eixos.
 * Compatível com o sistema de badge atual.
 */
export function calcularBuild(karma) {
  const { coragem, empatia, astucia, fe } = karma;
  const media = (coragem + empatia + astucia + fe) / 4;

  // Anomalia: eixos muito divergentes entre si
  const max = Math.max(coragem, empatia, astucia, fe);
  const min = Math.min(coragem, empatia, astucia, fe);
  if (max - min > 50) return 'anomalia';

  if (media >= 62) return 'virtuoso';
  if (media <= 38) return 'profano';
  return 'anomalia';
}

// ─── Adicionar ao histórico ───────────────────────────────────────────
export function registrarHistorico(estado, { dia, eventoTitulo, escolhaTitulo, resumo }) {
  estado.historico.push({
    dia,
    evento:  eventoTitulo,
    escolha: escolhaTitulo,
    resumo,
    ts:      Date.now(),
  });
  // Manter só os últimos 50 registros
  if (estado.historico.length > 50) {
    estado.historico.splice(0, estado.historico.length - 50);
  }
}
