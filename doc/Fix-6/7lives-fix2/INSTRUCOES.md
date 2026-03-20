# Fix — 3 passos, nada mais

## Problema
Os canvas (#etereal-fog e #background-canvas) estão desenhando círculos
em coordenadas internas de 40% da tela mas aparecendo no DOM inteiro
porque o CSS escala o elemento para 100%. Os pontinhos espalhados são
esses círculos mal posicionados.

O crash `canvas is not defined` no main.js impede o renderer de completar.

## Solução
Matar os dois canvas via JS stub. Background atmosférico fica 100% em CSS.

---

## Passo 1 — substituir src/ui/fog.js
Copia o arquivo `src/ui/fog.js` deste pacote.
O novo arquivo apenas esconde o canvas. Nenhuma operação.

## Passo 2 — substituir src/ui/fundo-geom.js
Copia o arquivo `src/ui/fundo-geom.js` deste pacote.
Mesmo — apenas esconde o canvas.

## Passo 3 — adicionar o CSS atmosférico
No index.html, no <head>, DEPOIS de todos os outros CSS:

```html
<link rel="stylesheet" href="./src/styles/atmosfera.css" />
```

Isso:
- Garante que os dois canvas ficam `display:none`
- Cria fundo atmosférico com vignette dourada, névoa central, faíscas
- Substitui as animações do #fx-bordas e #fx-sparks por versões CSS puras
- Garante z-index correto para HUD e evento ficarem visíveis

---

## Resultado esperado
- Zero pontinhos espalhados
- Background com atmosfera (vignette dourada, névoa, faíscas sutis)
- Evento renderiza normalmente (sem crash de canvas bloqueando o renderer)
- FPS estável (CSS animations são compositor-only)
