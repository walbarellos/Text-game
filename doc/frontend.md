🎨 IMPLEMENTAÇÃO DO FRONTEND

🔧 Stack: HTML + CSS (modularizado) + JS (ESM, organizado por módulos)
💡 Meta: Interfaces responsivas, acessíveis, intuitivas e rituais
📐 Design: Estética simbólica, tipografia contemplativa, minimalismo interativo
📁 ESTRUTURA DE PASTAS DO FRONTEND

src/
├── index.html
├── styles/
│   ├── base.css
│   ├── tema.css
│   ├── hud.css
│   └── eventos.css
├── core/
│   ├── dias.json
│   ├── dia1.json ... dia7.json
│   ├── eventoNPC.json
│   └── personagens.json
├── data/
│   └── frasesPedra.json
├── js/
│   ├── main.js
│   ├── renderer.js
│   ├── npcManager.js
│   ├── hud.js
│   ├── eventos.js
│   ├── storage.js
│   └── buildManager.js
└── assets/
    └── fonts/ritua.ttf

🧭 FLUXO DE USO DO JOGADOR
Etapa	Interface Esperada
Acesso inicial	Tela ritual com introdução, botão de início ou continuação
Durante evento	Título, descrição, 2–3 botões de escolha + fala da Pedra
NPCs	Tela em overlay, fala estilizada com close no personagem
Final do dia	Transição ritual (ex: frase simbólica, contagem de polegadas)
HUD fixa	Exibe build, dia atual, barra de progresso textual
Reinício	Botão discreto de reinício com confirmação (responsivo)
💻 COMPONENTES PRINCIPAIS
1. HUD (hud.js + hud.css)

    Exibe:

        Dia atual (Dia 4 — Os Luminares)

        Build atual (🟢 Virtuoso, 🟣 Anomalia, ⚪ Profano)

        Barra de progresso (ex: 🪷 Evento 3 / 7)

    Fixo no topo, responsivo.

<header id="hud">
  <span id="hud-dia">Dia 4 — Os Luminares</span>
  <span id="hud-build" class="virtuoso">Virtuoso</span>
  <progress id="hud-progresso" value="2" max="6"></progress>
</header>

2. RENDERIZADOR DE EVENTOS (renderer.js)

    Carrega evento (titulo, descricao, opcoes)

    Renderiza com fade-in ritual

    Apresenta fala da Pedra (ao final)

function renderizarEvento(evento) {
  const container = document.getElementById("evento");
  container.innerHTML = `
    <div class="evento-bloco fade-in">
      <h2>${evento.titulo}</h2>
      <p>${evento.descricao}</p>
      <div class="opcoes">
        ${evento.opcoes.map(opcao => `
          <button data-id="${opcao.proximo}" data-build="${opcao.build}">
            ${opcao.texto}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

3. SISTEMA DE NPCs (npcManager.js)

    Dispara overlays em determinadas escolhas

    Fala do NPC + nome e expressão

    Cômico ou simbólico

<div id="npc-overlay" class="hidden">
  <div class="npc-avatar"><img src="..." alt="NPC"/></div>
  <div class="npc-fala">
    <strong>Sr. Trombeta:</strong> "Moleque, tu tá cheirando livro de autoajuda? Vai viver!"
  </div>
</div>

4. TELA INICIAL

    Fundo escuro, som suave, frase contemplativa

    Botão central: “Iniciar Ritual” ou “Continuar”

<main id="tela-inicial">
  <h1>🌑 O Despertar</h1>
  <p class="frase">"No início, havia escuridão..."</p>
  <button id="btn-iniciar">Iniciar Ritual</button>
</main>

5. TELA FINAL DE CADA DIA

    Transição com fade, som ritual (opcional)

    Fala da Pedra com símbolo aleatório

    Botão: “Avançar ao próximo ciclo”

<section id="fim-dia">
  <h2>⛰ A Pedra diz:</h2>
  <blockquote>"Escolher a luz cega os que não aprenderam a ver no escuro."</blockquote>
  <button id="proximo-dia">Iniciar Dia 5</button>
</section>

6. ACESSIBILIDADE (RNF03, RNF06)

    aria-live nos textos de evento

    tabindex e foco nos botões

    fontes legíveis, contraste alto

    navegação por teclado (espiral Tab)

✨ UX/UI — RITUAL CONTEMPLATIVO

    Fonte: ritua.ttf (estilo místico)

    Transições suaves com @keyframes

    Temas morais:

        🟢 Virtuoso: verde-dourado suave

        ⚪ Profano: cinza, roxo claro

        🟣 Anomalia: preto, rosa-vibrante

