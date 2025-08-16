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

## 16) Ciclo 2 — Usabilidade, Acessibilidade e Qualidade (Testes)

### 16.1 Objetivo

Aprimorar acessibilidade (WCAG 2.1 AA básico), usabilidade mobile e iniciar a suíte de testes automatizados (unit + E2E), além de aplicar otimizações avançadas de performance (lazy-loading e code splitting) integradas ao CI.

### 16.2 Entregáveis

* UI navegável 100% por teclado, com foco visível, rótulos/ARIA adequados e contraste validado.
* Fluxo principal (Dia 1 completo) coberto por testes E2E.
* Núcleo (buildTracker, renderer helpers, npc) com testes unitários iniciais.
* Lazy-loading de JSONs por dia e splitting de módulos opcionais (efeitos/rewards).
* CI rodando lint + build + testes (unit e E2E headless) em PR.

### 16.3 Plano técnico

#### A) Acessibilidade (A11y)

1. **Navegação por teclado**

   * Ordem de tabulação previsível; `tabindex="0"` apenas quando necessário.
   * Botões com `type="button"` e `aria-label` descritivo.
   * Focus states visíveis (≥3:1 de contraste contra o fundo).
2. **Papéis e regiões**

   * Container do evento como `role="main"`.
   * Diálogo de NPC com `role="dialog"`, `aria-modal="true"`, `aria-labelledby` para o nome do NPC.
   * HUD com `role="status"` (não intrusivo) ou `aria-live="polite"` para mudanças.
3. **Leitores de tela**

   * Elementos puramente decorativos marcados com `aria-hidden="true"`.
   * Textos alternativos ou `aria-label` em ícones.
4. **Contraste & motion**

   * Validar contraste mínimo (WCAG AA) e oferecer `prefers-reduced-motion` já suportado.

**Snippets A11y**

```html
<section id="evento" role="main" aria-live="polite"></section>
<div class="npc-fala" role="dialog" aria-modal="true" aria-labelledby="npc-titulo">
  <h2 id="npc-titulo" class="npc-nome">Graciliano</h2>
  <p class="npc-texto">"..."</p>
  <div role="group" aria-label="Respostas">
    <button type="button" class="btn-resposta" aria-label="Responder com empatia (1)">Empatia</button>
    <button type="button" class="btn-resposta" aria-label="Ignorar (2)">Ignorar</button>
    <button type="button" class="btn-resposta" aria-label="Resposta estranha (3)">Estranha</button>
  </div>
</div>
```

```css
:focus { outline: 3px solid rgba(255,255,255,.8); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce){ *{ animation:none!important; transition:none!important; } }
```

#### B) Usabilidade mobile

* Tocar-alvo ≥ 44×44px; espaçamento vertical generoso.
* Auto-scroll suave após render de novo bloco/NPC:

```js
requestAnimationFrame(() => document.getElementById('evento')?.scrollIntoView({behavior:'smooth'}));
```

* Feedback opcional: `navigator.vibrate?.(20)` em cliques (configurável nas preferências).

#### C) Testes automatizados

1. **Unit (Jest)**

   * Alvos: `buildTracker.aplicarImpacto`, `buildDominante`, serializer de `data-id` no `renderer`, comportamento de `npc.dispararNPC` (uma emissão, reset do guard).
   * Setup:

```bash
npm i -D jest @types/jest jsdom
```

```json
// package.json
{
  "scripts": { "test": "jest --runInBand" },
  "jest": { "testEnvironment": "jsdom" }
}
```

2. **E2E (Playwright)**

   * Cenário feliz do Dia 1: iniciar → interagir com 1 NPC → avançar até fim → validar relatório.
   * Regressão: impedir reabrir o mesmo NPC no mesmo evento.

```bash
npm i -D @playwright/test
npx playwright install --with-deps
```

```js
// tests/e2e/dia1.spec.ts
import { test, expect } from '@playwright/test';

test('fluxo Dia 1', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: /Empatia|Ignorar|Estranha/ }).first().click();
  await page.getByRole('button', { name: /Avançar|Próximo|Continuar/ }).first().click();
  await expect(page.locator('text=Relatório do dia')).toBeVisible();
});
```

3. **CI**

   * Atualizar workflow para rodar `npm test` e Playwright (headless) nas PRs.

#### D) Performance avançada

1. **Lazy-loading de JSONs**

```js
async function carregarDia(n){
  return (await fetch(`/data/dia${n}.json`, { cache: 'no-store' })).json();
}
```

