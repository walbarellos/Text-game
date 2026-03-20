/**
 * src/ui/fundo-geom.js — versão melhorada (substitui o original)
 *
 * Background atmosférico do jogo.
 * Usa o canvas #background-canvas para criar profundidade sutil.
 * Zero imports, autocontido, não crasheia.
 *
 * O que faz:
 *   - Vignette dourada nas bordas (substitui #fx-bordas pesado)
 *   - Névoa sutil no centro
 *   - Pulsação suave a 30fps
 */

(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var w, h;

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    var t = 0;
    var lastTime = 0;
    var INTERVAL = 1000 / 30;

    function draw(ts) {
      requestAnimationFrame(draw);
      var delta = ts - lastTime;
      if (delta < INTERVAL) return;
      lastTime = ts - (delta % INTERVAL);

      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      // ── Névoa central quente ────────────────────────────────
      var breath = 0.5 + 0.5 * Math.sin(t * 0.7);
      var gradCenter = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, w * 0.5);
      gradCenter.addColorStop(0,   'rgba(50, 35, 8,' + (0.08 + 0.04 * breath) + ')');
      gradCenter.addColorStop(0.5, 'rgba(30, 20, 5, 0.04)');
      gradCenter.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = gradCenter;
      ctx.fillRect(0, 0, w, h);

      // ── Vignette dourada nos cantos ─────────────────────────
      var vigor = 0.5 + 0.5 * Math.sin(t * 0.4);
      var corners = [[0,0],[1,0],[0,1],[1,1]];
      corners.forEach(function(c, i) {
        var cx = c[0] * w;
        var cy = c[1] * h;
        var r  = Math.max(w, h) * 0.55;
        var phase = t * 0.3 + i * 0.8;
        var intensity = 0.06 + 0.03 * Math.sin(phase);
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0,    'rgba(0,0,0,0)');
        g.addColorStop(0.55, 'rgba(0,0,0,0)');
        g.addColorStop(0.72, 'rgba(201,162,39,' + intensity + ')');
        g.addColorStop(0.85, 'rgba(180,120,20,' + (intensity*0.5) + ')');
        g.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // ── Borda superior fina ─────────────────────────────────
      var topG = ctx.createLinearGradient(0, 0, 0, h * 0.12);
      topG.addColorStop(0,   'rgba(201,162,39,' + (0.04 + 0.02 * vigor) + ')');
      topG.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = topG;
      ctx.fillRect(0, 0, w, h * 0.12);

      // ── Borda inferior fina ─────────────────────────────────
      var botG = ctx.createLinearGradient(0, h, 0, h * 0.88);
      botG.addColorStop(0,   'rgba(201,162,39,' + (0.05 + 0.02 * vigor) + ')');
      botG.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = botG;
      ctx.fillRect(0, h * 0.88, w, h);
    }

    requestAnimationFrame(draw);
  });
})();
