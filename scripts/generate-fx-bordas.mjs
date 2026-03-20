/**
 * scripts/generate-fx-bordas.mjs
 * Gera o WebP estático do efeito de bordas de fogo.
 * Resultado idêntico ao CSS, mas zero custo de GPU em runtime.
 *
 * USO:
 *   npm install canvas          (apenas dev dependency)
 *   node scripts/generate-fx-bordas.mjs
 *
 * OUTPUT:
 *   assets/fx-bordas.webp      (~80KB, qualidade 0.85)
 *   assets/fx-bordas@2x.webp   (~180KB, para telas retina)
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const SIZES = [
  { w: 1920, h: 1080, suffix: '',    quality: 0.85 },
  { w: 3840, h: 2160, suffix: '@2x', quality: 0.80 },
];

function renderFX(canvas) {
  const { width: W, height: H } = canvas;
  const ctx = canvas.getContext('2d');

  // Fundo transparente
  ctx.clearRect(0, 0, W, H);

  // ── Gradientes radiais nos 4 cantos (replicando o CSS) ─────────────
  const corners = [
    [0, 1],   // bottom-left
    [1, 1],   // bottom-right
    [0, 0],   // top-left
    [1, 0],   // top-right
  ];

  corners.forEach(([xf, yf]) => {
    const cx = xf * W;
    const cy = yf * H;
    const r  = Math.max(W, H) * 0.75;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.55, 'rgba(0,0,0,0)');
    g.addColorStop(0.68, 'rgba(255,122,0,0.11)');
    g.addColorStop(0.78, 'rgba(255,179,0,0.08)');
    g.addColorStop(0.90, 'rgba(0,0,0,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });

  // ── Gradiente superior e inferior (borda horizontal) ────────────────
  const gradTop = ctx.createLinearGradient(0, 0, 0, H * 0.3);
  gradTop.addColorStop(0,    'rgba(255,122,0,0.07)');
  gradTop.addColorStop(0.15, 'rgba(255,122,0,0.03)');
  gradTop.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, 0, W, H);

  const gradBot = ctx.createLinearGradient(0, H, 0, H * 0.7);
  gradBot.addColorStop(0,    'rgba(255,122,0,0.07)');
  gradBot.addColorStop(0.15, 'rgba(255,122,0,0.03)');
  gradBot.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = gradBot;
  ctx.fillRect(0, 0, W, H);

  // ── Overlay central (afterburner glow sutil) ─────────────────────────
  const gradCenter = ctx.createRadialGradient(W/2, H, 0, W/2, H, H * 0.9);
  gradCenter.addColorStop(0,    'rgba(255,122,0,0.06)');
  gradCenter.addColorStop(0.4,  'rgba(255,179,0,0.03)');
  gradCenter.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = gradCenter;
  ctx.fillRect(0, 0, W, H);
}

// ── Gerar e salvar ──────────────────────────────────────────────────────
mkdirSync(resolve('./assets'), { recursive: true });

for (const { w, h, suffix, quality } of SIZES) {
  const canvas = createCanvas(w, h);
  renderFX(canvas);

  const outPath = resolve(`./assets/fx-bordas${suffix}.png`);
  const buffer  = canvas.toBuffer('image/png');
  writeFileSync(outPath, buffer);

  console.log(`✓ ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
}

console.log('\nPronto! Agora no CSS:');
console.log('#fx-bordas { background-image: url("/assets/fx-bordas.png"); }');
