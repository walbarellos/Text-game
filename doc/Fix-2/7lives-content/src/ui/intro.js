/**
 * src/ui/intro.js  — reescrita completa
 *
 * Sequência de abertura em 5 batidas:
 *   1. Silêncio (imagem fade-in)
 *   2. Primeira linha (typewriter)
 *   3. Pausa 800ms
 *   4. Segunda linha (typewriter)
 *   5. Botão aparece (fade-in delay)
 *
 * Variações aleatórias por run → rejogabilidade.
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
const PAUSAS = { '.': 340, '!': 340, '?': 340, ',': 110, ';': 190, ':': 150, '—': 90 };
const VEL_BASE = 32; // ms por caractere

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

  pularBtn.addEventListener('click', skip);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') skip();
  }, { once: true });

  // ── Sortear abertura ──────────────────────────────────────────────
  const { linha1, linha2 } = ABERTURAS[Math.floor(Math.random() * ABERTURAS.length)];

  // ── 1. Imagem aparece em fade-in lento ───────────────────────────
  banner.style.opacity = '0';
  banner.style.transition = 'opacity 2s ease';
  await esperar(60); // garante que o transition está aplicado
  banner.style.opacity = '1';
  await Promise.race([esperar(1800), skipPromise]);
  if (pulou) return;

  // ── 2. Primeira linha ─────────────────────────────────────────────
  const p1 = criarParagrafo(textoEl);
  await typewriter(p1, linha1);
  if (pulou) return;

  // ── 3. Pausa entre linhas ─────────────────────────────────────────
  await Promise.race([esperar(900), skipPromise]);
  if (pulou) return;

  // ── 4. Segunda linha ──────────────────────────────────────────────
  const p2 = criarParagrafo(textoEl, true); // destacada
  await typewriter(p2, linha2);
  if (pulou) return;

  // ── 5. Botão aparece com fade ─────────────────────────────────────
  await Promise.race([esperar(500), skipPromise]);
  if (pulou) return;

  pularBtn.style.opacity = '0';
  pularBtn.style.display = 'block';
  pularBtn.style.transition = 'opacity 0.5s ease';
  await esperar(30);
  pularBtn.style.opacity = '1';
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

function typewriter(el, texto) {
  return new Promise(resolve => {
    let i = 0;
    function tick() {
      if (i >= texto.length) { resolve(); return; }
      const c = texto[i++];
      el.textContent += c;
      const delay = (PAUSAS[c] ?? VEL_BASE) * (0.82 + Math.random() * 0.36);
      setTimeout(tick, delay);
    }
    tick();
  });
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function encerrarIntro(el) {
  el.style.transition = 'opacity 0.6s ease';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.display = 'none';
    el.classList.add('oculta');
  }, 650);
}
