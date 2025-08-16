# What Is Life — Documentação Técnica e Plano

*Data: 09/08/2025*

---

## 1) Visão geral

Jogo narrativo ritualístico em HTML/JS com renderização por eventos, sistema de “build moral” (virtuoso | profano | anomalia) e encontros com NPCs. A UI é responsiva e usa efeitos visuais (auras, blur, gradientes), com persistência simples via storage. Após uma sequência de bugs (MIME, HMR, overlay, duplo clique, repetição de NPC e blob gigante no Git), estabilizamos o fluxo: **cada NPC fala 1 vez**, o jogador escolhe 1 resposta, grava impacto, segue para o próximo bloco.

---

## 2) Estado atual (percentual por área)

> Estimativas para orientar prioridades. “Concluído” = funcional + testado em desktop + smoke test em mobile.

| Área                                 | %   | Observações                                                                                                                           |
| ------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Núcleo de eventos (renderer, fluxo)  | 85% | Renderização segura (`replaceChildren`), gates por evento/dia, fim de dia com relatório. Falta refino de erros e loading states.      |
| Sistema de NPC (UI, dispatch, gates) | 90% | Diálogo enxuto “1 fala + 1 escolha”, `once:true`, guard `npcDialogOpen`, registros salvos. Falta teclado opcional e fallback sem CSS. |
| Build tracker (acúmulo/impacto)      | 90% | `registrarEscolha`, `aplicarImpacto`, relatório fim de dia. Falta persistência por dia/slot e histórico multi‐dia.                    |
| HUD/tema/estilos                     | 70% | Visual consistente, mas efeitos pesados em celulares. Falta camada “low-spec mode” automática.                                        |
| Conteúdo (dias, NPCs, tooltips)      | 60% | Dia 1–4 presentes; NPCs padronizados. Falta expansão de conteúdo e validação narrativa.                                               |
| Performance mobile                   | 55% | Consertos em overlay/portal; ainda há custos de blur, sombras e gradientes amplos.                                                    |
| Acessibilidade (A11y)                | 40% | Sem navegação por teclado em todo fluxo; rótulos ARIA em partes.                                                                      |
| Build/CI/CD                          | 30% | Vite em dev funciona; falta pipeline de produção, preview e smoke tests automatizados.                                                |
| Testes (unit/integration/E2E/perf)   | 20% | Pontuais manualmente. Falta suíte automatizada.                                                                                       |
| Documentação                         | 65% | Este documento + comentários in-code. Falta Guia de Contribuição e ADRs.                                                              |

**Conclusão geral aproximada:** **\~60%**.

---

## 3) Linha do tempo (resumo das sessões)

* **Sessões iniciais:** estrutura HTML/JS, primeiro `renderer`, `buildTracker`, estilos. Primeiros JSONs de dias e NPCs.
* **Erro MIME/parse:** `renderer.js` com strings quebradas (template literal vs. HTML “cru”) → correção para `renderSafeHTML` e strings válidas.
* **Duplo clique / overlay:** diálogo de NPC exigia 2 cliques por `overlay` com `pointer-events` incorreto + listeners duplicados (HMR). Corrigidos com \*\*guard \*\*`, `, overlay transparente a cliques, e simplificação do `dispararNPC` (sem keydown global, sem portal complexo, sem preventDefault no overlay).
* **Repetição do NPC (mestre):** aparecia em vários dias → gates `__npcOncePerEvent`/`__npcOncePerDay` no `renderer` e validação de convo.
* **Git / arquivo gigante:** ZIP do Android no histórico → instruções de `git filter-repo` e `.gitignore` reforçado.
* **Estabilização atual:** fluxo “NPC → resposta → continuar bloco” consolidado, relatório de fim de dia legível e sem `undefined`.

---

## 4) Arquitetura (alto nível)

* **/src/core**

  * `renderer.js`: render dos blocos do dia; tela de fim; gates de NPC por evento/dia; efeitos visuais disparados.
  * `npc.js`: exibição enxuta de diálogo; 3 botões; `once:true`; dispatch `respostaNPC` com `{idNPC, nomeNPC, tone, build, respostaTexto, fala, impacto}`; guard `npcDialogOpen`.
  * `buildTracker.js`: contadores, impacto, histórico, interações de NPC (append‐only por dia). Utilidade `resetarTudoParaProximoDia`.
  * `storage.js`: progresso (dia atual, build dominante, evento atual etc.).
