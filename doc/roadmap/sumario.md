What Is Life — Documentação Técnica e Plano

Data: 09/08/2025

1) Visão geral

Jogo narrativo ritualístico em HTML/JS com renderização por eventos, sistema de “build moral” (virtuoso | profano | anomalia) e encontros com NPCs. A UI é responsiva e usa efeitos visuais (auras, blur, gradientes), com persistência simples via storage. Após uma sequência de bugs (MIME, HMR, overlay, duplo clique, repetição de NPC e blob gigante no Git), estabilizamos o fluxo: cada NPC fala 1 vez, o jogador escolhe 1 resposta, grava impacto, segue para o próximo bloco.

2) Estado atual (percentual por área)

Estimativas para orientar prioridades. “Concluído” = funcional + testado em desktop + smoke test em mobile.

Área

%

Observações

Núcleo de eventos (renderer, fluxo)

85%

Renderização segura (replaceChildren), gates por evento/dia, fim de dia com relatório. Falta refino de erros e loading states.

Sistema de NPC (UI, dispatch, gates)

90%

Diálogo enxuto “1 fala + 1 escolha”, once:true, guard npcDialogOpen, registros salvos. Falta teclado opcional e fallback sem CSS.

Build tracker (acúmulo/impacto)

90%

registrarEscolha, aplicarImpacto, relatório fim de dia. Falta persistência por dia/slot e histórico multi‐dia.

HUD/tema/estilos

70%

Visual consistente, mas efeitos pesados em celulares. Falta camada “low-spec mode” automática.

Conteúdo (dias, NPCs, tooltips)

60%

Dia 1–4 presentes; NPCs padronizados. Falta expansão de conteúdo e validação narrativa.

Performance mobile

55%

Consertos em overlay/portal; ainda há custos de blur, sombras e gradientes amplos.

Acessibilidade (A11y)

40%

Sem navegação por teclado em todo fluxo; rótulos ARIA em partes.

Build/CI/CD

30%

Vite em dev funciona; falta pipeline de produção, preview e smoke tests automatizados.

Testes (unit/integration/E2E/perf)

20%

Pontuais manualmente. Falta suíte automatizada.

Documentação

65%

Este documento + comentários in-code. Falta Guia de Contribuição e ADRs.

Conclusão geral aproximada: ~60%.

3) Linha do tempo (resumo das sessões)

Sessões iniciais: estrutura HTML/JS, primeiro renderer, buildTracker, estilos. Primeiros JSONs de dias e NPCs.

Erro MIME/parse: renderer.js com strings quebradas (template literal vs. HTML “cru”) → correção para renderSafeHTML e strings válidas.

Duplo clique / overlay: diálogo de NPC exigia 2 cliques por overlay com pointer-events incorreto + listeners duplicados (HMR). Corrigidos com guard npcDialogOpen, once:true, overlay transparente a cliques, e simplificação do dispararNPC (sem keydown global, sem portal complexo, sem preventDefault no overlay).

Repetição do NPC (mestre): aparecia em vários dias → gates __npcOncePerEvent/__npcOncePerDay no renderer e validação de convo.

Git / arquivo gigante: ZIP do Android no histórico → instruções de git filter-repo e .gitignore reforçado.

Estabilização atual: fluxo “NPC → resposta → continuar bloco” consolidado, relatório de fim de dia legível e sem undefined.

4) Arquitetura (alto nível)

/src/core

renderer.js: render dos blocos do dia; tela de fim; gates de NPC por evento/dia; efeitos visuais disparados.

npc.js: exibição enxuta de diálogo; 3 botões; once:true; dispatch respostaNPC com {idNPC, nomeNPC, tone, build, respostaTexto, fala, impacto}; guard npcDialogOpen.

buildTracker.js: contadores, impacto, histórico, interações de NPC (append‐only por dia). Utilidade resetarTudoParaProximoDia.

storage.js: progresso (dia atual, build dominante, evento atual etc.).

/data: diaN.json, eventoNPC.json (id, nome, falas indexadas por build).

/src/ui: efeitos (reward, ripple), HUD, estilos.

Contratos importantes

dispararNPC(idNPC, build, onClose?) → mostra 1 fala, emite 1 evento, chama onClose().

respostaNPC.detail deve conter impacto (opcional), e o app decide se aplica (no listener central).

Renderização de opções usa data-id com JSON serializado; once:true em todos os botões.

5) Bugs críticos resolvidos (Causas e Fixes)

Precisava de 2 cliques no NPC

Causas: .npc-overlay capturava clique (sem pointer-events:none) e ouvia click com preventDefault; handlers duplicados com HMR; teclado armado cedo demais; portal com pointer-events errado.

