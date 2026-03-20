/**
 * src/ui/tela-inicial.js
 *
 * Injeta o sigil SVG animado e elementos extras na tela inicial.
 * Não depende de nenhum outro módulo. Autocontido.
 *
 * COMO USAR: adicionar no index.html antes de </body>:
 *   <script type="module" src="./src/ui/tela-inicial.js"></script>
 *
 * Ou importar no main.js:
 *   import './ui/tela-inicial.js';
 */

(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var tela = document.getElementById('tela-inicial');
    if (!tela) return;

    var wrap = tela.querySelector('.wrap');
    if (!wrap) return;

    // ── 1. Sigil SVG animado ──────────────────────────────────────
    var sigilWrap = document.createElement('div');
    sigilWrap.className = 'tela-sigil-wrap';
    sigilWrap.innerHTML = _sigilSVG();

    // ── 2. Subtítulo ──────────────────────────────────────────────
    var sub = document.createElement('p');
    sub.className = 'tela-subtitulo';
    sub.textContent = 'um ritual de escolha';

    // ── 3. Divisor ────────────────────────────────────────────────
    var div = document.createElement('div');
    div.className = 'tela-divisor';

    // ── 4. Crédito no rodapé ──────────────────────────────────────
    var cred = document.createElement('p');
    cred.className = 'tela-credito';
    cred.textContent = '☉ willian albarello';

    // ── 5. Montar ─────────────────────────────────────────────────
    // Inserir sigil antes do título
    var titulo = wrap.querySelector('.titulo');
    if (titulo) {
      wrap.insertBefore(sigilWrap, titulo);
      // Inserir subtítulo após o título
      titulo.insertAdjacentElement('afterend', sub);
      sub.insertAdjacentElement('afterend', div);
    } else {
      wrap.prepend(div);
      wrap.prepend(sub);
      wrap.prepend(sigilWrap);
    }

    // Crédito fora do wrap, dentro da tela
    tela.appendChild(cred);

    // ── 6. Trocar texto dos botões ────────────────────────────────
    var btnIniciar   = document.getElementById('btn-iniciar');
    var btnContinuar = document.getElementById('btn-continuar');
    if (btnIniciar   && btnIniciar.textContent.trim()   === 'Iniciar')   btnIniciar.textContent   = 'iniciar';
    if (btnContinuar && btnContinuar.textContent.trim() === 'Continuar') btnContinuar.textContent = 'continuar';
  });

  // ── SVG do sigil ─────────────────────────────────────────────────
  function _sigilSVG() {
    var gold   = 'rgba(201,162,39,0.85)';
    var goldD  = 'rgba(201,162,39,0.4)';
    var goldDD = 'rgba(201,162,39,0.18)';

    return [
      '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',

      // Glow filter
      '<defs>',
      '  <filter id="sig-glow" x="-30%" y="-30%" width="160%" height="160%">',
      '    <feGaussianBlur stdDeviation="3" result="blur"/>',
      '    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
      '  </filter>',
      '</defs>',

      // Anel exterior com traço pontilhado (gira lentamente)
      '<g class="sigil-anel-ext">',
      '  <circle cx="100" cy="100" r="90"',
      '    fill="none"',
      '    stroke="' + goldDD + '"',
      '    stroke-width="0.8"',
      '    stroke-dasharray="3 6"',
      '  />',
      '</g>',

      // Corpo principal (pulsa)
      '<g class="sigil-corpo" filter="url(#sig-glow)">',

      // Círculo principal
      '  <circle cx="100" cy="100" r="78"',
      '    fill="none"',
      '    stroke="' + gold + '"',
      '    stroke-width="1.2"',
      '  />',

      // Quadrado (rotacionado 0°, com serifa nos cantos)
      '  <circle cx="100" cy="100" r="48" fill="none" stroke="' + goldD + '" stroke-width="1.2" />', // wait, the original was rect
      '  <rect x="52" y="52" width="96" height="96"',
      '    fill="none"',
      '    stroke="' + goldD + '"',
      '    stroke-width="1.2"',
      '  />',
      // Cantos do quadrado marcados
      '  <line x1="46" y1="52" x2="58" y2="52" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="52" y1="46" x2="52" y2="58" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="142" y1="52" x2="154" y2="52" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="148" y1="46" x2="148" y2="58" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="46" y1="148" x2="58" y2="148" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="52" y1="142" x2="52" y2="154" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="142" y1="148" x2="154" y2="148" stroke="' + gold + '" stroke-width="1.2"/>',
      '  <line x1="148" y1="142" x2="148" y2="154" stroke="' + gold + '" stroke-width="1.2"/>',

      // Triângulo
      '  <polygon points="100,28 166,148 34,148"',
      '    fill="none"',
      '    stroke="' + gold + '"',
      '    stroke-width="1.4"',
      '    stroke-linejoin="round"',
      '  />',

      // Figura central (corpo humano estilizado)
      // Cabeça
      '  <ellipse cx="100" cy="95" rx="10" ry="13"',
      '    fill="' + goldDD + '"',
      '    stroke="' + goldD + '"',
      '    stroke-width="1"',
      '  />',
      // Ombros/torso
      '  <path d="M82 130 Q100 112 118 130"',
      '    fill="' + goldDD + '"',
      '    stroke="' + goldD + '"',
      '    stroke-width="1"',
      '  />',

      '</g>',
      '</svg>'
    ].join('\n');
  }
})();
