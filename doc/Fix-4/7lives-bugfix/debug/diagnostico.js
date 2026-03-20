/**
 * debug/diagnostico.js
 *
 * COMO USAR: copiar e colar no console do browser DevTools.
 * Vai imprimir um relatório completo do que está quebrado.
 */

(function diagnostico7Lives() {
  const R = { ok: [], warn: [], erro: [] };
  const log = (tipo, msg) => R[tipo].push(msg);

  // ── Elementos críticos ────────────────────────────────────────
  const els = {
    'game-root':       '.game-root',
    'game-stage':      '.game-stage',
    'wrapper-jogo':    '#wrapper-jogo',
    'hud':             '#hud',
    'evento':          '#evento',
    'intro-cinem':     '#intro-cinematica',
    'intro-banner':    '#intro-banner',
    'intro-texto':     '#intro-texto',
    'pular-intro':     '#pular-intro',
    'fog-canvas':      '#etereal-fog',
    'bg-canvas':       '#background-canvas',
    'fx-bordas':       '#fx-bordas',
    'hud-dia':         '#hud-dia',
    'hud-build':       '#hud-build',
  };

  Object.entries(els).forEach(([nome, sel]) => {
    const el = document.querySelector(sel);
    if (!el) { log('erro', `AUSENTE: ${nome} (${sel})`); return; }

    const style = window.getComputedStyle(el);
    const rect  = el.getBoundingClientRect();
    const vis   = style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity) > 0;

    if (!vis) log('warn', `INVISÍVEL: ${nome} | display:${style.display} visibility:${style.visibility} opacity:${style.opacity}`);
    else if (rect.width === 0 || rect.height === 0) log('warn', `ZERO SIZE: ${nome} | ${rect.width}x${rect.height}`);
    else log('ok', `OK: ${nome} | ${Math.round(rect.width)}x${Math.round(rect.height)} @ ${Math.round(rect.left)},${Math.round(rect.top)}`);
  });

  // ── Choices ───────────────────────────────────────────────────
  const eventoEl   = document.querySelector('#evento');
  const allButtons = eventoEl ? eventoEl.querySelectorAll('button') : [];
  const allChoices = eventoEl ? eventoEl.querySelectorAll('[class*="escolha"],[class*="opcao"],[class*="choice"]') : [];

  if (!eventoEl || eventoEl.children.length === 0) {
    log('erro', 'EVENTO VAZIO — nenhum conteúdo renderizado no #evento');
  } else {
    log('ok', `EVENTO tem ${eventoEl.children.length} elemento(s) filho(s)`);
    const h = eventoEl.innerHTML.slice(0, 200);
    log('ok', `EVENTO HTML preview: ${h}`);
  }

  if (allButtons.length === 0) {
    log('warn', 'SEM BOTÕES no #evento — choices não foram renderizadas');
  } else {
    log('ok', `BOTÕES no #evento: ${allButtons.length}`);
    allButtons.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const s = window.getComputedStyle(b);
      log('ok', `  btn[${i}]: "${b.textContent.slice(0,40)}" | ${Math.round(r.width)}x${Math.round(r.height)} display:${s.display}`);
    });
  }

  // ── Z-index ───────────────────────────────────────────────────
  const zEls = ['#fx-bordas','#fx-sparks','#hud','#evento','#intro-cinematica'];
  zEls.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    const z = window.getComputedStyle(el).zIndex;
    log('ok', `z-index ${sel}: ${z}`);
  });

  // ── CSS carregados ─────────────────────────────────────────────
  const sheets = Array.from(document.styleSheets).map(s => {
    try { return s.href || s.ownerNode?.id || '(inline)'; }
    catch { return '(blocked)'; }
  });
  log('ok', `CSS carregados: ${sheets.join(', ')}`);

  // ── Erros no console ───────────────────────────────────────────
  const origErr = console.error.bind(console);
  console.error = (...args) => { log('erro', args.join(' ')); origErr(...args); };

  // ── Relatório ──────────────────────────────────────────────────
  console.group('%c🔍 7 Lives Diagnóstico', 'font-size:14px;font-weight:bold');
  console.group('%c✅ OK', 'color:green');
  R.ok.forEach(m => console.log(m));
  console.groupEnd();
  if (R.warn.length) {
    console.group('%c⚠️  WARNINGS', 'color:orange');
    R.warn.forEach(m => console.warn(m));
    console.groupEnd();
  }
  if (R.erro.length) {
    console.group('%c❌ ERROS', 'color:red');
    R.erro.forEach(m => console.error(m));
    console.groupEnd();
  }
  console.groupEnd();

  // Copiar para clipboard
  const report = [...R.ok, ...R.warn, ...R.erro].join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).then(() =>
      console.log('%c📋 Relatório copiado para clipboard!', 'color:cyan')
    );
  }

  return R;
})();