Fixes: overlay transparente a cliques; remoção de listener no overlay; once:true; npcDialogOpen guard; sem keydown global; botões com type="button" e e.stopImmediatePropagation() no clique (se necessário).

NPC repetindo (mestre em dias diferentes)

Causa: chamada dupla por fluxo/hmr e ausência de gate de exibição.

Fix: __npcOncePerEvent e __npcOncePerDay no renderer + validação no momento de disparo.

Falha MIME / sintaxe (Vite import-analysis)

Causa: uso de HTML sem backticks em JS.

Fix: template literals válidos, renderSafeHTML com wrapper.

Blob >100MB impedindo push

Causa: ZIP de Android comitado.

Fix: git filter-repo para remover do histórico; .gitignore atualizado; orientação para LFS apenas de mídia.

6) Incompatibilidades e riscos (mobile/desktop)

CSS filters pesados (backdrop-filter, filter: blur(), sombras extensas) → alto custo em Android low-end e WebView antigos.

Gradientes grandes (radial-gradient full-screen, conic-gradient) → re‐pinturas contínuas.

Animações contínuas (keyframes em múltiplos elementos) → CPU alto e queda de FPS.

position: fixed sobrepostos com pointer-events incorreto → cliques perdidos.

HMR (dev) dispara listeners extras → comportamento “duplicado”. Em prod não ocorre, mas precisamos idempotência.

Compat Safari iOS: backdrop-filter e mix-blend-mode variam; se usados, requerem fallback.

Persistência: inconsistências se o storage parcial não bater com schema (precisa versionamento de save).

7) Melhoria de performance (foco: celulares leves)

Objetivo: manter ~50–60 FPS no fluxo de leitura, >40 FPS em telas com efeitos, e <50ms TTI após navegação de evento.

7.1 CSS/UI

Reduzir/condicionar efeitos:

@media (prefers-reduced-motion: reduce) já aplicado em partes; estender para todos keyframes.

Criar “Low Spec Mode” automático: se navigator.hardwareConcurrency <= 4 ou FPS médio < 45, desativar blur/sombras e reduzir animações.

Substituir efeitos caros:

Trocar box-shadow múltiplas por transform/filter: drop-shadow() curto.

Diminuir backdrop-filter e blur() para 2–3px, evitar >6px em fullscreen.

Trocar radial-gradient fullscreen por um PNG/webp leve (512–1024px) com repeat, ou canvas desenhado 1x.

Contenção e camadas de composição:

contain: content em cartões/caixas isoladas; will-change: transform, opacity somente nos elementos animados.

Evitar animar propriedades que forçam layout/paint (tamanho, borda); preferir opacity e transform.

7.2 JS/Render

Batching de DOM: construir HTML em string e aplicar 1x (renderSafeHTML) — já feito.

Evitar querySelectorAll amplos a cada clique; manter referências locais quando possível.

Listeners com { once:true, passive:true } onde aplicável (scroll/touch). Clique não é passive.

Usar requestAnimationFrame para efeitos visuais e pós-render (ex.: armar listeners ou medições após paint).

Debounce de eventos de janela (resize/scroll) a 150–250ms.

7.3 Assets/Build

Critical CSS embutido no index.html (acima da dobra); resto por link rel="preload"/media.

Code-splitting por dia/conteúdo se crescer; lazy-load de JSONs conforme navega.

Produção: vite build --mode production com minificação e target conservador (es2019+). Prever brotliSize.

7.4 Observabilidade de performance

Marcar pontos chave: performance.mark('npc:open'), mark('npc:choice'), measure('npc:latency', 'npc:open','npc:choice') → logar no devtools.

FPS rudimentar (rAF) para detectar low-spec e ativar “modo leve”.

8) UI/UX — recomendações

Foco narrativo: telas limpas, 1–3 opções por bloco. Evitar “muitas opções” nos NPCs (já reduzido para 3).

Diferenciação clara de estados: NPC (fundo discreto), evento comum, fim de dia. Sempre com um hint curto.

Acessibilidade:

Botões com type="button", aria-label descritivo, ordem lógica de foco.

Shortcut opcional (1–3) só em desktop, respeitando prefers-reduced-motion.

Feedback imediato: micro‐animação leve no clique; “Próximo” destacado após resposta.

Mensagens sem undefined: todos os campos renderizados com fallback limpo.

9) Roadmap de ciclos (2–3 semanas cada)

Ciclo A — Estabilização & Modo Leve (prioridade)

Feature flag “Low Spec Mode” (detecção automática + toggle no menu).

Remover/alternar efeitos pesados (blur/gradientes) quando ativo.

