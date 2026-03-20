/**
 * src/ui/fog.js — versão SEGURA (sem imports externos)
 *
 * SUBSTITUI o fog.js anterior que usava import { isLowEnd }.
 * Este arquivo é autocontido — não depende de nenhum outro módulo.
 *
 * Coloque este arquivo em src/ui/fog.js e NÃO importe mais nada nele.
 */

(function () {
  'use strict';

  // Espera o DOM estar pronto
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var canvas = document.getElementById('etereal-fog');
    if (!canvas) return; // Canvas não existe — sai silenciosamente

    // Detectar low-end sem imports
    var cores    = navigator.hardwareConcurrency || 4;
    var isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    var isLowEnd = cores <= 2 || isMobile;

    if (isLowEnd) {
      canvas.style.display = 'none';
      return;
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var SCALE      = 0.5;
    var TARGET_FPS = 30;
    var INTERVAL   = 1000 / TARGET_FPS;
    var lastTime   = 0;

    var w = Math.floor(window.innerWidth  * SCALE);
    var h = Math.floor(window.innerHeight * SCALE);
    canvas.width  = w;
    canvas.height = h;

    // CSS escala de volta ao tamanho real
    canvas.style.width  = '100%';
    canvas.style.height = '100%';

    var COUNT     = 16;
    var particles = [];
    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x:      Math.random() * w,
        y:      Math.random() * h,
        radius: (15 + Math.random() * 25) * SCALE,
        alpha:  0.03 + Math.random() * 0.07,
        dx:     (-0.12 + Math.random() * 0.24) * SCALE,
        dy:     (-0.08 + Math.random() * 0.16) * SCALE,
      });
    }

    window.addEventListener('resize', function () {
      w = Math.floor(window.innerWidth  * SCALE);
      h = Math.floor(window.innerHeight * SCALE);
      canvas.width  = w;
      canvas.height = h;
    });

    function animate(ts) {
      requestAnimationFrame(animate);
      var delta = ts - lastTime;
      if (delta < INTERVAL) return;
      lastTime = ts - (delta % INTERVAL);

      ctx.clearRect(0, 0, w, h);

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < -p.radius)     p.x = w + p.radius;
        if (p.x > w + p.radius)  p.x = -p.radius;
        if (p.y < -p.radius)     p.y = h + p.radius;
        if (p.y > h + p.radius)  p.y = -p.radius;
      }

      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(animate);
  });
})();
