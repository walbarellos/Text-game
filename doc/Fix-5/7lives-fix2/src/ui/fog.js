/**
 * src/ui/fog.js — STUB
 * Canvas de névoa desativado. O visual de névoa é feito via CSS puro
 * em src/styles/atmosfera.css para evitar qualquer crash ou overdraw.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var c = document.getElementById('etereal-fog');
    if (c) {
      c.style.display = 'none';
      c.width  = 1;
      c.height = 1;
    }
  });
})();
