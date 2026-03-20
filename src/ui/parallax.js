/**
 * src/ui/parallax.js
 * Parallax leve no mouse/touch — só usa transform (zero repaint/reflow).
 * O #fx-bordas e o fog se movem 8px, o fundo se move 4px (profundidade).
 *
 * INTEGRAÇÃO: importar em src/main.js
 *   import './ui/parallax.js';
 */

import { isLowEnd } from '../performance-guard.js';

// Não vale a pena em mobile ou low-end
if (!isLowEnd && !('ontouchstart' in window)) {
  initParallax();
}

function initParallax() {
  const bordas = document.getElementById('fx-bordas');
  const sparks = document.getElementById('fx-sparks');
  const bg     = document.getElementById('background-canvas');

  if (!bordas) return;

  let targetX = 0, targetY = 0;
  let currX   = 0, currY   = 0;
  const STRENGTH = 8;  // px máximos de deslocamento
  const LERP     = 0.06; // suavidade (menor = mais lento/suave)

  document.addEventListener('mousemove', e => {
    // Normaliza: -1 a +1 relativo ao centro
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2 * STRENGTH;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2 * STRENGTH;
  });

  // Reseta suavemente quando o mouse sai da janela
  document.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  let rafId = null;

  function tick() {
    // Lerp suave
    currX += (targetX - currX) * LERP;
    currY += (targetY - currY) * LERP;

    // Para o rAF se já está praticamente parado
    const moving = Math.abs(targetX - currX) > 0.01 ||
                   Math.abs(targetY - currY) > 0.01;

    if (Math.abs(currX) > 0.01 || Math.abs(currY) > 0.01 || moving) {
      const x1 = currX.toFixed(2);
      const y1 = currY.toFixed(2);
      const x2 = (currX * 0.45).toFixed(2);
      const y2 = (currY * 0.45).toFixed(2);

      if (bordas) bordas.style.transform = `translate(${x1}px, ${y1}px)`;
      if (sparks) sparks.style.transform = `translate(${x1}px, ${y1}px)`;
      if (bg)     bg.style.transform     = `translate(${x2}px, ${y2}px)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  tick();
}
