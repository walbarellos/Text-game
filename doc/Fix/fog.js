/**
 * src/ui/fog.js  — versão otimizada
 *
 * Estratégia:
 *   1. Tenta usar OffscreenCanvas + Web Worker (zero impacto na main thread)
 *   2. Fallback: loop na main thread com throttle a 30fps
 *   3. Se perf-low: não inicializa nada
 */

import { isLowEnd } from '../performance-guard.js';

const canvas = document.getElementById('etereal-fog');
if (!canvas || isLowEnd) {
  // Modo low-end: CSS já esconde o canvas, não inicializa
} else {
  init();
}

async function init() {
  // ─── Escala interna: 50% da resolução real (blur natural + velocidade) ──
  const SCALE  = 0.5;
  let w = Math.floor(window.innerWidth  * SCALE);
  let h = Math.floor(window.innerHeight * SCALE);

  // CSS: escala o canvas de volta ao tamanho real via CSS
  canvas.style.width  = '100%';
  canvas.style.height = '100%';

  // ─── Tentar OffscreenCanvas + Worker ──────────────────────────────────
  const supportsOffscreen = typeof OffscreenCanvas !== 'undefined' &&
                            canvas.transferControlToOffscreen;

  if (supportsOffscreen) {
    try {
      const worker   = new Worker(
        new URL('./fog-worker.js', import.meta.url),
        { type: 'module' }
      );
      const offscreen = canvas.transferControlToOffscreen();

      worker.postMessage({ type: 'init', canvas: offscreen, w, h }, [offscreen]);

      window.addEventListener('resize', () => {
        w = Math.floor(window.innerWidth  * SCALE);
        h = Math.floor(window.innerHeight * SCALE);
        worker.postMessage({ type: 'resize', w, h });
      });

      return; // worker assumiu o controle
    } catch (e) {
      // Worker falhou (ex: CSP) — cai no fallback abaixo
      console.warn('[fog] OffscreenCanvas falhou, usando fallback:', e);
    }
  }

  // ─── Fallback: main thread com throttle ───────────────────────────────
  const ctx = canvas.getContext('2d');
  canvas.width  = w;
  canvas.height = h;

  const COUNT     = 18;
  const TARGET_FPS = 30;
  const INTERVAL   = 1000 / TARGET_FPS;
  let lastTime     = 0;

  const particles = Array.from({ length: COUNT }, () => ({
    x:      Math.random() * w,
    y:      Math.random() * h,
    radius: (18 + Math.random() * 28) * SCALE,
    alpha:  0.04 + Math.random() * 0.08,
    dx:     (-0.15 + Math.random() * 0.3) * SCALE,
    dy:     (-0.10 + Math.random() * 0.2) * SCALE,
  }));

  window.addEventListener('resize', () => {
    canvas.width  = w = Math.floor(window.innerWidth  * SCALE);
    canvas.height = h = Math.floor(window.innerHeight * SCALE);
  });

  function animate(ts) {
    requestAnimationFrame(animate);
    const delta = ts - lastTime;
    if (delta < INTERVAL) return;
    lastTime = ts - (delta % INTERVAL);

    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      ctx.beginPath();
      ctx.globalAlpha = p.alpha;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < -p.radius)      p.x = w + p.radius;
      if (p.x > w + p.radius)   p.x = -p.radius;
      if (p.y < -p.radius)      p.y = h + p.radius;
      if (p.y > h + p.radius)   p.y = -p.radius;
    }

    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(animate);
}