2. **Code splitting (Vite)**

   * Import dinâmico dos módulos de efeitos pesados:

```js
if(!document.documentElement.classList.contains('low-spec')){
  const { playChoiceReward } = await import('./ui/rewardChoice.js');
  playChoiceReward(build);
}
```

3. **Pré-busca leve**

   * Quando dia `n` carrega, `prefetch` do `dia n+1` (somente em rede rápida):

```js
if(navigator.connection?.effectiveType?.includes('4g')){
  fetch(`/data/dia${n+1}.json`).catch(()=>{});
}
```

### 16.4 Integração ao CI

Atualizar `.github/workflows/ci.yml` para:

```yaml
- run: npm ci
- run: npm run lint
- run: npm run build --if-present
- run: npm test
- name: Playwright
  run: npx playwright test
```

### 16.5 Critérios de Aceite / DoD

* **A11y:** Navegação por teclado em todo fluxo; `role="dialog"` e `aria-*` corretos no NPC; contraste AA validado.
* **Usabilidade:** Tocar-alvo ≥ 44px; auto-scroll funcionando; feedback opcional configurável.
* **Testes:** ≥ 10 testes unitários essenciais; 1 cenário E2E verde cobrindo Dia 1; CI bloqueia PR com falhas.
* **Performance:** JSON lazy-loaded; efeitos pesados em split dinâmico; TTI e FPS iguais ou melhores que no Ciclo 1.

### 16.6 Riscos & Mitigações

* **Flakiness de E2E:** usar `getByRole`/ARIA, `await expect(...).toBeVisible()`; rodar com retries no CI.
* **Compat iOS/Safari:** fallback para `backdrop-filter`; testar em WebKit no Playwright.
* **A11y vs estética:** separar tokens de foco/contraste para manter identidade visual.

### 16.7 Estimativa

* A11y + UX mobile: 4–6 dias.
* Testes unitários: 2–3 dias.
* E2E (setup + 1 fluxo): 2 dias.
* Lazy-loading & splitting: 2–3 dias.
* Integração CI completa: 1 dia.

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


Abaixo estão os **scaffolds** solicitados, prontos para colar no repositório. Cada bloco indica o **caminho do arquivo** e o conteúdo.

> Integração mínima: não quebra o que já existe. O `StoryEngine` e o `validator` podem ser conectados gradualmente ao fluxo atual (`main.js`/`renderer.js`).

---

## `/data/index.json`

Lista de coleções narrativas e mapeamento de dias. Permite múltiplas campanhas/roteiros e tradução do título.

```json
{
  "version": 1,
  "defaultStory": "what-is-life",
  "stories": [
    {
      "id": "what-is-life",
      "title": {
        "pt-BR": "What Is Life",
        "en": "What Is Life"
      },
      "days": [
        { "id": "dia1", "path": "/data/dia1.json" },
        { "id": "dia2", "path": "/data/dia2.json" },
        { "id": "dia3", "path": "/data/dia3.json" },
        { "id": "dia4", "path": "/data/dia4.json" }
      ]
    }
  ],
  "locales": ["pt-BR", "en"],
  "defaultLocale": "pt-BR"
}
```

---

## `/src/i18n/pt-BR.json`

Textos de interface (não conteúdo narrativo). Chaves simples e previsíveis.

```json
{
  "ui": {
    "start": "Iniciar",
    "continue": "Continuar",
    "nextDay": "Avançar para o próximo dia",
    "endOfDay": "Fim do dia",
    "choices": "Opções",
    "noChoices": "Nada a escolher. Apenas sinta.",
    "npcDialog": "Diálogo com {name}",
    "report": {
      "heading": "Relatório do dia",
      "dominantPath": "Caminho dominante",
      "choicesCount": "Escolhas",
      "keyPhrase": "Frase-chave final",
      "reflection": "Reflexão",
      "omen": "Presságio",
      "npcLog": "Diálogos com NPCs"
    }
  },
  "build": {
    "virtuoso": "virtuoso",
    "profano": "profano",
    "anomalia": "anomalia"
  }
}
```

---

## `/src/i18n/en.json`

