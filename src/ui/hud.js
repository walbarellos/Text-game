// 📦 Importação dos tooltips simbólicos externos
import { buildTooltips } from './tooltip.js';

/**
 * Atualiza o cabeçalho da HUD com nome do dia e estilo baseado na build ativa.
 * Também adiciona tooltip, classe global ao body, efeito ripple e partículas visuais.
 * @param {string} nomeDia - Nome do dia atual (ex: "Yom Revi'i")
 * @param {string} build - Caminho moral atual do jogador (profano, virtuoso, anomalia)
 */
export function atualizarHUD(nomeDia, build) {
  const hudDia = document.getElementById('hud-dia');
  const hudBuild = document.getElementById('hud-build');
  const tooltip = document.getElementById('tooltip-ritual');

  if (!hudDia || !hudBuild || !tooltip) {
    console.warn('⚠️ HUD ou tooltip não encontrada no DOM.');
    return;
  }

  // ⬅️ Nome do dia (badge da esquerda)
  hudDia.textContent = nomeDia;
  hudDia.className = 'badge dia';

  // ➡️ Build dominante (badge da direita)
  hudBuild.textContent = formatarBuild(build);
  hudBuild.className = `badge build ${build}`;

  // 🧠 Tooltip simbólica da build
  const tooltipData = buildTooltips[build];
  if (tooltipData) {
    hudBuild.setAttribute('data-tooltip', tooltipData.texto);
  } else {
    hudBuild.removeAttribute('data-tooltip');
  }

  // 🌐 Atualiza o <body> com classe de build (para estilos globais)
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);

  // ✨ Animação sutil ao trocar de build
  hudBuild.classList.add('changed');
  setTimeout(() => hudBuild.classList.remove('changed'), 400);

  // ✨ Partículas etéreas por build
  limparParticulasEticas();
  gerarParticulasEticas(20);

  // 🔮 Tooltip ritualística ao passar o mouse
  hudDia.addEventListener('mouseenter', () => {
    const frase = hudDia.dataset.frase || '⚡ Frase ritualística não disponível.';
    tooltip.textContent = frase;
    tooltip.classList.add('visible');
  });

  hudDia.addEventListener('mouseleave', () => {
    tooltip.classList.remove('visible');
  });
}

/**
 * Retorna o nome estilizado da build para exibição no badge.
 * @param {string} build
 * @returns {string}
 */
function formatarBuild(build) {
  switch (build) {
    case 'virtuoso':
      return '🟢 Virtuoso';
    case 'anomalia':
      return '🟣 Anomalia';
    case 'profano':
    default:
      return '🔴 Profano';
  }
}

/**
 * 💫 Gera partículas etéreas flutuantes com cor da build ativa
 * @param {number} qtd - Quantidade de partículas
 */
function gerarParticulasEticas(qtd = 20) {
  const container = document.createElement('div');
  container.className = 'particles-container';

  for (let i = 0; i < qtd; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `${Math.random() * 100}vh`;
    p.style.animationDuration = `${8 + Math.random() * 4}s`;
    p.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(p);
  }

  document.body.appendChild(container);
}

/**
 * 🧹 Remove partículas anteriores para evitar acúmulo visual
 */
function limparParticulasEticas() {
  const antigos = document.querySelectorAll('.particles-container');
  antigos.forEach(el => el.remove());
}
