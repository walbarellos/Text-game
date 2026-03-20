/**
 * performance-guard.js
 * Detecta automaticamente dispositivos de baixo desempenho
 * e desabilita os efeitos mais pesados silenciosamente.
 *
 * INTEGRAÇÃO: importar no topo de src/main.js
 *   import './performance-guard.js';
 */

// ─── Detecção heurística ───────────────────────────────────────────────
const cores       = navigator.hardwareConcurrency ?? 4;
const memoria     = navigator.deviceMemory        ?? 4;   // GB, nem sempre disponível
const temBackdrop = CSS.supports('backdrop-filter', 'blur(1px)');
const isMobile    = /Mobi|Android|iPhone/i.test(navigator.userAgent);

// Pontuação simples: quanto menor, pior o device
let score = 0;
if (cores >= 8)       score += 3;
else if (cores >= 4)  score += 1;
if (memoria >= 8)     score += 2;
else if (memoria >= 4) score += 1;
if (temBackdrop)      score += 1;
if (!isMobile)        score += 1;

const PERF_LOW  = score <= 2;
const PERF_MID  = score <= 4 && !PERF_LOW;
// PERF_HIGH = score > 4

// ─── Aplicar classe ao <html> para o CSS reagir ───────────────────────
if (PERF_LOW)      document.documentElement.classList.add('perf-low');
else if (PERF_MID) document.documentElement.classList.add('perf-mid');
else               document.documentElement.classList.add('perf-high');

// ─── Expor para outros módulos usarem ────────────────────────────────
export const perfLevel = PERF_LOW ? 'low' : PERF_MID ? 'mid' : 'high';
export const isLowEnd  = PERF_LOW;

// ─── Monitor de FPS em tempo real (ajuste dinâmico) ──────────────────
let frameCount = 0, lastCheck = performance.now(), sustained30fps = 0;

function checkFPS(ts) {
  frameCount++;
  const elapsed = ts - lastCheck;

  if (elapsed >= 2000) {
    const fps = (frameCount / elapsed) * 1000;
    frameCount = 0;
    lastCheck  = ts;

    // Se FPS < 25 por 3 verificações consecutivas, forçar modo low
    if (fps < 25) {
      sustained30fps++;
      if (sustained30fps >= 3 && !document.documentElement.classList.contains('perf-low')) {
        document.documentElement.classList.add('perf-low');
        document.documentElement.classList.remove('perf-mid', 'perf-high');
        console.info('[7Lives] Modo de baixo desempenho ativado automaticamente (FPS:', Math.round(fps), ')');
      }
    } else {
      sustained30fps = 0;
    }
  }

  requestAnimationFrame(checkFPS);
}

requestAnimationFrame(checkFPS);
