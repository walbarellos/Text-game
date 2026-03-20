/**
 * src/core/state-extensions.js
 * Extensões de estado para sistema narrativo completo.
 */

// ─── Estado narrativo inicial ──────────────────────────────────────────
export function criarEstadoNarrativo() {
  return {
    flags: new Set(),
    relacoes: {},
    karma: {
      coragem: 50,
      empatia: 80, // Começa alto para Virtuoso
      astucia: 50,
      fe:      80, // Começa alto para Virtuoso
    },
    itens: [],
    quests: {
      ativas:     new Set(),
      concluidas: new Set(),
      expiradas:  new Set(),
    },
    historico: [],
  };
}

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

export function aplicarConsequencia(estado, consequencias) {
  if (!consequencias) return;

  if (consequencias.flag) estado.flags.add(consequencias.flag);
  if (Array.isArray(consequencias.flags)) consequencias.flags.forEach(f => estado.flags.add(f));

  if (consequencias.relacao) {
    Object.entries(consequencias.relacao).forEach(([npc, delta]) => {
      estado.relacoes[npc] = Math.max(-100, Math.min(100, (estado.relacoes[npc] ?? 0) + delta));
    });
  }

  if (consequencias.karma) {
    Object.entries(consequencias.karma).forEach(([eixo, delta]) => {
      if (eixo in estado.karma) {
        estado.karma[eixo] = Math.max(0, Math.min(100, estado.karma[eixo] + delta));
      }
    });
  }

  if (typeof consequencias.virtude === 'number') {
    const v = consequencias.virtude;
    estado.karma.empatia = Math.max(0, Math.min(100, estado.karma.empatia + v * 0.6));
    estado.karma.fe      = Math.max(0, Math.min(100, estado.karma.fe      + v * 0.4));
  }

  if (consequencias.item) estado.itens.push(consequencias.item);

  window.dispatchEvent(new CustomEvent('estado:atualizado', { detail: estado }));
}

export function eventoDisponivel(estado, requer) {
  if (!requer) return true;
  if (requer.flag && !estado.flags.has(requer.flag)) return false;
  if (requer.sem_flag && estado.flags.has(requer.sem_flag)) return false;
  if (Array.isArray(requer.flags)) {
    if (!requer.flags.every(f => estado.flags.has(f))) return false;
  }
  if (requer.dia_min != null && estado.dia < requer.dia_min) return false;
  if (requer.dia_max != null && estado.dia > requer.dia_max) return false;
  if (requer.relacao) {
    const [npc, min] = Object.entries(requer.relacao)[0];
    if ((estado.relacoes[npc] ?? 0) < min) return false;
  }
  if (requer.karma) {
    for (const [eixo, min] of Object.entries(requer.karma)) {
      if ((estado.karma[eixo] ?? 50) < min) return false;
    }
  }
  if (requer.sem_quest && estado.quests.ativas.has(requer.sem_quest)) return false;
  if (requer.quest_concluida && !estado.quests.concluidas.has(requer.quest_concluida)) return false;
  return true;
}

export function verificarExpiracoes(estado, todasAsQuests) {
  const expiradas = [];
  for (const questId of estado.quests.ativas) {
    const def = todasAsQuests.find(q => q.id === questId);
    if (!def || def.tipo !== 'crise') continue;
    if (estado.dia > def.dia_expira) {
      estado.quests.ativas.delete(questId);
      estado.quests.expiradas.add(questId);
      if (def.se_expirar) aplicarConsequencia(estado, def.se_expirar);
      expiradas.push(def);
    }
  }
  return expiradas;
}

export function calcularBuild(karma) {
  const { coragem, empatia, astucia, fe } = karma;
  const media = (coragem + empatia + astucia + fe) / 4;
  const max = Math.max(coragem, empatia, astucia, fe);
  const min = Math.min(coragem, empatia, astucia, fe);
  if (max - min > 50) return 'anomalia';
  if (media >= 62) return 'virtuoso';
  if (media <= 38) return 'profano';
  return 'anomalia';
}

export function registrarHistorico(estado, { dia, eventoTitulo, escolhaTitulo, resumo }) {
  estado.historico.push({ dia, evento: eventoTitulo, escolha: escolhaTitulo, resumo, ts: Date.now() });
  if (estado.historico.length > 50) {
    estado.historico.splice(0, estado.historico.length - 50);
  }
}
