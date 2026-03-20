/**
 * INTEGRAÇÃO COMPLETA — adicionar ao src/main.js existente
 *
 * Este arquivo mostra ONDE e COMO inserir cada módulo novo
 * no seu main.js existente sem quebrar o que já funciona.
 *
 * Procure os comentários "INSERIR AQUI" e adicione as linhas indicadas.
 */

// ═══════════════════════════════════════════════════════════════════
// BLOCO 1 — IMPORTS (adicionar no topo do main.js)
// ═══════════════════════════════════════════════════════════════════

import './performance-guard.js';           // PRIMEIRO de tudo
import './ui/fps-monitor.js';              // dev only (auto)
import { inicializarPatch, processarEscolha, avancarDia } from './core/renderer-patch.js';
import { iniciarIntro }       from './ui/intro.js';
import { criarEstadoNarrativo, deserializarEstadoNarrativo, serializarEstadoNarrativo } from './core/state-extensions.js';
import { carregar, temSave }  from './core/save.js';
import './ui/parallax.js';                 // auto-inicializa


// ═══════════════════════════════════════════════════════════════════
// BLOCO 2 — INICIALIZAÇÃO DO ESTADO (modificar onde o estado é criado)
// ═══════════════════════════════════════════════════════════════════

// ANTES (exemplo do que provavelmente existe):
//   const estado = { dia: 1, virtude: 50, build: 'virtuoso' };

// DEPOIS — estender com o sistema narrativo:
async function criarOuCarregarEstado() {
  // Tentar carregar save existente
  if (await temSave()) {
    const raw = await carregar();
    if (raw) {
      return deserializarEstadoNarrativo(raw);
    }
  }

  // Estado novo
  return {
    // Seus campos existentes:
    dia:     1,
    virtude: 50,
    build:   'virtuoso',

    // Campos narrativos novos:
    ...criarEstadoNarrativo(),
  };
}


// ═══════════════════════════════════════════════════════════════════
// BLOCO 3 — INICIALIZAÇÃO DO JOGO (modificar DOMContentLoaded)
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {

  // Carregar estado
  const estado = await criarOuCarregarEstado();

  // Mostrar/ocultar botão "Continuar"
  const btnContinuar = document.getElementById('btn-continuar');
  if (btnContinuar) {
    btnContinuar.hidden = !(await temSave());
  }

  // Inicializar todos os módulos novos
  await inicializarPatch(estado);

  // Intro de abertura (só no novo jogo, ou sempre — sua escolha)
  const btnIniciar   = document.getElementById('btn-iniciar');
  const telaInicial  = document.getElementById('tela-inicial');

  if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
      telaInicial?.classList.add('oculta');
      await iniciarIntro();
      iniciarLoop(estado);
    });
  }

  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      telaInicial?.classList.add('oculta');
      iniciarLoop(estado);
    });
  }
});


// ═══════════════════════════════════════════════════════════════════
// BLOCO 4 — LOOP DE JOGO (modificar onde você avança dias e aplica escolhas)
// ═══════════════════════════════════════════════════════════════════

async function iniciarLoop(estado) {
  // Carregar eventos do dia atual
  const eventos = await avancarDia(estado.dia);

  // Renderizar eventos (seu código existente de renderização)
  // Ex: renderizarEvento(eventos[0], estado);
  // ...

  // Disparar evento para o renderer saber o dia atual
  window.dispatchEvent(new CustomEvent('dia:iniciado', {
    detail: { dia: estado.dia, eventos },
  }));
}

// ── Quando o jogador fizer uma escolha: ──────────────────────────────
// Substituir/complementar o handler de escolha existente:

async function handleEscolha(escolha, eventoAtual) {
  // Processar com todos os módulos conectados
  const { novasQuests, buildAtualizado } = await processarEscolha(escolha, eventoAtual);

  // Seu código existente de transição...
  // Ex: mostrarFeedbackEscolha(escolha);
  //     setTimeout(() => proximoEvento(), 1500);
}

// ── Quando avançar de dia: ────────────────────────────────────────────
async function handleAvancarDia() {
  const novosDia = estado.dia + 1;
  const eventos  = await avancarDia(novosDia);

  // Seu código existente de transição de dia...
}


// ═══════════════════════════════════════════════════════════════════
// BLOCO 5 — CSS (adicionar no index.html, antes de </head>)
// ═══════════════════════════════════════════════════════════════════

/*
<link rel="stylesheet" href="./src/styles/perf.css" />
<link rel="stylesheet" href="./src/styles/intro-fix.css" />
*/
