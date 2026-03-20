/**
 * src/ui/fps-monitor.js
 * FPS counter visual — só ativo em DEV (Vite expõe import.meta.env.DEV).
 * Aparece canto superior direito. Verde = ok, amarelo = mid, vermelho = ruim.
 *
 * INTEGRAÇÃO: importar em src/main.js
 *   import './ui/fps-monitor.js';
 */

// Só roda em desenvolvimento
const isDev = typeof import.meta !== 'undefined'
  ? (import.meta.env?.DEV ?? false)
  : false;

if (isDev) {
  const el = document.createElement('div');
  el.id = 'fps-monitor';
  Object.assign(el.style, {
    position:      'fixed',
    top:           '4px',
    right:         '4px',
    zIndex:        '99999',
    fontSize:      '11px',
    fontFamily:    'monospace',
    color:         '#0f0',
    background:    'rgba(0,0,0,0.75)',
    padding:       '2px 8px',
    borderRadius:  '4px',
    pointerEvents: 'none',
    userSelect:    'none',
    lineHeight:    '1.6',
    minWidth:      '72px',
    textAlign:     'right',
  });
  document.body.appendChild(el);

  let frames = 0;
  let last   = performance.now();
  let minFps = Infinity;
  let maxFps = 0;

  function tick(now) {
    frames++;
    const elapsed = now - last;

    if (elapsed >= 1000) {
      const fps = Math.round((frames / elapsed) * 1000);
      minFps = Math.min(minFps, fps);
      maxFps = Math.max(maxFps, fps);
      frames = 0;
      last   = now;

      el.textContent = `${fps} FPS\n↓${minFps} ↑${maxFps}`;

      // Cor por tier
      el.style.color = fps < 20 ? '#ff4444'
                     : fps < 40 ? '#ffaa00'
                     : fps < 55 ? '#aaff44'
                     :            '#00ff88';

      // Reset do min/max a cada 10s
      if (Math.random() < 0.1) { minFps = fps; maxFps = fps; }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
