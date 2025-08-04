// 📊 Acumulador interno de builds morais
const pontuacaoBuild = {
  virtuoso: 0,
  profano: 0,
  anomalia: 0
};

/**
 * Registra uma escolha moral do jogador.
 * @param {string} build - 'virtuoso' | 'profano' | 'anomalia'
 */
export function registrarEscolha(build) {
  if (pontuacaoBuild[build] !== undefined) {
    pontuacaoBuild[build]++;
  } else {
    console.warn('⚠️ Build desconhecida registrada:', build);
  }
}

/**
 * Retorna a build dominante com base no acúmulo atual.
 * @returns {string} - 'virtuoso' | 'profano' | 'anomalia'
 */
export function buildDominante() {
  const entradas = Object.entries(pontuacaoBuild);
  entradas.sort((a, b) => b[1] - a[1]);
  return entradas[0][0]; // Retorna a com maior pontuação
}

/**
 * Retorna uma cópia do histórico atual de builds.
 * @returns {{ virtuoso: number, profano: number, anomalia: number }}
 */
export function historicoBuilds() {
  return { ...pontuacaoBuild };
}

/**
 * Retorna o total de escolhas feitas no dia.
 */
export function pontuacaoTotal() {
  return Object.values(pontuacaoBuild).reduce((soma, n) => soma + n, 0);
}

/**
 * Retorna a porcentagem de cada build para visualizações.
 * @returns {{ virtuoso: string, profano: string, anomalia: string }}
 */
export function buildPorcentagem() {
  const total = pontuacaoTotal();
  if (total === 0) return { virtuoso: '0%', profano: '0%', anomalia: '0%' };

  return {
    virtuoso: Math.round((pontuacaoBuild.virtuoso / total) * 100) + '%',
    profano: Math.round((pontuacaoBuild.profano / total) * 100) + '%',
    anomalia: Math.round((pontuacaoBuild.anomalia / total) * 100) + '%'
  };
}

/**
 * Reseta todas as pontuações para o próximo ciclo.
 */
export function resetarBuild() {
  for (const chave in pontuacaoBuild) {
    pontuacaoBuild[chave] = 0;
  }
}
