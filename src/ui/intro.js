/**
 * src/ui/intro.js  — reescrita completa
 *
 * Sequência de abertura em 5 batidas (acelerada):
 *   1. Silêncio (imagem fade-in)
 *   2. Primeira linha (typewriter)
 *   3. Pausa 500ms
 *   4. Segunda linha (typewriter)
 *   5. Botão aparece (fade-in delay)
 */

const ABERTURAS = [
  {
    linha1: 'Toda escolha deixa uma marca no tecido do que você é.',
    linha2: 'São reflexos de quem você decide ser.',
  },
  {
    linha1: 'Existem sete versões de você esperando para ser.',
    linha2: 'Apenas uma delas chega ao fim.',
  },
  {
    linha1: 'O símbolo não julga. Ele registra.',
    linha2: 'O que você vai registrar hoje?',
  },
  {
    linha1: 'Não há certos ou errados aqui.',
    linha2: 'Apenas o que você escolhe carregar.',
  },
];

// Velocidade por tipo de pontuação (ms)
const PAUSAS = { '.': 200, '!': 200, '?': 200, ',': 80, ';': 120, ':': 100, '—': 60 };
const VEL_BASE = 20; // ms por caractere (acelerado)

export async function iniciarIntro() {
  const cinematica = document.getElementById('intro-cinematica');
  const banner     = document.getElementById('intro-banner');
  const textoEl    = document.getElementById('intro-texto');
  const pularBtn   = document.getElementById('pular-intro');

  if (!cinematica || !banner || !textoEl || !pularBtn) return;

  // ── Estado de skip ────────────────────────────────────────────────
  let pulou = false;
  let resolveSkip;
  const skipPromise = new Promise(r => { resolveSkip = r; });

  function skip() {
    if (pulou) return;
    pulou = true;
    resolveSkip();
    encerrarIntro(cinematica);
  }

  // Mostrar botão pular IMEDIATAMENTE (discreto)
  pularBtn.style.display = 'block';
  pularBtn.style.opacity = '0.4';
  pularBtn.addEventListener('click', skip);
  
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') skip();
  }, { once: true });

  // ── Sortear abertura ──────────────────────────────────────────────
  const { linha1, linha2 } = ABERTURAS[Math.floor(Math.random() * ABERTURAS.length)];

  // ── 1. Imagem aparece em fade-in lento ───────────────────────────
  banner.style.opacity = '0';
  banner.style.transition = 'opacity 1.5s ease';
  await esperar(60); 
  banner.style.opacity = '1';
  await Promise.race([esperar(1000), skipPromise]);
  if (pulou) return;

  // ── 2. Primeira linha ─────────────────────────────────────────────
  const p1 = criarParagrafo(textoEl);
  await typewriter(p1, linha1, skipPromise);
  if (pulou) return;

  // ── 3. Pausa entre linhas ─────────────────────────────────────────
  await Promise.race([esperar(500), skipPromise]);
  if (pulou) return;

  // ── 4. Segunda linha ──────────────────────────────────────────────
  const p2 = criarParagrafo(textoEl, true); // destacada
  await typewriter(p2, linha2, skipPromise);
  if (pulou) return;

  // ── 5. Botão brilha mais ao final ─────────────────────────────────
  await Promise.race([esperar(200), skipPromise]);
  if (pulou) return;

  pularBtn.style.opacity = '1';
  pularBtn.style.transition = 'opacity 0.4s ease';
}

// ── Utilitários ────────────────────────────────────────────────────────

function criarParagrafo(container, destaque = false) {
  const p = document.createElement('p');
  p.style.cssText = `
    margin: 0 0 ${destaque ? '0' : '0.6em'};
    font-size: ${destaque ? '16px' : '14px'};
    color: ${destaque ? 'rgba(232,220,200,0.95)' : 'rgba(201,162,39,0.65)'};
    letter-spacing: ${destaque ? '0.02em' : '0.06em'};
    font-family: 'Share Tech Mono', monospace;
    line-height: 1.65;
    text-align: center;
    ${destaque ? '' : 'text-transform: uppercase; font-size: 11px;'}
  `;
  container.appendChild(p);
  return p;
}

function typewriter(el, texto, skipPromise) {
  return new Promise(resolve => {
    let i = 0;
    let cancelado = false;
    
    skipPromise.then(() => { cancelado = true; resolve(); });

    function tick() {
      if (cancelado) return;
      if (i >= texto.length) { resolve(); return; }
      const c = texto[i++];
      el.textContent += c;
      const delay = (PAUSAS[c] ?? VEL_BASE) * (0.8 + Math.random() * 0.4);
      setTimeout(tick, delay);
    }
    tick();
  });
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function encerrarIntro(el) {
  el.style.transition = 'opacity 0.5s ease';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.display = 'none';
    el.classList.add('oculta');
  }, 550);
}
