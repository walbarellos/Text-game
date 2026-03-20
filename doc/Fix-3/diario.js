/**
 * src/ui/diario.js
 * Diário in-game — tela de histórico de escolhas do jogador.
 * Acessível via botão discreto no HUD.
 * Mostra escolhas passadas, itens coletados, e karma atual.
 *
 * INTEGRAÇÃO:
 *   import { abrirDiario, fecharDiario } from './ui/diario.js';
 *   btnDiario.addEventListener('click', () => abrirDiario(estado));
 */

/**
 * @param {object} estado - estado completo do jogo
 */
export function abrirDiario(estado) {
  if (document.getElementById('diario-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'diario-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(4, 6, 8, 0.96);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    padding: 24px 16px 48px;
    opacity: 0;
    transition: opacity 0.35s ease;
  `;

  overlay.innerHTML = _renderDiario(estado);

  // Botão fechar
  const btnFechar = document.createElement('button');
  btnFechar.textContent = '× fechar';
  btnFechar.style.cssText = `
    position: sticky;
    top: 0;
    margin: 0 auto 20px;
    background: transparent;
    border: 1px solid rgba(201,162,39,0.25);
    color: rgba(201,162,39,0.6);
    padding: 6px 20px;
    border-radius: 4px;
    font-size: 11px;
    letter-spacing: 0.12em;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    align-self: flex-end;
  `;
  btnFechar.addEventListener('click', () => fecharDiario());
  overlay.insertBefore(btnFechar, overlay.firstChild);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  // ESC fecha
  document.addEventListener('keydown', _escListener);
}

export function fecharDiario() {
  const el = document.getElementById('diario-overlay');
  if (!el) return;
  document.removeEventListener('keydown', _escListener);
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 350);
}

function _escListener(e) {
  if (e.key === 'Escape') fecharDiario();
}

function _renderDiario(estado) {
  const { historico = [], karma = {}, itens = [], dia = 1 } = estado;

  const karmaItems = [
    { label: 'Coragem',  val: karma.coragem ?? 50, cor: '#e05a30' },
    { label: 'Empatia',  val: karma.empatia ?? 50, cor: '#4a9eff' },
    { label: 'Astúcia',  val: karma.astucia ?? 50, cor: '#c9a227' },
    { label: 'Fé',       val: karma.fe      ?? 50, cor: '#8b5cf6' },
  ];

  const karmaHTML = karmaItems.map(({ label, val, cor }) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="width:58px;font-size:11px;color:rgba(201,162,39,0.5);font-family:'Share Tech Mono',monospace">${label}</span>
      <div style="flex:1;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${Math.round(val)}%;background:${cor};border-radius:2px;opacity:0.75"></div>
      </div>
      <span style="width:24px;font-size:11px;color:rgba(201,162,39,0.4);font-family:'Share Tech Mono',monospace;text-align:right">${Math.round(val)}</span>
    </div>
  `).join('');

  const itensHTML = itens.length === 0
    ? '<span style="font-size:12px;color:rgba(201,162,39,0.3)">nenhum item ainda</span>'
    : itens.map(item => `
        <span style="display:inline-block;font-size:11px;padding:3px 10px;border:1px solid rgba(201,162,39,0.2);border-radius:20px;color:rgba(201,162,39,0.65);font-family:'Share Tech Mono',monospace;margin:2px">${item.replace(/_/g, ' ')}</span>
      `).join('');

  const historicoHTML = historico.length === 0
    ? '<p style="font-size:13px;color:rgba(201,162,39,0.3);text-align:center">nenhuma escolha registrada ainda</p>'
    : [...historico].reverse().map(h => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(201,162,39,0.07)">
          <div style="font-size:10px;color:rgba(201,162,39,0.35);letter-spacing:0.12em;margin-bottom:4px;font-family:'Share Tech Mono',monospace">
            dia ${h.dia} · ${h.evento || ''}
          </div>
          <div style="font-size:13px;color:rgba(220,210,195,0.8);font-family:'Share Tech Mono',monospace;line-height:1.5">${h.escolha}</div>
          ${h.resumo ? `<div style="font-size:11px;color:rgba(201,162,39,0.5);margin-top:3px;font-family:'Share Tech Mono',monospace;font-style:italic">${h.resumo}</div>` : ''}
        </div>
      `).join('');

  return `
    <div style="width:100%;max-width:480px;margin:0 auto">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:20px;color:rgba(201,162,39,0.7);margin-bottom:6px">☉</div>
        <div style="font-family:Georgia,serif;font-size:18px;color:rgba(232,220,200,0.85);letter-spacing:0.05em">diário</div>
        <div style="font-size:10px;letter-spacing:0.2em;color:rgba(201,162,39,0.35);margin-top:4px;font-family:'Share Tech Mono',monospace">dia ${dia} de 13</div>
      </div>

      <div style="margin-bottom:24px">
        <div style="font-size:10px;letter-spacing:0.18em;color:rgba(201,162,39,0.4);margin-bottom:12px;font-family:'Share Tech Mono',monospace">estado do espírito</div>
        ${karmaHTML}
      </div>

      ${itens.length > 0 ? `
      <div style="margin-bottom:24px">
        <div style="font-size:10px;letter-spacing:0.18em;color:rgba(201,162,39,0.4);margin-bottom:10px;font-family:'Share Tech Mono',monospace">itens carregados</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${itensHTML}</div>
      </div>
      ` : ''}

      <div>
        <div style="font-size:10px;letter-spacing:0.18em;color:rgba(201,162,39,0.4);margin-bottom:8px;font-family:'Share Tech Mono',monospace">escolhas registradas</div>
        ${historicoHTML}
      </div>
    </div>
  `;
}
