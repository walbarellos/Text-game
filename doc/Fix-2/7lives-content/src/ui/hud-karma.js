/**
 * src/ui/hud-karma.js
 * HUD de karma multidimensional — 4 eixos visuais.
 * Substitui o badge único "Virtuoso/Profano/Anomalia" por um display
 * que mostra a direção do personagem sem revelar um julgamento binário.
 *
 * INTEGRAÇÃO:
 *   import { renderHudKarma, atualizarHudKarma } from './ui/hud-karma.js';
 *
 *   // Na inicialização (após o HUD existir no DOM):
 *   renderHudKarma(estado.karma);
 *
 *   // Ao atualizar karma (no evento 'estado:atualizado'):
 *   window.addEventListener('estado:atualizado', e => {
 *     atualizarHudKarma(e.detail.karma);
 *   });
 */

const EIXOS = [
  { key: 'coragem',  label: 'Coragem', cor: '#e05a30', descricao: 'Confronto, risco, ação direta' },
  { key: 'empatia',  label: 'Empatia', cor: '#4a9eff', descricao: 'Compaixão, ajuda, sacrifício' },
  { key: 'astucia',  label: 'Astúcia',  cor: '#c9a227', descricao: 'Estratégia, pragmatismo, engano' },
  { key: 'fe',       label: 'Fé',      cor: '#8b5cf6', descricao: 'Transcendência, símbolo, crença' },
];

let _container = null;
let _barras = {};

/**
 * Renderiza o HUD de karma no container existente do #hud-build.
 * Chama uma única vez na inicialização.
 * @param {object} karma - { coragem, empatia, astucia, fe }
 */
export function renderHudKarma(karma) {
  // Tenta encontrar o container do hud-build ou o #hud
  const hudBuild = document.getElementById('hud-build');
  const hudEl    = document.getElementById('hud');
  if (!hudBuild && !hudEl) return;

  // Cria o container do karma
  _container = document.createElement('div');
  _container.id = 'hud-karma';
  _container.setAttribute('role', 'status');
  _container.setAttribute('aria-live', 'polite');
  _container.setAttribute('aria-label', 'Estado do personagem');

  _container.style.cssText = `
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  `;

  // Criar uma barra por eixo
  EIXOS.forEach(({ key, label, cor, descricao }) => {
    const valor = karma[key] ?? 50;

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      cursor: default;
      position: relative;
    `;
    wrap.title = `${label}: ${Math.round(valor)}/100 — ${descricao}`;

    const labelEl = document.createElement('span');
    labelEl.textContent = label[0]; // inicial
    labelEl.style.cssText = `
      font-size: 9px;
      letter-spacing: 0.08em;
      color: ${cor};
      opacity: 0.7;
      font-family: 'Share Tech Mono', monospace;
    `;

    const trilho = document.createElement('div');
    trilho.style.cssText = `
      width: 3px;
      height: 28px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    `;

    const barra = document.createElement('div');
    barra.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${valor}%;
      background: ${cor};
      border-radius: 2px;
      opacity: 0.8;
      transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    trilho.appendChild(barra);
    wrap.appendChild(labelEl);
    wrap.appendChild(trilho);
    _container.appendChild(wrap);

    _barras[key] = barra;
  });

  // Inserir no HUD — depois do badge atual ou substituir
  if (hudBuild) {
    hudBuild.insertAdjacentElement('afterend', _container);
  } else {
    hudEl.appendChild(_container);
  }
}

/**
 * Atualiza as barras com novos valores (anima suavemente).
 * @param {object} karma
 */
export function atualizarHudKarma(karma) {
  if (!_container) return;

  EIXOS.forEach(({ key, label }) => {
    const barra = _barras[key];
    if (!barra) return;
    const valor = Math.max(0, Math.min(100, karma[key] ?? 50));
    barra.style.height = `${valor}%`;

    // Título acessível atualizado
    const wrap = barra.parentElement?.parentElement;
    if (wrap) {
      const eixo = EIXOS.find(e => e.key === key);
      wrap.title = `${label}: ${Math.round(valor)}/100 — ${eixo?.descricao}`;
    }
  });
}

/**
 * Animação de "pulso" num eixo específico quando ele muda.
 * Chamar após aplicarConsequencia.
 * @param {string} eixo - chave do eixo
 * @param {number} delta - quanto mudou (positivo ou negativo)
 */
export function pulsarEixo(eixo, delta) {
  const barra = _barras[eixo];
  if (!barra) return;

  const cor = EIXOS.find(e => e.key === eixo)?.cor;
  if (!cor) return;

  // Flash de intensidade
  barra.style.opacity = '1';
  barra.style.boxShadow = delta > 0
    ? `0 0 8px ${cor}`
    : `0 0 8px rgba(255,60,60,0.5)`;

  setTimeout(() => {
    barra.style.boxShadow = 'none';
    barra.style.opacity   = '0.8';
  }, 700);
}
