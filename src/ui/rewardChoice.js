export function playChoiceReward(build = 'profano') {
    // overlay raiz
    const root = document.createElement('div');
    root.className = 'action-reward';

    // ring central
    const ring = document.createElement('div');
    ring.className = 'ar-ring';

    // scanline
    const scan = document.createElement('div');
    scan.className = 'ar-scan';

    // constelação SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('ar-stars');
    svg.setAttribute('viewBox','0 0 100 100');
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points','8,70 25,22 46,60 66,18 88,70');
    svg.appendChild(line);

    root.append(ring, scan, svg);
    document.body.appendChild(root);

    requestAnimationFrame(() => root.classList.add('show'));

    // auto-remove
    setTimeout(() => {
        root.classList.remove('show');
        setTimeout(() => root.remove(), 220);
    }, 980);
}

// ripple local no botão
export function rippleOnButton(btn, ev) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const x = (ev?.clientX ?? rect.left + rect.width/2) - rect.left;
    const y = (ev?.clientY ?? rect.top + rect.height/2) - rect.top;
    r.style.left = `${x}px`;
    r.style.top  = `${y}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 520);
}

// pulso no badge de build
export function pulseBuildBadge() {
    const badge = document.getElementById('hud-build');
    if (!badge) return;
    badge.classList.remove('pulse');
    // força reflow pra reiniciar animação
    // eslint-disable-next-line no-unused-expressions
    badge.offsetHeight;
    badge.classList.add('pulse');
}