* **/data**: `diaN.json`, `eventoNPC.json` (id, nome, falas indexadas por build).
* **/src/ui**: efeitos (reward, ripple), HUD, estilos.

**Contratos importantes**

* `dispararNPC(idNPC, build, onClose?)` → **mostra 1 fala**, emite 1 evento, chama `onClose()`.
* `respostaNPC.detail` deve conter `impacto` (opcional), e o app decide se aplica (no listener central).
* Renderização de opções usa `data-id` com JSON serializado; `once:true` em todos os botões.

---

## 5) Bugs críticos resolvidos (Causas e Fixes)

1. **Precisava de 2 cliques no NPC**

   * **Causas:** `.npc-overlay` capturava clique (sem `pointer-events:none`) e ouvia `click` com `preventDefault`; handlers duplicados com HMR; teclado armado cedo demais; portal com `pointer-events` errado.
   * **Fixes:** overlay transparente a cliques; remoção de listener no overlay; `once:true`; `npcDialogOpen` guard; sem keydown global; botões com `type="button"` e `e.stopImmediatePropagation()` no clique (se necessário).

2. **NPC repetindo (mestre em dias diferentes)**

   * **Causa:** chamada dupla por fluxo/hmr e ausência de gate de exibição.
   * **Fix:** `__npcOncePerEvent` e `__npcOncePerDay` no `renderer` + validação no momento de disparo.

3. **Falha MIME / sintaxe (Vite import-analysis)**

   * **Causa:** uso de HTML sem backticks em JS.
   * **Fix:** template literals válidos, `renderSafeHTML` com wrapper.

4. **Blob >100MB impedindo push**

   * **Causa:** ZIP de Android comitado.
   * **Fix:** `git filter-repo` para remover do histórico; `.gitignore` atualizado; orientação para LFS apenas de mídia.

---

## 6) Incompatibilidades e riscos (mobile/desktop)