Gate definitivo: __npcOncePerEvent/__npcOncePerDay padronizado e testado.

Saída: queda de 30–50% no custo de paint nas telas de NPC e fim de dia.

Ciclo B — A11y + UX mobile

Navegação por teclado; foco visível; tamanhos touch 44×44px.

Revisão de tipografia e contraste; tempo de leitura confortável.

Ciclo C — Testes automatizados

Unit (buildTracker, renderer helpers).

Integração (eventos → atualização de HUD/storage).

E2E (Playwright): fluxo Dia1 completo, NPC escolha única.

Perf (Lighthouse CI + script rAF FPS em 3 telas alvo).

Ciclo D — Conteúdo & Pipeline

Validador de JSON (schema) para diaN.json/eventoNPC.json.

Ferramenta de preview de conteúdo (dev page) e cheats para navegar dias.

Ciclo E — Build/CI

GitHub Actions: build, lint, testes, preview no GH Pages/Netlify (branch main).

Regras de PR (lint, testes obrigatórios).

10) Plano de testes detalhado

10.1 Unit

buildTracker.aplicarImpacto: soma, clamp ≥0, percentuais.

renderer.renderizarEvento: sem opções → placeholder; com opções → dataset correto; fim de dia → resumo sem undefined.

npc.dispararNPC: emite 1 respostaNPC por clique, npcDialogOpen reseta após onClose.

10.2 Integração

Ao receber respostaNPC, registrar interação + aplicar impacto (se configurado) + avançar bloco.

Avançar dia → resetarTudoParaProximoDia limpa contadores e interações; gates reiniciam.

10.3 E2E (Playwright)

Cenário 1: Dia 1 do início ao fim, interagindo com 1 NPC; verificar relatório final.

Cenário 2: Tentar reabrir o mesmo NPC no mesmo evento (não deve abrir).

Cenário 3: Religar a página (storage existe) → continuar do ponto salvo.

10.4 Performance

Lighthouse (Mobile): LCP < 2.5s, TBT < 150ms em dispositivo mediano.

Script rAF: medir FPS médio em 3 telas (NPC, bloco comum, fim de dia) por 10s.

Perfil de memória: observar crescimento após 30 transições; sem leaks (listeners removidos, once:true).

10.5 Compat

Dispositivos alvo (mínimo):

Android Go (Quad‑core, 1–2GB RAM, WebView 90+)

Android médio (Octa, 3–4GB, Chrome 110+)

iOS 14–17 (Safari/WebKit)

Desktop: Firefox/Chrome/Edge 120+

Check de CSS: se backdrop-filter ausente → fallback com rgba() opaco.

11) Métricas & Telemetria (local/dev)

performance.mark/measure nos principais fluxos.

Log estruturado (console): {ts, ev, payload} com níveis (info, warn, error).

Flag ?perf=1 na URL habilita HUD de FPS simples (canto superior com média e queda).

12) Guia rápido de contribuição

Branches: feat/*, fix/*, chore/* → PR contra main.

Lint/format: ESLint + Prettier (scripts npm run lint, npm run format).

Commits: Conventional Commits (feat:, fix:, chore:, refactor:...).

PR checklist: build ok, testes passam, sem logs ruidosos, sem regressões de FPS (±5 FPS tol.).

13) Próximos passos imediatos (checklist)



14) Apêndice — Snippets úteis

Low Spec Mode (auto):

function isLowSpec(){
  const cores = navigator.hardwareConcurrency || 2;
  let low = cores <= 4;
  // opcional: usar FPS sampler por 3s
  return low;
}
if(isLowSpec()) document.documentElement.classList.add('low-spec');

CSS para low-spec:

.low-spec .npc-overlay{ backdrop-filter:none; background:rgba(0,0,0,.5); }
.low-spec .aura-ring{ display:none; }
.low-spec .npc-dialogo{ box-shadow:none; }
.low-spec *{ animation-duration:.6x; }
@media (prefers-reduced-motion: reduce){ *{ animation:none!important; transition:none!important; } }

Marks de desempenho:

performance.mark('npc:open');
// ...ao clicar em uma opção
performance.mark('npc:choice');
performance.measure('npc:latency','npc:open','npc:choice');
console.log(performance.getEntriesByName('npc:latency').pop());

Onde estamos

Fluxo funcional e estável em desktop.

Mobile com desempenho aceitável, mas ainda sensível a blur/sombras.

Documentação e plano claros para os próximos ciclos.

Meta: 80% de conclusão em 2 ciclos (estabilidade + perf + testes base), mantendo a visão estética do projeto em dispositivos leves.

