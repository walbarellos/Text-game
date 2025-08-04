document.addEventListener('DOMContentLoaded', () => {
  const titulo = document.querySelector('.titulo-animado');
  if (!titulo) return;

  // Delay para aplicar glow
  setTimeout(() => {
    titulo.classList.add('glow');
  }, 4000);

  // Efeito extra: traços geométricos ao fundo
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100');
  svg.setAttribute('viewBox', '0 0 800 100');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.zIndex = '0';
  svg.innerHTML = `
  <polyline points="0,80 150,20 300,60 450,10 600,80 800,40"
  stroke="#ffffff33"
  stroke-width="1.5"
  fill="none"
  stroke-dasharray="5,5"
  />
  `;

  titulo.parentElement?.prepend(svg);
});
