/**
 * src/ui/hud-karma.js — versão SEGURA (não quebra layout existente)
 *
 * DIFERENÇA da versão anterior: não insere elementos no HUD principal.
 * Cria um tooltip flutuante discreto que aparece ao passar o mouse
 * no badge existente (#hud-build). Zero risco de quebrar layout.
 */

export function renderHudKarma(karma) {
  _atualizarBadge(karma);
  _criarTooltipKarma(karma);
}

export function atualizarHudKarma(karma) {
  _atualizarBadge(karma);
  _atualizarTooltip(karma);
}

export function pulsarEixo(eixo, delta) {
  const pill = document.getElementById('hud-build');
  if (!pill) return;

  // Flash sutil no badge existente
  const cor = delta > 0 ? 'rgba(201,162,39,0.8)' : 'rgba(220,80,80,0.8)';
  pill.style.boxShadow = `0 0 12px ${cor}`;
  setTimeout(() => { pill.style.boxShadow = ''; }, 600);
}

// ── Internas ────────────────────────────────────────────────────────

const EIXOS = [
  { key: 'coragem', label: 'Coragem', cor: '#e05a30' },
  { key: 'empatia', label: 'Empatia', cor: '#4a9eff' },
  { key: 'astucia', label: 'Astúcia',  cor: '#c9a227' },
  { key: 'fe',      label: 'Fé',      cor: '#8b5cf6' },
];

function _atualizarBadge(karma) {
  const pill = document.getElementById('hud-build');
  if (!pill) return;

  // Atualizar tooltip nativo com valores de karma
  const lines = EIXOS.map(e => `${e.label}: ${Math.round(karma[e.key] ?? 50)}`).join(' · ');
  pill.setAttribute('data-tooltip', lines);
  pill.title = lines;
}

let _tooltipEl = null;

function _criarTooltipKarma(karma) {
  const pill = document.getElementById('hud-build');
  if (!pill || document.getElementById('karma-tooltip')) return;

  _tooltipEl = document.createElement('div');
  _tooltipEl.id = 'karma-tooltip';
  _tooltipEl.style.cssText = `
    position: fixed;
    z-index: 9000;
    background: rgba(7,8,10,0.95);
    border: 1px solid rgba(201,162,39,0.25);
    border-radius: 8px;
    padding: 12px 14px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    min-width: 150px;
  `;

  _atualizarTooltip(karma);
  document.body.appendChild(_tooltipEl);

  pill.addEventListener('mouseenter', (e) => {
    const rect = pill.getBoundingClientRect();
    _tooltipEl.style.left  = rect.left + 'px';
    _tooltipEl.style.top   = (rect.bottom + 8) + 'px';
    _tooltipEl.style.opacity = '1';
  });

  pill.addEventListener('mouseleave', () => {
    _tooltipEl.style.opacity = '0';
  });
}

function _atualizarTooltip(karma) {
  if (!_tooltipEl) return;

  _tooltipEl.innerHTML = EIXOS.map(({ key, label, cor }) => {
    const val = Math.round(karma[key] ?? 50);
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="width:52px;font-size:11px;color:rgba(201,162,39,0.55);font-family:'Share Tech Mono',monospace">${label}</span>
        <div style="flex:1;height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${val}%;background:${cor};border-radius:2px;opacity:0.8"></div>
        </div>
        <span style="width:22px;font-size:11px;color:rgba(201,162,39,0.4);font-family:'Share Tech Mono',monospace;text-align:right">${val}</span>
      </div>
    `;
  }).join('');
}
