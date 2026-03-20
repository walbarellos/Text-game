# 7 Lives ☉ — Guia de Integração do Patch

## O que foi entregue

```
src/
  performance-guard.js      ← detecta low-end, expõe `isLowEnd`, `perfLevel`
  ui/
    fog.js                  ← substituir o atual (OffscreenCanvas + throttle)
    fog-worker.js           ← novo (worker do fog)
    fps-monitor.js          ← contador FPS em dev
    typewriter.js           ← efeito de digitação melhorado
    parallax.js             ← parallax leve no mouse
  core/
    save.js                 ← IndexedDB com fallback localStorage
    state-extensions.js     ← flags, karma 4 eixos, quests, relações
    event-loader.js         ← lazy load de eventos por dia
  styles/
    perf.css                ← regras de performance (importar no HTML)

scripts/
  generate-fx-bordas.mjs   ← gera o WebP estático (rodar 1x)

public/data/
  eventos/dia-1.json        ← exemplo de estrutura de eventos
  quests/
    q_sombra_do_passado.json  ← quest arco com etapas encadeadas
    q_fogo_no_mercado.json    ← quest de crise com expiração
```

---

## Ordem de integração (impacto vs esforço)

### Fase 1 — Performance imediata (30 min)

**1. Adicionar perf.css ao index.html** (antes de `</head>`):
```html
<link rel="stylesheet" href="./src/styles/perf.css" />
```

**2. Importar performance-guard.js como PRIMEIRO import em src/main.js:**
```js
import './performance-guard.js';    // deve ser o primeiro
import './ui/fps-monitor.js';       // monitor dev
// ... seus imports existentes
```

**3. Substituir src/ui/fog.js** pelos dois arquivos novos (`fog.js` e `fog-worker.js`).

**4. Rodar o gerador de WebP** (precisa instalar `canvas` como dev dep):
```bash
npm install -D canvas
node scripts/generate-fx-bordas.mjs
```

Depois, substituir no CSS do #fx-bordas:
```css
/* Antes: 8 radial-gradient() */
/* Depois: */
#fx-bordas {
  background-image: url('/assets/fx-bordas.webp');
  background-size: cover;
  mix-blend-mode: screen;
  will-change: opacity;
}
```

---

### Fase 2 — Narrativa (2-4h)

**1. Estender o estado existente:**
```js
// No seu state.js, ao criar o estado inicial:
import { criarEstadoNarrativo, serializarEstadoNarrativo, deserializarEstadoNarrativo } from './core/state-extensions.js';

// Na criação do estado:
const estado = {
  ...seuEstadoAtual,
  ...criarEstadoNarrativo(),   // adiciona flags, karma, relacoes, quests, historico
};
```

**2. Substituir localStorage pelo save.js:**
```js
import { salvar, carregar, temSave } from './core/save.js';

// Ao salvar:
await salvar(serializarEstadoNarrativo(estado));

// Ao carregar:
const raw = await carregar();
if (raw) Object.assign(estado, deserializarEstadoNarrativo(raw));

// Checar se existe save (para mostrar botão "Continuar"):
const existeSave = await temSave();
document.getElementById('btn-continuar').hidden = !existeSave;
```

**3. Substituir fetch de eventos pelo event-loader.js:**
```js
import { carregarEventosDoDia, filtrarEventosDisponiveis } from './core/event-loader.js';
import { eventoDisponivel } from './core/state-extensions.js';

// Onde você carrega eventos:
const todosEventos  = await carregarEventosDoDia(estado.dia);
const eventosValidos = filtrarEventosDisponiveis(todosEventos, estado, eventoDisponivel);
// Sortear/selecionar de eventosValidos
```

**4. Ao aplicar escolha do jogador:**
```js
import { aplicarConsequencia, calcularBuild, registrarHistorico } from './core/state-extensions.js';

// Ao jogador escolher uma opção:
aplicarConsequencia(estado, escolha.consequencias);

// Atualizar o HUD com o build calculado:
const novaBuild = calcularBuild(estado.karma);
window.dispatchEvent(new CustomEvent('build:set', { detail: novaBuild }));

// Registrar no histórico:
registrarHistorico(estado, {
  dia:          estado.dia,
  eventoTitulo: eventoAtual.titulo,
  escolhaTitulo: escolha.texto,
  resumo:       escolha.resumo,
});
```

**5. Ao virar o dia, verificar expiração de quests:**
```js
import { verificarExpiracoes } from './core/state-extensions.js';
import { carregarQuests } from './core/event-loader.js';

const idsAtivos = [...estado.quests.ativas];
const defsAtivos = await carregarQuests(idsAtivos);
const expiradas = verificarExpiracoes(estado, defsAtivos);

// Mostrar consequências das quests expiradas ao jogador
for (const quest of expiradas) {
  if (quest.se_expirar?.texto_consequencia) {
    // renderizar mensagem de expiração
  }
}
```

---

### Fase 3 — Typewriter e efeitos visuais (1h)

**Substituir o efeito de typing CSS:**
```js
import { typewriter } from './ui/typewriter.js';

// Onde você renderiza o texto do evento:
await typewriter(elementoDeTexto, evento.texto, {
  velocidade:  26,
  skipOnClick: true,
});

// Para múltiplos parágrafos:
import { typewriterSequencial } from './ui/typewriter.js';
await typewriterSequencial(container, evento.paragrafos, { velocidade: 26 });
```

**Tema por tipo de evento:**
```js
// Ao renderizar um evento:
document.body.dataset.eventoTipo = evento.tipo;
// CSS em perf.css já cuida do resto
```

**Parallax:**
```js
// Em src/main.js, depois dos outros imports:
import './ui/parallax.js';
// Não precisa de mais nada — auto-inicializa
```

---

## Estrutura de arquivos de dados

Criar pasta `public/data/eventos/` com um JSON por dia:
```
public/data/eventos/dia-1.json   (array de eventos)
public/data/eventos/dia-2.json
...
public/data/quests/
  q_sombra_do_passado.json
  q_fogo_no_mercado.json
```

Ver os arquivos de exemplo incluídos no patch como referência de estrutura.

---

## Ganhos esperados

| Melhoria | FPS antes | FPS depois |
|---|---|---|
| Modo perf-low automático (devices fracos) | 0 | ~45-55 |
| WebP estático p/ fx-bordas | - | +8-12 FPS |
| Fog throttle 30fps + OffscreenCanvas | - | +4-8 FPS |
| backdrop-filter isolado | - | +3-6 FPS |
| Acumulado em device mid-range | ~5 FPS | ~55-60 FPS |
