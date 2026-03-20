/**
 * src/ui/dia-transicao.js
 * Transição entre dias — animação ritual, não genérica.
 * Exibe "Dia N" com typewriter + fade in/out.
 * Tempo total: ~2.5s (skipável com clique).
 *
 * INTEGRAÇÃO:
 *   import { transicaoDia } from './ui/dia-transicao.js';
 *   await transicaoDia(novoDia, { subtitulo: 'O Chamado' });
 */

// Subtítulos por dia — atmosfera narrativa sem spoiler
const SUBTITULOS_DIA = {
  1:  'o chamado',
  2:  'o espelho',
  3:  'o reconhecimento',
  4:  'o peso',
  5:  'a prova',
  6:  'o mensageiro',
  7:  'a escolha',
  8:  'o caminho',
  9:  'as consequências',
  10: 'a convergência',
  11: 'o que permanece',
  12: 'o silêncio antes',
  13: 'o sétimo dia',
};

/**
 * @param {number} dia
 * @param {{ subtitulo?: string, skipavel?: boolean }} opts
 */
export function transicaoDia(dia, opts = {}) {
  const {
    subtitulo = SUBTITULOS_DIA[dia] ?? '',
    skipavel  = true,
  } = opts;

  return new Promise(resolve => {
    // Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 500;
      background: #080a0b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.5s ease;
      cursor: ${skipavel ? 'pointer' : 'default'};
    `;

    // Número do dia
    const numEl = document.createElement('div');
    numEl.style.cssText = `
      font-family: Georgia, serif;
      font-size: clamp(14px, 3vw, 18px);
      letter-spacing: 0.25em;
      color: rgba(201, 162, 39, 0.4);
      text-transform: lowercase;
    `;
    numEl.textContent = `dia ${dia}`;

    // Linha decorativa
    const linha = document.createElement('div');
    linha.style.cssText = `
      width: 40px;
      height: 1px;
      background: rgba(201, 162, 39, 0.2);
    `;

    // Subtítulo
    const subEl = document.createElement('div');
    subEl.style.cssText = `
      font-family: 'Share Tech Mono', monospace;
      font-size: clamp(11px, 2vw, 13px);
      letter-spacing: 0.12em;
      color: rgba(201, 162, 39, 0.55);
      text-transform: lowercase;
    `;
    subEl.textContent = subtitulo;

    overlay.appendChild(numEl);
    overlay.appendChild(linha);
    overlay.appendChild(subEl);
    document.body.appendChild(overlay);

    let resolvido = false;
    function fechar() {
      if (resolvido) return;
      resolvido = true;
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 500);
    }

    if (skipavel) {
      overlay.addEventListener('click', fechar);
      document.addEventListener('keydown', function handler(e) {
        if (e.code === 'Space' || e.code === 'Enter') {
          document.removeEventListener('keydown', handler);
          fechar();
        }
      });
    }

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    // Auto-dismiss após 2.2s
    setTimeout(fechar, 2200);
  });
}

/**
 * Versão especial para o Dia 7 (pivô) — dura mais, mais solene.
 */
export function transicaoPivo() {
  return transicaoDia(7, {
    subtitulo: 'a escolha que divide',
    skipavel:  false,
  });
}

/**
 * Versão para o Dia 13 — sem auto-dismiss.
 */
export function transicaoFinal() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 500;
      background: #080a0b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      opacity: 0;
      transition: opacity 1s ease;
    `;

    const numEl = document.createElement('div');
    numEl.style.cssText = `
      font-family: Georgia, serif;
      font-size: clamp(16px, 4vw, 22px);
      letter-spacing: 0.3em;
      color: rgba(201, 162, 39, 0.5);
    `;
    numEl.textContent = '☉';

    const subEl = document.createElement('div');
    subEl.style.cssText = `
      font-family: 'Share Tech Mono', monospace;
      font-size: clamp(12px, 2.5vw, 15px);
      letter-spacing: 0.15em;
      color: rgba(201, 162, 39, 0.65);
    `;
    subEl.textContent = 'o sétimo dia';

    overlay.appendChild(numEl);
    overlay.appendChild(subEl);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // 3s de solene, depois resolve
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); resolve(); }, 1000);
    }, 3000);
  });
}
