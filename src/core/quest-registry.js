/**
 * src/core/quest-registry.js
 * Registro central de quests.
 * Fonte única da verdade sobre o que existe no jogo.
 *
 * INTEGRAÇÃO: QuestEngine usa este arquivo automaticamente.
 * Para adicionar nova quest: inserir na lista QUESTS_REGISTRO.
 */

export const QUESTS_REGISTRO = [
  {
    id:          'q_sombra_do_passado',
    titulo:      'A Sombra do Passado',
    tipo:        'arco',
    dia_min:     3,
    dia_max:     8,
    gatilho_resumo: 'Requer: ajudou_mendigo',
  },
  {
    id:          'q_fogo_no_mercado',
    titulo:      'Fogo no Mercado',
    tipo:        'crise',
    dia_min:     4,
    dia_expira:  7,
    gatilho_resumo: 'Requer: foi_mercado_dia1',
  },
  {
    id:          'q_guardiao_do_templo',
    titulo:      'O Guardião',
    tipo:        'arco',
    dia_min:     4,
    dia_max:     10,
    gatilho_resumo: 'Requer: meditou_templo E voltou_ao_templo',
  },
  {
    id:          'q_carta_sem_remetente',
    titulo:      'A Lista dos Sete',
    tipo:        'arco',
    dia_min:     7,
    dia_max:     12,
    gatilho_resumo: 'Requer: abriu_envelope_mensageiro',
  },
];

/** IDs na ordem que o engine deve verificar ativação */
export const QUEST_IDS_ORDENADOS = QUESTS_REGISTRO.map(q => q.id);

/**
 * Retorna metadados de uma quest sem carregar o JSON completo.
 * Útil para UI de "quests ativas" sem fazer fetch.
 */
export function getMetaQuest(id) {
  return QUESTS_REGISTRO.find(q => q.id === id) ?? null;
}

/**
 * Verificação rápida: quest pode ativar neste dia?
 */
export function questNaJanelaDeDia(id, diaAtual) {
  const meta = getMetaQuest(id);
  if (!meta) return false;
  if (meta.dia_min != null && diaAtual < meta.dia_min) return false;
  if (meta.dia_max != null && diaAtual > meta.dia_max) return false;
  return true;
}
