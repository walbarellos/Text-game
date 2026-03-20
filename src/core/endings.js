/**
 * src/core/endings.js
 * Calcula e renderiza o final correto baseado em estado acumulado.
 *
 * INTEGRAÇÃO:
 *   import { calcularFinal, renderizarFinal } from './core/endings.js';
 *
 *   // No Dia 13, ao encerrar o loop principal:
 *   const final = await calcularFinal(estado);
 *   await renderizarFinal(final, containerEl);
 */

import { typewriter } from '../ui/typewriter.js';

/**
 * Calcula qual final o jogador recebe.
 * @param {object} estado
 * @returns {Promise<object>} definição do final
 */
export async function calcularFinal(estado) {
  const resp = await fetch('/data/finais.json');
  const { finais } = await resp.json();

  const { karma, flags } = estado;

  // ── Anomalia (prioridade 0 — verificar primeiro) ──────────────
  const divergencia = calcularDivergencia(karma);
  const finalAnomalia = finais.find(f => f.id === 'final_anomalia');
  if (
    divergencia >= 50 &&
    flags.has('escolheu_anomalia') &&
    finalAnomalia
  ) {
    return finalAnomalia;
  }

  // ── Redenção ──────────────────────────────────────────────────
  const finalRedencao = finais.find(f => f.id === 'final_redencao');
  if (
    karma.empatia >= 65 &&
    temQualquer(flags, finalRedencao.condicao.flags_qualquer)
  ) {
    return finalRedencao;
  }

  // ── Silêncio ──────────────────────────────────────────────────
  const finalSilencio = finais.find(f => f.id === 'final_silencio');
  if (
    karma.fe >= 70 &&
    temQualquer(flags, finalSilencio.condicao.flags_qualquer)
  ) {
    return finalSilencio;
  }

  // ── Queda ─────────────────────────────────────────────────────
  const finalQueda = finais.find(f => f.id === 'final_queda');
  if (
    karma.astucia >= 70 &&
    temQualquer(flags, finalQueda.condicao.flags_qualquer) &&
    !flags.has('resolveu_passado')
  ) {
    return finalQueda;
  }

  // ── Fallback: redenção ou queda por média ─────────────────────
  const media = mediaKarma(karma);
  return media >= 50 ? finalRedencao : finalQueda;
}

/**
 * Renderiza o final no DOM com typewriter e efeitos.
 * @param {object} final - definição do final
 * @param {HTMLElement} container
 */
export async function renderizarFinal(final, container) {
  if (!container) return;

  // Limpar conteúdo anterior
  container.innerHTML = '';

  // Aplicar tema de cor
  document.body.dataset.eventoTipo = `final_${final.cor_tema}`;

  // ── Título ────────────────────────────────────────────────────
  await esperar(800);

  const subtituloEl = document.createElement('p');
  subtituloEl.style.cssText = `
    font-size: 11px;
    letter-spacing: 0.2em;
    color: rgba(201,162,39,0.5);
    text-align: center;
    margin: 0 0 8px;
    font-family: 'Share Tech Mono', monospace;
    text-transform: lowercase;
  `;
  subtituloEl.textContent = final.subtitulo;
  container.appendChild(subtituloEl);

  const tituloEl = document.createElement('h2');
  tituloEl.style.cssText = `
    font-family: Georgia, serif;
    font-size: clamp(22px, 5vw, 32px);
    color: rgba(232, 220, 200, 0.95);
    text-align: center;
    margin: 0 0 32px;
    font-weight: 400;
    letter-spacing: 0.04em;
  `;
  tituloEl.textContent = final.titulo;
  container.appendChild(tituloEl);

  await esperar(400);

  // ── Parágrafos com typewriter ─────────────────────────────────
  const textoWrap = document.createElement('div');
  textoWrap.style.cssText = `
    max-width: 520px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  container.appendChild(textoWrap);

  for (const linha of final.texto_final) {
    const p = document.createElement('p');
    p.style.cssText = `
      font-size: 14px;
      line-height: 1.75;
      color: rgba(220, 210, 195, 0.88);
      text-align: center;
      margin: 0;
      font-family: 'Share Tech Mono', monospace;
    `;
    textoWrap.appendChild(p);
    await typewriter(p, linha, { velocidade: 24 });
    await esperar(300);
  }

  // ── Frase final ───────────────────────────────────────────────
  await esperar(800);

  const fraseEl = document.createElement('p');
  fraseEl.style.cssText = `
    font-family: Georgia, serif;
    font-size: 15px;
    font-style: italic;
    color: rgba(201, 162, 39, 0.8);
    text-align: center;
    margin: 32px auto 0;
    max-width: 400px;
    line-height: 1.7;
    padding-top: 24px;
    border-top: 1px solid rgba(201,162,39,0.15);
  `;
  container.appendChild(fraseEl);
  await typewriter(fraseEl, final.frase_final, { velocidade: 30 });

  // ── Conquista (se for anomalia) ───────────────────────────────
  if (final.conquista) {
    await esperar(1000);
    const conquistaEl = document.createElement('div');
    conquistaEl.style.cssText = `
      margin: 24px auto 0;
      padding: 10px 20px;
      border: 1px solid rgba(201,162,39,0.3);
      border-radius: 6px;
      font-size: 11px;
      letter-spacing: 0.15em;
      color: rgba(201,162,39,0.7);
      text-align: center;
      text-transform: uppercase;
      font-family: 'Share Tech Mono', monospace;
      opacity: 0;
      transition: opacity 0.8s ease;
    `;
    conquistaEl.textContent = `☉ conquista desbloqueada: ${final.conquista}`;
    container.appendChild(conquistaEl);
    await esperar(50);
    conquistaEl.style.opacity = '1';
  }

  // ── Botão reiniciar ───────────────────────────────────────────
  await esperar(1200);

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'text-align: center; margin-top: 32px;';

  const btnReiniciar = document.createElement('button');
  btnReiniciar.textContent = 'nova vida';
  btnReiniciar.style.cssText = `
    background: transparent;
    border: 1px solid rgba(201,162,39,0.35);
    color: rgba(201,162,39,0.75);
    padding: 10px 32px;
    border-radius: 6px;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: lowercase;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    opacity: 0;
    transition: opacity 0.6s ease, border-color 0.2s, color 0.2s, background 0.2s;
  `;
  btnReiniciar.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('jogo:reiniciar'));
  });
  btnWrap.appendChild(btnReiniciar);
  container.appendChild(btnWrap);

  await esperar(50);
  btnReiniciar.style.opacity = '1';
  btnReiniciar.addEventListener('mouseenter', () => {
    btnReiniciar.style.borderColor = 'rgba(201,162,39,0.65)';
    btnReiniciar.style.color = 'rgba(201,162,39,1)';
    btnReiniciar.style.background = 'rgba(201,162,39,0.05)';
  });
  btnReiniciar.addEventListener('mouseleave', () => {
    btnReiniciar.style.borderColor = 'rgba(201,162,39,0.35)';
    btnReiniciar.style.color = 'rgba(201,162,39,0.75)';
    btnReiniciar.style.background = 'transparent';
  });
}

// ── Utilitários ──────────────────────────────────────────────────────

function calcularDivergencia(karma) {
  const vals = Object.values(karma);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  return max - min;
}

function mediaKarma(karma) {
  const vals = Object.values(karma);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function temQualquer(flags, lista) {
  if (!lista || lista.length === 0) return true;
  return lista.some(f => flags.has(f));
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}
