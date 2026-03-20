/**
 * src/ui/typewriter.js
 * Efeito de digitação com:
 *   - Pausa em pontuação (. , ; : !)
 *   - Suporte a HTML simples via innerHTML seguro
 *   - Skip instantâneo com clique/espaço
 *   - Promise-based (await typewriter(...))
 *   - Acessível: aria-live="polite" no container
 *
 * INTEGRAÇÃO: substituir o typing steps() CSS
 *   import { typewriter } from './ui/typewriter.js';
 *   await typewriter(el, texto, { velocidade: 28 });
 */

const PAUSAS = {
  '.': 320,
  '!': 320,
  '?': 320,
  ';': 180,
  ':': 140,
  ',': 100,
  '—': 80,
  '\n': 60,
};

/**
 * @param {HTMLElement} el - Elemento alvo
 * @param {string} texto   - Texto puro (sem HTML)
 * @param {object} opts
 * @param {number}   opts.velocidade   - ms por caractere (padrão: 28)
 * @param {Function} opts.onComplete   - callback ao terminar
 * @param {boolean}  opts.skipOnClick  - permite skip com clique (padrão: true)
 * @returns {Promise<void>}
 */
export function typewriter(el, texto, opts = {}) {
  const {
    velocidade  = 28,
    onComplete  = null,
    skipOnClick = true,
  } = opts;

  el.setAttribute('aria-live', 'polite');
  el.textContent = '';

  let i        = 0;
  let skipped  = false;
  let timerId  = null;

  function skip() {
    skipped = true;
    clearTimeout(timerId);
    el.textContent = texto;
    cleanup();
    onComplete?.();
  }

  function cleanup() {
    if (skipOnClick) {
      el.removeEventListener('click', skip);
      document.removeEventListener('keydown', onKey);
    }
    el.style.cursor = '';
  }

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      skip();
    }
  }

  if (skipOnClick) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', skip, { once: true });
    document.addEventListener('keydown', onKey);
  }

  return new Promise(resolve => {
    function tick() {
      if (skipped) { resolve(); return; }
      if (i >= texto.length) {
        cleanup();
        onComplete?.();
        resolve();
        return;
      }

      const char = texto[i++];
      el.textContent += char;

      const delay = PAUSAS[char] ?? velocidade;
      // Variação orgânica pequena (±20%)
      const jitter = delay * (0.8 + Math.random() * 0.4);
      timerId = setTimeout(tick, jitter);
    }

    tick();
  });
}

/**
 * Versão com múltiplos parágrafos — exibe cada um sequencialmente.
 * @param {HTMLElement} container
 * @param {string[]} paragrafos
 * @param {object} opts
 */
export async function typewriterSequencial(container, paragrafos, opts = {}) {
  container.innerHTML = '';

  for (const texto of paragrafos) {
    const p = document.createElement('p');
    p.style.margin = '0 0 0.8em';
    container.appendChild(p);
    await typewriter(p, texto, opts);
    // Pequena pausa entre parágrafos
    await new Promise(r => setTimeout(r, 200));
  }
}