```json
{
  "ui": {
    "start": "Start",
    "continue": "Continue",
    "nextDay": "Advance to next day",
    "endOfDay": "End of day",
    "choices": "Choices",
    "noChoices": "Nothing to choose. Just feel.",
    "npcDialog": "Dialogue with {name}",
    "report": {
      "heading": "Day report",
      "dominantPath": "Dominant path",
      "choicesCount": "Choices",
      "keyPhrase": "Final key phrase",
      "reflection": "Reflection",
      "omen": "Omen",
      "npcLog": "NPC dialogues"
    }
  },
  "build": {
    "virtuoso": "virtuous",
    "profano": "profane",
    "anomalia": "anomaly"
  }
}
```

---

## `/src/i18n/index.js`

Loader simples com fallback. Mantém API estável: `t('ui.start')`.

```js
// 📁 src/i18n/index.js
let CURRENT_LOCALE = 'pt-BR';
let DICTS = {};

export async function setLocale(locale) {
  try {
    const mod = await import(`./${locale}.json`, { assert: { type: 'json' } });
    DICTS[locale] = mod.default || mod;
    CURRENT_LOCALE = locale;
  } catch (e) {
    console.warn(`[i18n] Falha ao carregar locale '${locale}', mantendo '${CURRENT_LOCALE}'.`, e);
  }
}

export function getLocale() {
  return CURRENT_LOCALE;
}

export function t(path, vars = {}) {
  const dict = DICTS[CURRENT_LOCALE] || {};
  const value = path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), dict);
  if (typeof value !== 'string') return path; // fallback: retorna a chave
  return value.replace(/\{(.*?)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

// Inicialização padrão (lazy). Em apps reais, chame setLocale no bootstrap conforme storage/navegador.
(async () => {
  if (!DICTS['pt-BR']) await setLocale('pt-BR');
})();
```

---

## `/src/core/validator.js`

Validador leve para `diaN.json` e `eventoNPC.json`. Sem dependências; retorna uma lista de erros (vazia = válido).

```js
// 📁 src/core/validator.js

/**
 * Valida a estrutura básica de um arquivo de dia (diaN.json).
 * Espera um objeto com { id, titulo, eventos: [ { id, titulo, descricao, opcoes?, tipo?, npc? } ] }
 */
export function validarDiaJson(dia) {
  const erros = [];
  if (!dia || typeof dia !== 'object') return ["JSON do dia inválido (não é objeto)"];
  if (!dia.id) erros.push('Campo obrigatório ausente: dia.id');
  if (!Array.isArray(dia.eventos)) erros.push('Campo obrigatório ausente: dia.eventos (array)');

  (dia.eventos || []).forEach((ev, idx) => {
    const ctx = `evento[${idx}]`;
    if (!ev || typeof ev !== 'object') return erros.push(`${ctx}: não é objeto`);
    if (!ev.id) erros.push(`${ctx}: campo obrigatório ausente: id`);
    if (typeof ev.descricao !== 'string') erros.push(`${ctx}: descricao deve ser string`);
    if (ev.opcoes && !Array.isArray(ev.opcoes)) erros.push(`${ctx}: opcoes deve ser array`);
    if (ev.opcoes) {
      ev.opcoes.forEach((op, j) => {
        const oc = `${ctx}.opcoes[${j}]`;
        if (typeof op.texto !== 'string') erros.push(`${oc}: texto deve ser string`);
        if (!('proximo' in op)) erros.push(`${oc}: proximo obrigatório (id do próximo evento ou 'fim')`);
      });
    }
  });
  return erros;
}

/**
 * Valida o arquivo de NPCs (eventoNPC.json): [{ id, nome, falas: { virtuoso?, profano?, anomalia? } }]
 */
export function validarNPCJson(lista) {
  const erros = [];
  if (!Array.isArray(lista)) return ["eventoNPC.json deve ser um array"];
  lista.forEach((npc, i) => {
    const ctx = `npc[${i}]`;
    if (!npc.id) erros.push(`${ctx}: id obrigatório`);
    if (!npc.nome) erros.push(`${ctx}: nome obrigatório`);
    if (!npc.falas || typeof npc.falas !== 'object') erros.push(`${ctx}: falas obrigatórias (objeto)`);
  });
  return erros;
}
```

---

## `/src/core/storyEngine.js`

Motor mínimo para carregar `index.json`, dias e navegar eventos por id. Não altera `renderer.js`; apenas expõe uma API que o `main.js` pode consumir.

