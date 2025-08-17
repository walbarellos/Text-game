// 📁 src/ui/hud.js
// Atualização robusta do HUD: não troca innerHTML, evita recriações e loops,
// sincroniza classes no <body>, tooltips por data-attribute e partículas leves.

import { buildTooltips } from './tooltip.js';

// 🔧 util: remove acentos e normaliza
const unaccent = s => String(s ?? '')
.normalize('NFD')
.replace(/\p{Diacritic}/gu, '')
.toLowerCase();

// 🔧 util: mapeia entradas “soltas” (texto ou número) para uma das 3 builds
function normalizeBuild(input) {
  if (input == null) return readBuildFromBody() ?? 'anomalia';

  const n = Number(input);
  if (!Number.isNaN(n)) {
    if (n >= 0.34) return 'virtuoso';
    if (n <= -0.34) return 'profano';
    return 'anomalia';
  }

  const s = unaccent(input);
  const map = {
    virtuoso: 'virtuoso', justo: 'virtuoso', bondoso: 'virtuoso', benevolente: 'virtuoso',
    profano: 'profano', perverso: 'profano', mau: 'profano', mal: 'profano', cruel: 'profano',
    anomalia: 'anomalia', caotico: 'anomalia', caos: 'anomalia', neutro: 'anomalia'
  };
  return map[s] ?? readBuildFromBody() ?? 'anomalia';
}

function readBuildFromBody() {
  const b = document.body.classList;
  if (b.contains('build-virtuoso')) return 'virtuoso';
  if (b.contains('build-profano'))  return 'profano';
  if (b.contains('build-anomalia')) return 'anomalia';
  return null;
}

function tooltipDefault(kind) {
  switch (kind) {
    case 'virtuoso': return 'Seu espírito se eleva. Você é um farol.';
    case 'anomalia': return 'Ruído no campo. Você é a exceção que perturba a regra.';
    default:         return 'Seu espírito vacila. Reoriente o curso.';
  }
}

// 🫧 partículas (leve) — uma instância por vez
function spawnParticles(qtd = 18) {
  cleanupParticles();
  const box = document.createElement('div');
  box.className = 'particles-container';
  for (let i = 0; i < qtd; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `${Math.random() * 100}vh`;
    p.style.animationDuration = `${8 + Math.random() * 4}s`;
    p.style.animationDelay = `${Math.random() * 5}s`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
}
function cleanupParticles() {
  document.querySelectorAll('.particles-container').forEach(n => n.remove());
}

// 📌 Atualiza HUD (idempotente; sem recriar conteúdo desnecessariamente)
export function atualizarHUD(nomeDia, build) {
  const diaEl   = document.getElementById('hud-dia');
  const buildEl = document.getElementById('hud-build');
  if (!diaEl || !buildEl) { console.warn('⚠️ HUD não encontrado no DOM.'); return; }

  // ===== Dia (esquerda)
  if (typeof nomeDia === 'string' && nomeDia !== diaEl.textContent) {
    diaEl.textContent = nomeDia;
  }

  // ===== Build (direita)
  const kind = normalizeBuild(build);

  // Evita reprocessar se nada mudou
  const lastKind = buildEl.dataset.kind || '';
  const changed = lastKind !== kind;

  // classes no body
  document.body.classList.remove('build-virtuoso', 'build-profano', 'build-anomalia');
  document.body.classList.add(`build-${kind}`);

  // classes visuais no badge
  buildEl.classList.remove('virtuoso', 'profano', 'anomalia');
  buildEl.classList.add(kind);
  buildEl.dataset.kind = kind;

  // garante estrutura “dot + label” sem trocar innerHTML
  let dot   = buildEl.querySelector('.dot');
  let label = buildEl.querySelector('.label');
  if (!dot)   { dot = document.createElement('span'); dot.className = 'dot'; dot.setAttribute('aria-hidden','true'); buildEl.prepend(dot); }
  if (!label) { label = document.createElement('span'); label.className = 'label'; buildEl.appendChild(label); }

  const nomes = { virtuoso: 'Virtuoso', profano: 'Profano', anomalia: 'Anomalia' };
  label.textContent = nomes[kind] || '—';
  buildEl.setAttribute('aria-label', `Build atual: ${nomes[kind] || '—'}`);

  // tooltip vítrea via data-attribute
  const tip = (buildTooltips?.[kind]?.texto) ?? tooltipDefault(kind);
  buildEl.setAttribute('data-tooltip', tip);

  // micro animação e partículas apenas quando a build muda
  if (changed) {
    buildEl.classList.add('changed');
    setTimeout(() => buildEl.classList.remove('changed'), 360);
    spawnParticles(18);
  }
}

// 🧰 opcional: sincroniza o CSS var do título para o sticky do HUD ficar perfeito
export function medirTituloParaHUD() {
  const t = document.querySelector('.titulo-ritual');
  const h = Math.max(0, Math.round((t?.getBoundingClientRect().height ?? 56)));
  document.documentElement.style.setProperty('--titulo-h', `${h}px`);
}
