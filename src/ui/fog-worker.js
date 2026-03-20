/**
 * src/ui/fog-worker.js
 * Roda o loop de névoa em um Web Worker separado via OffscreenCanvas.
 * A main thread fica 100% livre para UI e lógica de jogo.
 *
 * INTEGRAÇÃO: ver fog.js atualizado que instancia este worker.
 */

let ctx, width, height, particles;

const TARGET_FPS = 30;
const INTERVAL   = 1000 / TARGET_FPS;
let lastTime     = 0;

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    const { canvas, w, h } = data;
    ctx    = canvas.getContext('2d');
    width  = canvas.width  = w;
    height = canvas.height = h;
    initParticles();
    requestAnimationFrame(animate);
  }

  if (data.type === 'resize') {
    width  = canvas.width  = data.w;
    height = canvas.height = data.h;
    // Reposicionar partículas que ficaram fora
    particles.forEach(p => {
      if (p.x > width)  p.x = Math.random() * width;
      if (p.y > height) p.y = Math.random() * height;
    });
  }
};

function initParticles() {
  const COUNT = 18; // baixo o suficiente para 30fps estável
  particles = Array.from({ length: COUNT }, () => ({
    x:      Math.random() * width,
    y:      Math.random() * height,
    radius: (18 + Math.random() * 28) * 0.5,
    alpha:  0.04 + Math.random() * 0.08,
    dx:     (-0.15 + Math.random() * 0.3) * 0.5,
    dy:     (-0.10 + Math.random() * 0.2) * 0.5,
  }));
}

function animate(ts) {
  requestAnimationFrame(animate);

  // Throttle para TARGET_FPS
  const delta = ts - lastTime;
  if (delta < INTERVAL) return;
  lastTime = ts - (delta % INTERVAL);

  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    ctx.beginPath();
    ctx.globalAlpha = p.alpha;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fill();

    p.x += p.dx;
    p.y += p.dy;

    // Wrap suave (entra pelo lado oposto)
    if (p.x < -p.radius)          p.x = width  + p.radius;
    if (p.x > width  + p.radius)  p.x = -p.radius;
    if (p.y < -p.radius)          p.y = height + p.radius;
    if (p.y > height + p.radius)  p.y = -p.radius;
  }

  ctx.globalAlpha = 1;
}
