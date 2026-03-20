/**
 * src/ui/fundo-geom.js — STUB
 * Canvas de fundo desativado. O visual atmosférico é feito via CSS puro
 * em src/styles/atmosfera.css — zero JS, zero canvas, zero crash.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var c = document.getElementById('background-canvas');
    if (c) {
      c.style.display = 'none';
      c.width  = 1;
      c.height = 1;
    }
  });
})();