```js
// 📁 src/core/storyEngine.js
import { validarDiaJson } from './validator.js';

export class StoryEngine {
  constructor({ indexPath = '/data/index.json' } = {}) {
    this.indexPath = indexPath;
    this.index = null;          // conteúdo de index.json
    this.story = null;          // story ativa (obj do index)
    this.days = new Map();      // idDia -> JSON do dia
    this.currentDayId = null;
    this.currentEventId = null;
  }

  async loadIndex() {
    const res = await fetch(this.indexPath);
    if (!res.ok) throw new Error(`Falha ao carregar ${this.indexPath}`);
    this.index = await res.json();
    return this.index;
  }

  /** Seleciona a story pelo id do index.json (ou default) */
  selectStory(storyId) {
    if (!this.index) throw new Error('Index não carregado');
    const id = storyId || this.index.defaultStory;
    const story = (this.index.stories || []).find(s => s.id === id);
    if (!story) throw new Error(`Story '${id}' não encontrada no index.json`);
    this.story = story;
    return this.story;
  }

  /** Carrega e valida todos os dias da story selecionada */
  async preloadDays() {
    if (!this.story) throw new Error('Story não selecionada');
    for (const d of this.story.days) {
      const res = await fetch(d.path);
      if (!res.ok) throw new Error(`Falha ao carregar dia '${d.id}' em ${d.path}`);
      const json = await res.json();
      const erros = validarDiaJson(json);
      if (erros.length) {
        console.warn(`[validator] Problemas no dia '${d.id}':`, erros);
      }
      this.days.set(d.id, json);
    }
  }

  /** Inicializa o ponteiro de execução */
  startFromDay(dayId) {
    const id = dayId || this.story?.days?.[0]?.id;
    if (!id) throw new Error('Nenhum dia disponível para iniciar');
    this.currentDayId = id;
    const dia = this.days.get(id);
    this.currentEventId = dia?.eventos?.[0]?.id || null;
    return { dayId: this.currentDayId, eventId: this.currentEventId };
  }

  /** Retorna o objeto do evento atual */
  getCurrentEvent() {
    const dia = this.days.get(this.currentDayId);
    return dia?.eventos?.find(e => e.id === this.currentEventId) || null;
  }

  /** Avança para um evento específico (id no mesmo dia) ou muda de dia */
  goTo(target) {
    if (!target) return this.getCurrentEvent();
    if (target === 'fim') return null; // sinaliza fim do dia

    const dia = this.days.get(this.currentDayId);
    const next = dia?.eventos?.find(e => e.id === target);
    if (next) {
      this.currentEventId = next.id;
      return next;
    }
    // Se não achou no dia atual, tenta como mudança de dia (target = idDia)
    if (this.days.has(target)) {
      this.currentDayId = target;
      const d = this.days.get(target);
      this.currentEventId = d?.eventos?.[0]?.id || null;
      return this.getCurrentEvent();
    }
    console.warn(`[StoryEngine] Destino '${target}' não encontrado.`);
    return this.getCurrentEvent();
  }
}
```

---

## `/src/main.hook.example.js` (opcional)

Exemplo de como **conectar** o `StoryEngine` com o fluxo atual, sem quebrar nada. Sirva apenas como referência.

```js
// 📁 src/main.hook.example.js
import { StoryEngine } from './core/storyEngine.js';
import { renderizarEvento } from './core/renderer.js';

const engine = new StoryEngine();

(async function bootstrap() {
  await engine.loadIndex();
  engine.selectStory();
  await engine.preloadDays();
  engine.startFromDay();

  // Render inicial
  renderizarEvento(engine.getCurrentEvent());

  // Quando o jogador escolhe uma opção, avançar no engine
  document.addEventListener('opcaoSelecionada', (ev) => {
    const { proximo } = ev.detail || {};
    const next = engine.goTo(proximo);
    if (next) renderizarEvento(next);
    else {
      // chegou ao fim do dia — seu fluxo atual já lida com a tela de FIM
      renderizarEvento({ tipo: 'fim', titulo: 'Fim do dia', descricao: '' });
    }
  });
})();
```

---

## Instruções rápidas de adoção

1. **Adicionar arquivos** acima nos caminhos indicados.
2. (Opcional) Renomear `src/main.hook.example.js` → conectar no `index.html`/`main.js` após validar localmente.
3. **Rodar dev** e checar o console para avisos do `validator`.
4. (Depois) Integrar i18n progressivamente trocando strings internas por `t('chave')`.

---

Se quiser, no próximo passo eu abro PRs virtuais:

* (A) Plug do `StoryEngine` com feature flag (`USE_ENGINE=1`),
* (B) Validação automática no start,
* (C) `i18n` aplicado em HUD e fim de dia.
