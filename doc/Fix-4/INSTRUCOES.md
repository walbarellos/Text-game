# 7 Lives ☉ — Bugfix de Emergência

## Diagnóstico do que está quebrando

| Bug | Causa | Fix |
|---|---|---|
| `canvas is not defined` | `fog.js` novo usa `import { isLowEnd }` que muda ordem de módulos | Substituir por `fog.js` standalone |
| Choices não aparecem | Crash do canvas impede o renderer de terminar | CSS força visibilidade + fog.js corrigido |
| "Pintas" espalhadas | Partículas do HUD existente sem `overflow:hidden` no container | `emergency-fix.css` contém |
| Layout na esquerda | `#intro-cinematica` sem `position:fixed` explícito | `emergency-fix.css` corrige |
| Background vazio | `background-canvas` sem conteúdo visual | `fundo-geom.js` melhorado |

---

## Passos em ordem (FAZER TUDO, NESSA ORDEM)

### Passo 1 — Substituir fog.js

Copiar `src/ui/fog.js` deste pacote para o projeto, substituindo o arquivo existente.

**IMPORTANTE**: este novo fog.js NÃO usa imports. Não adicione imports nele.

---

### Passo 2 — Substituir fundo-geom.js

Copiar `src/ui/fundo-geom.js` deste pacote para o projeto, substituindo o arquivo existente.

---

### Passo 3 — Substituir hud-karma.js

Copiar `src/ui/hud-karma.js` deste pacote para o projeto.

Este novo hud-karma.js não insere barras no HUD — usa tooltip ao hover no badge existente.

---

### Passo 4 — Adicionar emergency-fix.css

No `index.html`, antes de `</head>`, adicionar **como ÚLTIMO CSS**:

```html
<link rel="stylesheet" href="./src/styles/emergency-fix.css" />
```

Deve ser a última linha de CSS carregada para ter prioridade.

---

### Passo 5 — Remover imports problemáticos do main.js

Se no `src/main.js` existir alguma dessas linhas, remover ou comentar:

```js
// REMOVER estas se existirem:
import './performance-guard.js';
import './ui/fps-monitor.js';
import { inicializarPatch ... } from './core/renderer-patch.js';
```

Esses arquivos do patch anterior usam `import.meta.env` que pode quebrar dependendo da configuração do Vite.

---

### Passo 6 — Testar e diagnosticar

Se ainda tiver problemas:

1. Abrir DevTools (F12)
2. Ir na aba Console
3. Copiar todo o conteúdo de `debug/diagnostico.js`
4. Colar no console e pressionar Enter
5. Enviar o output aqui

---

### Passo 7 — Se choices ainda não aparecerem

Provavelmente é um seletor CSS incorreto. Inspecionar o HTML do `#evento` no DevTools:

1. F12 → Elements
2. Encontrar `<main id="evento">`
3. Ver quais classes os botões de escolha têm
4. Me enviar as classes — vou atualizar o `emergency-fix.css` com os seletores corretos

---

## O que cada arquivo faz

| Arquivo | Função |
|---|---|
| `src/ui/fog.js` | Névoa de partículas — standalone, sem imports |
| `src/ui/fundo-geom.js` | Background atmosférico no canvas principal |
| `src/ui/hud-karma.js` | Karma 4 eixos como tooltip no badge |
| `src/styles/emergency-fix.css` | Fix de layout + choices + partículas soltas |
| `debug/diagnostico.js` | Script de diagnóstico para colar no console |
