// src/ui/credits.js
import { resetarProgresso } from '../core/storage.js';

const MENSAGENS = {
  virtuoso: {
    titulo: 'União Plena',
    subtitulo: 'A serenidade venceu o ruído.',
    texto: [
      'Você conduziu a centelha com paciência.',
      'A forma encontrou propósito; o gesto, medida.',
      'A jornada não calou o caos: ela o afinou.'
    ],
    selo: 'Virtuoso ☉'
  },
  profano: {
    titulo: 'Eco que Sufoca',
    subtitulo: 'A vontade ergueu muralhas, e elas responderam.',
    texto: [
      'Você tomou atalhos; o atalho cobrou pedágio.',
      'O espelho devolveu o peso da pressa.',
      'Não foi derrota: foi leitura em voz alta.'
    ],
    selo: 'Profano ☉'
  },
  anomalo: {
    titulo: 'Ruído Autônomo',
    subtitulo: 'O padrão abriu fendas e as fendas falaram.',
    texto: [
      'O mapa não serviu; a topologia reescreveu o terreno.',
      'Cada quebra exibiu um sentido lateral.',
      'Nenhum caminho único: um feixe de possibilidades.'
    ],
    selo: 'Anômalo ☉'
  },
  misto: {
    titulo: 'Atrito Criador',
    subtitulo: 'Virtude, falha e ruído aprenderam a conversar.',
    texto: [
      'Não há pureza sem fricção.',
      'A lapidação foi real porque doeu.',
      'O próximo ciclo começa daqui.'
    ],
    selo: 'Misto ☉'
  }
};

function escolherPerfil(build) {
  const b = (build || '').toLowerCase();
  if (b === 'virtuoso' || b === 'profano' || b === 'anômalo' || b === 'anomalo') return b.replace('anômalo','anomalo');
  return 'misto';
}

export function mostrarCreditos({ build = 'misto', stats = {} } = {}) {
  const perfil = escolherPerfil(build);
  const dados = MENSAGENS[perfil] || MENSAGENS.misto;

  // Oculta HUD se existir
  try {
    document.getElementById('hud')?.setAttribute('hidden','');
  } catch {}

  const root = document.getElementById('evento') || document.body;
  root.innerHTML = '';

  const wrapper = document.createElement('section');
  wrapper.className = 'creditos-final';
  wrapper.setAttribute('role','region');
  wrapper.setAttribute('aria-label','Créditos do jogo');
  wrapper.setAttribute('data-build', perfil);

  wrapper.innerHTML = `
    <div class="creditos-inner">
      <header class="creditos-head">
        <h1 class="creditos-titulo">${dados.titulo}</h1>
        <p class="creditos-sub">${dados.subtitulo}</p>
      </header>

      <div class="creditos-corpo" aria-live="polite">
        ${dados.texto.map(t => `<p>${t}</p>`).join('')}
        ${stats?.tempoTotal ? `<p class="creditos-stats">Tempo de sessão: <strong>${stats.tempoTotal}</strong></p>` : ''}
      </div>

      <footer class="creditos-foot">
        <div class="creditos-selo" aria-label="Selo de conclusão">${dados.selo}</div>
        <div class="creditos-acoes">
          <button class="btn-prim" id="btn-reiniciar" aria-label="Reiniciar a jornada">Reiniciar</button>
          <button class="btn-sec" id="btn-continuar" aria-label="Continuar explorando">Continuar</button>
        </div>
      </footer>
    </div>
  `;

  root.appendChild(wrapper);

  // Ações
  const btnReiniciar = document.getElementById('btn-reiniciar');
  const btnContinuar = document.getElementById('btn-continuar');

  btnReiniciar?.addEventListener('click', () => {
    try { resetarProgresso(); } catch {}
    try { window.location.reload(); } catch {}
  });

  // "Continuar" mantém o save e volta ao Dia 8 (último disponível), se desejar.
  btnContinuar?.addEventListener('click', () => {
    try { window.location.href = window.location.href; } catch {}
  });

  // Acessibilidade: foco inicial
  const foco = wrapper.querySelector('.btn-prim') || wrapper;
  foco?.focus?.();
}
