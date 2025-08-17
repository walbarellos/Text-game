// 📊 Acumulador interno de builds morais
const pontuacaoBuild = {
  virtuoso: 0,
  profano: 0,
  anomalia: 0
};

// 🔎 Histórico de escolhas para desempate por recência (opcional)
const _historicoEscolhas = []; // [{ build, peso, ts }]

// 🕒 util
function agora() {
  return Date.now();
}

/**
 * Registra uma escolha moral do jogador.
 * @param {string} build - 'virtuoso' | 'profano' | 'anomalia'
 * @param {number} [peso=1] - peso/impacto (pode ser negativo para correções)
 */
export function registrarEscolha(build, peso = 1) {
  if (pontuacaoBuild[build] !== undefined) {
    const inc = Number.isFinite(peso) ? peso : 1;
    pontuacaoBuild[build] += inc;
    _historicoEscolhas.push({ build, peso: inc, ts: agora() });
  } else {
    console.warn('⚠️ Build desconhecida registrada:', build);
  }
}

/**
 * Retorna a build dominante considerando pontuação e desempate.
 * Critério de desempate (ordem):
 *  1) Maior pontuação
 *  2) Recência (última escolha válida)
 *  3) Ordem determinística: virtuoso > profano > anomalia
 * @returns {string} - 'virtuoso' | 'profano' | 'anomalia'
 */
export function buildDominante() {
  // 1) maior pontuação
  const entradas = Object.entries(pontuacaoBuild);
  entradas.sort((a, b) => b[1] - a[1]);

  const [topKey, topVal] = entradas[0];

  // checar empate no topo
  const empatados = entradas.filter(([, v]) => v === topVal).map(([k]) => k);

  if (empatados.length === 1) return topKey;

  // 2) desempate por recência
  for (let i = _historicoEscolhas.length - 1; i >= 0; i--) {
    const h = _historicoEscolhas[i];
    if (empatados.includes(h.build)) {
      return h.build;
    }
  }

  // 3) fallback determinístico
  const ordem = ['virtuoso', 'profano', 'anomalia'];
  for (const k of ordem) if (empatados.includes(k)) return k;

  return topKey; // fallback defensivo
}

/**
 * Retorna uma cópia do histórico atual de builds (contagem).
 * @returns {{ virtuoso: number, profano: number, anomalia: number }}
 */
export function historicoBuilds() {
  return { ...pontuacaoBuild };
}

/**
 * Retorna o total de escolhas feitas no dia (soma dos pesos).
 */
export function pontuacaoTotal() {
  return Object.values(pontuacaoBuild).reduce((soma, n) => soma + n, 0);
}

/**
 * Retorna a porcentagem (string formatada) de cada build.
 * @returns {{ virtuoso: string, profano: string, anomalia: string }}
 */
export function buildPorcentagem() {
  const total = pontuacaoTotal();
  if (total <= 0) return { virtuoso: '0%', profano: '0%', anomalia: '0%' };
  const pct = (n) => Math.round((n / total) * 100) + '%';
  return {
    virtuoso: pct(pontuacaoBuild.virtuoso),
    profano: pct(pontuacaoBuild.profano),
    anomalia: pct(pontuacaoBuild.anomalia)
  };
}

/**
 * Versão numérica das porcentagens (0–100).
 * @returns {{ virtuoso: number, profano: number, anomalia: number }}
 */
export function buildPorcentagemNum() {
  const total = pontuacaoTotal();
  if (total <= 0) return { virtuoso: 0, profano: 0, anomalia: 0 };
  const pct = (n) => Math.round((n / total) * 100);
  return {
    virtuoso: pct(pontuacaoBuild.virtuoso),
    profano: pct(pontuacaoBuild.profano),
    anomalia: pct(pontuacaoBuild.anomalia)
  };
}

/**
 * Reseta todas as pontuações para o próximo ciclo.
 */
export function resetarBuild() {
  for (const chave in pontuacaoBuild) {
    pontuacaoBuild[chave] = 0;
  }
  _historicoEscolhas.length = 0;
}

// 📌 Registro simbólico de interações com NPCs
// Mantém compat com assinatura antiga (id, build), mas aceita objeto completo.
let interacoesNPC = []; // [{ idNPC, caminho, fala, tone, impacto, ts }]

/**
 * Registra uma interação com NPC.
 * ➕ Compatibilidade:
 *    registrarInteracaoNPC('npc3','virtuoso')
 *    registrarInteracaoNPC({ idNPC:'npc3', caminho:'virtuoso', fala:'...', tone:'humor-leve', impacto:{...} })
 * @param {string|object} idNPCOrObj
 * @param {string} [build]
 */
export function registrarInteracaoNPC(idNPCOrObj, build) {
  let payload;
  if (typeof idNPCOrObj === 'object' && idNPCOrObj !== null) {
    const {
      idNPC,
      caminho,
      fala,
      tone,
      impacto
    } = idNPCOrObj;
    payload = {
      idNPC: idNPC || 'npc',
      caminho: (caminho || build || '—').toLowerCase(),
      fala: fala || '…',
      tone: tone || null,
      impacto: impacto || null,
      ts: agora()
    };
  } else {
    payload = {
      idNPC: idNPCOrObj || 'npc',
      caminho: (build || '—').toLowerCase(),
      fala: '…',
      tone: null,
      impacto: null,
      ts: agora()
    };
  }
  interacoesNPC.push(payload);
}

/**
 * Retorna interações com NPCs (mais recentes primeiro).
 * @param {number} [limite=Infinity] - número máximo de itens
 * @returns {Array<{idNPC:string,caminho:string,fala:string,tone?:string,impacto?:object,ts:number}>}
 */
export function obterInteracoesNPC(limite = Infinity) {
  const arr = interacoesNPC.slice().reverse();
  return Number.isFinite(limite) ? arr.slice(0, limite) : arr;
}

/**
 * Reseta as interações (ao avançar de dia, por exemplo).
 */
export function resetarInteracoesNPC() {
  interacoesNPC = [];
}

/**
 * Aplica um objeto de impacto ao acumulador moral.
 * Formato típico vindo do teu módulo de NPC:
 *   { virtuoso: +1, profano: 0, anomalia: 0 }
 * Valores podem ser negativos.
 * @param {{virtuoso?:number, profano?:number, anomalia?:number}} impacto
 */
export function aplicarImpacto(impacto) {
  if (!impacto || typeof impacto !== 'object') return;
  if (Number.isFinite(impacto.virtuoso)) pontuacaoBuild.virtuoso += impacto.virtuoso;
  if (Number.isFinite(impacto.profano))  pontuacaoBuild.profano  += impacto.profano;
  if (Number.isFinite(impacto.anomalia)) pontuacaoBuild.anomalia += impacto.anomalia;
}

/**
 * Utilitário: registra escolha + impacto (se houver).
 * @param {string} build - caminho base da escolha
 * @param {{virtuoso?:number, profano?:number, anomalia?:number}} [impacto]
 */
export function registrarEscolhaComImpacto(build, impacto) {
  registrarEscolha(build, 1);
  if (impacto) aplicarImpacto(impacto);
}