* **CSS filters pesados** (`backdrop-filter`, `filter: blur()`, sombras extensas) → alto custo em Android low-end e WebView antigos.
* **Gradientes grandes** (`radial-gradient` full-screen, `conic-gradient`) → re‐pinturas contínuas.
* **Animações contínuas** (keyframes em múltiplos elementos) → CPU alto e queda de FPS.
* \`\`\*\* sobrepostos\*\* com `pointer-events` incorreto → cliques perdidos.
* **HMR** (dev) dispara listeners extras → comportamento “duplicado”. Em prod não ocorre, mas precisamos idempotência.
* **Compat Safari iOS**: `backdrop-filter` e `mix-blend-mode` variam; se usados, requerem fallback.
* **Persistência**: inconsistências se o storage parcial não bater com schema (precisa versionamento de save).

---

## 7) Melhoria de performance (foco: celulares leves)

**Objetivo:** manter \~50–60 FPS no fluxo de leitura, >40 FPS em telas com efeitos, e <50ms TTI após navegação de evento.

### 7.1 CSS/UI

* Reduzir/condicionar efeitos:

  * `@media (prefers-reduced-motion: reduce)` já aplicado em partes; estender para **todos** keyframes.
  * Criar **“Low Spec Mode”** automático: se `navigator.hardwareConcurrency <= 4` **ou** FPS médio < 45, desativar blur/sombras e reduzir animações.
* Substituir efeitos caros:

  * Trocar `box-shadow` múltiplas por `transform`/`filter: drop-shadow()` **curto**.
  * Diminuir `backdrop-filter` e `blur()` para 2–3px, evitar >6px em fullscreen.
  * Trocar `radial-gradient` fullscreen por um PNG/webp leve (512–1024px) com **repeat**, ou **canvas** desenhado 1x.
* Contenção e camadas de composição:

  * `contain: content` em cartões/caixas isoladas; `will-change: transform, opacity` **somente** nos elementos animados.
  * Evitar animar propriedades que forçam layout/paint (tamanho, borda); preferir `opacity` e `transform`.

### 7.2 JS/Render

* Batching de DOM: construir HTML em string e aplicar 1x (`renderSafeHTML`) — **já feito**.
* Evitar `querySelectorAll` amplos a cada clique; manter referências locais quando possível.
* Listeners com `{ once:true, passive:true }` onde aplicável (scroll/touch). Clique não é passive.
* Usar `requestAnimationFrame` para efeitos visuais e pós-render (ex.: armar listeners ou medições após paint).
* Debounce de eventos de janela (resize/scroll) a 150–250ms.

### 7.3 Assets/Build

* **Critical CSS** embutido no `index.html` (acima da dobra); resto por `link rel="preload"`/`media`.
* Code-splitting por dia/conteúdo se crescer; lazy-load de JSONs conforme navega.
* Produção: `vite build --mode production` com minificação e target conservador (es2019+). Prever `brotliSize`.

### 7.4 Observabilidade de performance

* Marcar pontos chave: `performance.mark('npc:open')`, `mark('npc:choice')`, `measure('npc:latency', 'npc:open','npc:choice')` → logar no devtools.
* FPS rudimentar (rAF) para detectar low-spec e ativar “modo leve”.

---

## 8) UI/UX — recomendações

* **Foco narrativo:** telas limpas, 1–3 opções por bloco. Evitar “muitas opções” nos NPCs (já reduzido para 3).
* **Diferenciação clara de estados:** NPC (fundo discreto), evento comum, fim de dia. Sempre com um **hint** curto.
* **Acessibilidade:**

  * Botões com `type="button"`, `aria-label` descritivo, ordem lógica de foco.
  * Shortcut opcional (1–3) só em desktop, respeitando `prefers-reduced-motion`.
* **Feedback imediato:** micro‐animação leve no clique; “Próximo” destacado após resposta.
* **Mensagens sem **\`\`**:** todos os campos renderizados com fallback limpo.

---

## 9) Roadmap de ciclos (2–3 semanas cada)

**Ciclo A — Estabilização & Modo Leve (prioridade)**

* Feature flag “Low Spec Mode” (detecção automática + toggle no menu).
* Remover/alternar efeitos pesados (blur/gradientes) quando ativo.
* Gate definitivo: `__npcOncePerEvent`/`__npcOncePerDay` padronizado e testado.
* **Saída:** queda de 30–50% no custo de paint nas telas de NPC e fim de dia.

**Ciclo B — A11y + UX mobile**

* Navegação por teclado; foco visível; tamanhos touch 44×44px.
* Revisão de tipografia e contraste; tempo de leitura confortável.

**Ciclo C — Testes automatizados**

* Unit (buildTracker, renderer helpers).
* Integração (eventos → atualização de HUD/storage).
* E2E (Playwright): fluxo Dia1 completo, NPC escolha única.
* Perf (Lighthouse CI + script rAF FPS em 3 telas alvo).

**Ciclo D — Conteúdo & Pipeline**

* Validador de JSON (schema) para `diaN.json`/`eventoNPC.json`.
* Ferramenta de preview de conteúdo (dev page) e cheats para navegar dias.

**Ciclo E — Build/CI**

* GitHub Actions: build, lint, testes, preview no GH Pages/Netlify (branch `main`).
* Regras de PR (lint, testes obrigatórios).

---

## 10) Plano de testes detalhado

### 10.1 Unit

* `buildTracker.aplicarImpacto`: soma, clamp ≥0, percentuais.
* `renderer.renderizarEvento`: sem opções → placeholder; com opções → dataset correto; fim de dia → resumo sem `undefined`.
* `npc.dispararNPC`: emite 1 `respostaNPC` por clique, `npcDialogOpen` reseta após onClose.

### 10.2 Integração

* Ao receber `respostaNPC`, registrar interação + aplicar impacto (se configurado) + avançar bloco.
* Avançar dia → `resetarTudoParaProximoDia` limpa contadores e interações; gates reiniciam.

### 10.3 E2E (Playwright)

* **Cenário 1:** Dia 1 do início ao fim, interagindo com 1 NPC; verificar relatório final.
* **Cenário 2:** Tentar reabrir o mesmo NPC no mesmo evento (não deve abrir).
* **Cenário 3:** Religar a página (storage existe) → continuar do ponto salvo.

### 10.4 Performance

* Lighthouse (Mobile): LCP < 2.5s, TBT < 150ms em dispositivo mediano.
* Script rAF: medir FPS médio em 3 telas (NPC, bloco comum, fim de dia) por 10s.
* Perfil de memória: observar crescimento após 30 transições; sem leaks (listeners removidos, `once:true`).

### 10.5 Compat

* **Dispositivos alvo** (mínimo):

  * Android Go (Quad‑core, 1–2GB RAM, WebView 90+)
  * Android médio (Octa, 3–4GB, Chrome 110+)
  * iOS 14–17 (Safari/WebKit)
  * Desktop: Firefox/Chrome/Edge 120+
* **Check de CSS:** se `backdrop-filter` ausente → fallback com `rgba()` opaco.

---

## 11) Métricas & Telemetria (local/dev)

* `performance.mark/measure` nos principais fluxos.
* Log estruturado (console): `{ts, ev, payload}` com níveis (`info`, `warn`, `error`).
* Flag `?perf=1` na URL habilita HUD de FPS simples (canto superior com média e queda).

---

## 12) Guia rápido de contribuição

* **Branches:** `feat/*`, `fix/*`, `chore/*` → PR contra `main`.
* **Lint/format:** ESLint + Prettier (scripts `npm run lint`, `npm run format`).
* **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`...).
* **PR checklist:** build ok, testes passam, sem logs ruidosos, sem regressões de FPS (±5 FPS tol.).

---

## 13) Próximos passos imediatos (checklist)

**Meta do Ciclo 1 (2–3 semanas):** estabilizar, padronizar e acelerar o jogo em mobile.

**Checklist executável**

1. **Triage & correções prioritárias**

* [ ] Abrir/atualizar issues para: travas na progressão, HMR duplicando listeners, estouro de memória após muitas transições, regressões de clique.
* [ ] Criar *template* de bug com passos, esperado/obtido, logs e dispositivo.
* [ ] Mapear telas de maior custo (NPC, Fim de dia) e registrar `performance.mark`.

2. **Padronização de código (ESLint/Prettier/Commits)**

* [ ] Adicionar dependências:

  ```bash
  npm i -D eslint @eslint/js eslint-plugin-import eslint-plugin-jsdoc eslint-plugin-unused-imports prettier eslint-config-prettier eslint-plugin-prettier
  ```
* [ ] Criar `.eslintrc.json`:

  ```json
  {
    "root": true,
    "languageOptions": { "ecmaVersion": 2022, "sourceType": "module" },
    "plugins": ["import", "jsdoc", "unused-imports", "prettier"],
    "rules": {
      "prettier/prettier": "warn",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "import/order": ["warn", {"newlines-between": "always", "alphabetize": {"order": "asc"}}]
    }
  }
  ```
* [ ] Criar `.prettierrc`:

  ```json
  { "singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "es5" }
  ```
* [ ] Scripts no `package.json`:

  ```json
  {
    "scripts": {
      "lint": "eslint \"src/**/*.{js,jsx,ts,tsx}\"",
      "lint:fix": "eslint --fix \"src/**/*.{js,jsx,ts,tsx}\"",
      "format": "prettier -w \"{src,public}/**/*.{js,css,html,json}\""
    }
  }
  ```
* [ ] Convencionar commits (Conventional Commits) e *branching* (`feat/*`, `fix/*`, `chore/*`).

3. **CI inicial (GitHub Actions)**

* [ ] Criar `.github/workflows/ci.yml`:

  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npm run lint
        - run: npm run build --if-present
  ```
* [ ] Proteções de PR: exigir CI verde.

4. **Performance imediata (mobile)**

* [ ] **Low Spec Mode**: ativar classe `low-spec` se `hardwareConcurrency <= 4` ou FPS<45 por 3s.
* [ ] Reduzir `blur()` e `backdrop-filter` em `.low-spec`; remover sombras múltiplas; preferir `opacity/transform` animados.
* [ ] Substituir `radial-gradient` full-screen por textura leve (WEBP 1x) com `background-repeat`.
* [ ] Debounce de `resize/scroll` (150–250ms) e listeners `{ once:true }` onde couber.
* [ ] Medir `npc:latency` (open→choice) e `fim:render`.

5. **Refatorações seguras**

* [ ] Isolar **motor de fluxo** de UI (ex.: mover lógica de progressão para `core/engine.js`).
* [ ] Remover `querySelectorAll` amplos em cliques; manter refs locais após render.
* [ ] Garantir idempotência em registradores de eventos (sempre `once:true` ou `removeEventListener`).

6. **Validação de dados (JSON)**

* [ ] Adicionar **Ajv** para validar `diaN.json` e `eventoNPC.json` em dev:

  ```bash
  npm i -D ajv
  ```
* [ ] Schema mínimo `schemas/dia.schema.json` (exemplo simplificado):

  ```json
  {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["titulo", "descricao"],
    "properties": {
      "titulo": {"type": "string"},
      "descricao": {"type": "string"},
      "opcoes": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["texto"],
          "properties": {
            "texto": {"type": "string"},
            "proximo": {"type": ["string", "number", "null"]},
            "npc": {"type": ["string", "null"]},
            "buildImpact": {"type": ["string", "null"]}
          }
        }
      },
      "tipo": {"type": ["string", "null"]}
    }
  }
  ```
* [ ] Validar em dev e logar erros de schema antes de render.

7. **Definição de pronto (DoD) do Ciclo 1**

* [ ] Zero bugs críticos em aberto.
* [ ] Lint/format em 100% dos arquivos alterados.
* [ ] CI rodando lint + build; PRs só *mergeiam* com CI verde.
* [ ] Tempo médio `npc:latency` ≤ 120ms em mobile médio; queda de FPS ≤ 10% nas telas críticas.
* [ ] JSONs passam na validação de schema; sem `undefined` no UI.

---

## 15) Ciclo 1 — Plano detalhado de implementação

### 15.1 Itens com Owners e Duração (estimado)

* **Triage & correções** (Owner: Eng Core) — 3–5 dias.
* **ESLint/Prettier + Scripts** (Owner: Eng DevEx) — 1–2 dias.
* **CI básico** (Owner: Eng DevEx) — 1 dia.
* **Perf mobile (low-spec + CSS)** (Owner: Eng Front) — 3–4 dias.
* **Refatoração leve (engine vs UI)** (Owner: Eng Core) — 2–3 dias.
* **Validação JSON com Ajv** (Owner: Eng Tools) — 1–2 dias.

### 15.2 Critérios de Aceite por item

* **Correções**: cenários reproduzidos nos tickets passam sem regressão; logs limpos.
* **Lint/Prettier**: `npm run lint` sem erros; `npm run format` idempotente.
* **CI**: bloqueia PR com falhas; executa em <3 min.
* **Perf**: perfil antes/depois mostrando ↓ paint time e FPS ≥ 50 em Android médio.
* **Refator**: nenhuma mudança de UI; cobertura manual do fluxo Dia 1 ok.
* **Ajv**: quebra em dev ao detectar schema inválido; mensagem amigável com caminho do erro.

### 15.3 Snippets adicionais

**Debounce util:**

```js
export const debounce = (fn, wait = 180) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};
```

**FPS sampler (ativa low-spec):**

```js
export async function detectLowSpecByFps(seconds = 3){
  let frames = 0; let start;
  await new Promise(res => {
    function loop(ts){ if(!start) start = ts; frames++; if(ts - start < seconds*1000) requestAnimationFrame(loop); else res(); }
    requestAnimationFrame(loop);
  });
  const fps = frames / seconds; return fps < 45;
}
```

**Validação com Ajv (dev only):**

```js
import Ajv from 'ajv';
const ajv = new Ajv();
export function validateJson(data, schema){
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if(!ok){ console.warn('Schema inválido:', validate.errors); }
  return ok;
}
```

---

## 14) Apêndice — Snippets úteis

**Low Spec Mode (auto):**

```js
function isLowSpec(){
  const cores = navigator.hardwareConcurrency || 2;
  let low = cores <= 4;
  // opcional: usar FPS sampler por 3s
  return low;
}
if(isLowSpec()) document.documentElement.classList.add('low-spec');
```

**CSS para low-spec:**

```css
.low-spec .npc-overlay{ backdrop-filter:none; background:rgba(0,0,0,.5); }
.low-spec .aura-ring{ display:none; }
.low-spec .npc-dialogo{ box-shadow:none; }
.low-spec *{ animation-duration:.6x; }
@media (prefers-reduced-motion: reduce){ *{ animation:none!important; transition:none!important; } }
```

**Marks de desempenho:**

```js
performance.mark('npc:open');
// ...ao clicar em uma opção
performance.mark('npc:choice');
performance.measure('npc:latency','npc:open','npc:choice');
console.log(performance.getEntriesByName('npc:latency').pop());
```

---

### Onde estamos

* Fluxo funcional e estável em desktop.
* Mobile com desempenho **aceitável**, mas ainda sensível a blur/sombras.
* Documentação e plano claros para os próximos ciclos.

> Meta: **80%** de conclusão em 2 ciclos (estabilidade + perf + testes base), mantendo a visão estética do projeto em dispositivos leves.
