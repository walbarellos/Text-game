// 📦 Importação dos tooltips simbólicos externos
import { buildTooltips } from './tooltip.js';


/**
 * Atualiza o cabeçalho da HUD com nome do dia e estilo baseado na build ativa.
 * Também adiciona tooltip, classe global ao body, e animação visual ao mudar de build.
 * @param {string} nomeDia - Nome do dia atual (ex: "Yom Revi'i")
 * @param {string} build - Caminho moral atual do jogador (profano, virtuoso, anomalia)
 */
export function atualizarHUD(nomeDia, build) {
  const hudDia = document.getElementById('hud-dia');
  const hudBuild = document.getElementById('hud-build');

  if (!hudDia || !hudBuild) {
    console.warn('⚠️ HUD não encontrada no DOM.');
    return;
  }

  // ⬅️ Nome do dia (badge da esquerda)
  hudDia.textContent = nomeDia;
  hudDia.className = 'badge dia';

  // ➡️ Build dominante (badge da direita)
  hudBuild.textContent = formatarBuild(build);
  hudBuild.className = `badge build ${build}`;
  hudBuild.setAttribute('data-tooltip', buildTooltips[build] || '');
  hudBuild.setAttribute('title', buildTooltips[build] || '');

  // 🌐 Atualiza o <body> com classe de build (para estilos globais)
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${build}`);

  // ✨ Animação sutil ao trocar de build
  hudBuild.classList.add('changed');
  setTimeout(() => hudBuild.classList.remove('changed'), 400);
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
