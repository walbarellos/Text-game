/* 📦 src/ui/rewardChoice.js — overlay central sem vazamentos + símbolos por build */

/** Retorna o SVG (apenas strokes) para a mandala conforme build/símbolo */
function getMandalaShape(build = 'profano', symbol = 'auto') {
    // mapa “auto” por build
    const autoMap = { virtuoso: 'sol', profano: 'cruz', anomalia: 'cristal' };
    const kind = (symbol && symbol !== 'auto') ? symbol : (autoMap[build] || 'sol');

    switch (kind) {
        case 'sol':        // ☉ (círculo + raios)
            return `
            <circle cx="50" cy="50" r="22"></circle>
            ${Array.from({length:12}).map((_,i)=>{
                const a = (i*30) * Math.PI/180, r1=30, r2=44;
                const x1=50+Math.cos(a)*r1, y1=50+Math.sin(a)*r1;
                const x2=50+Math.cos(a)*r2, y2=50+Math.sin(a)*r2;
                return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"></line>`;
            }).join('')}
            `;

        case 'cruz':       // ✖ (quadrado com X)
            return `
            <rect x="26" y="26" width="48" height="48" rx="4" ry="4"></rect>
            <line x1="26" y1="26" x2="74" y2="74"></line>
            <line x1="74" y1="26" x2="26" y2="74"></line>
            `;

        case 'cristal':    // ⟡ (hex/cristal irregular)
            return `
            <polygon points="50,10 78,28 78,72 50,90 22,72 22,28"></polygon>
            <line x1="50" y1="10" x2="50" y2="90"></line>
            <line x1="22" y1="28" x2="78" y2="72"></line>
            <line x1="78" y1="28" x2="22" y2="72"></line>
            `;

        case 'estrela':    // estrela 5 pontas dentro de círculo
            return `
            <circle cx="50" cy="50" r="34"></circle>
            <polygon points="50,18 59,41 84,41 63,56 70,80 50,66 30,80 37,56 16,41 41,41"></polygon>
            `;

        case 'triangulo':  // triângulo ascendente
            return `
            <circle cx="50" cy="50" r="34"></circle>
            <polygon points="50,16 82,78 18,78"></polygon>
            `;

        default:
            return `<circle cx="50" cy="50" r="34"></circle>`;
    }
}

export function playChoiceReward(build = 'profano', symbol = 'auto') {
    // 🔒 Evita overlays duplicados no DOM
    const overlays = document.querySelectorAll('.action-reward');
    overlays.forEach((el, i) => { if (i > 0) el.remove(); });

    // ✅ Reutiliza (ou cria) o overlay
    let root = document.getElementById('action-reward');
    if (!root) {
        root = document.createElement('div');
        root.id = 'action-reward';
        root.className = 'action-reward';
        document.body.appendChild(root);
    }

    // 🔧 Garante a viewport recortada (.ar-wrap)
    let wrap = root.querySelector('.ar-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'ar-wrap';
        root.replaceChildren(wrap);
    }

    // 🧩 Garante camadas internas
    const ensureDiv = (cls) => {
        let el = wrap.querySelector('.' + cls);
        if (!el) {
            el = document.createElement('div');
            el.className = cls;
            wrap.appendChild(el);
        }
        return el;
    };
    ensureDiv('ar-ring');
    ensureDiv('ar-scan');

    // Mandala SVG (única no wrap, sempre atualizada)
    let mandala = wrap.querySelector('.ar-mandala');
    if (!mandala) {
        mandala = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        mandala.classList.add('ar-mandala');
        mandala.setAttribute('viewBox', '0 0 100 100');
        wrap.appendChild(mandala);
    }
    mandala.innerHTML = getMandalaShape(build, symbol);

    // Expor build para o CSS controlar cor
    root.dataset.build = String(build);

    // 🔁 Reinicia animações
    void wrap.offsetWidth;

    // 🎬 Mostra e auto-oculta
    root.classList.add('show');
    setTimeout(() => root.classList.remove('show'), 900);
}

/* Ripple no botão (mantido) */
export function rippleOnButton(btn, ev) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const x = (ev?.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (ev?.clientY ?? rect.top + rect.height / 2) - rect.top;
    r.style.left = `${x}px`;
    r.style.top  = `${y}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 520);
}

/* Pulso no badge de build (mantido) */
export function pulseBuildBadge() {
    const badge = document.getElementById('hud-build');
    if (!badge) return;
    badge.classList.remove('pulse');
    // força reflow
    // eslint-disable-next-line no-unused-expressions
    badge.offsetHeight;
    badge.classList.add('pulse');
}
