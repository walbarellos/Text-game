🧾 SUMÁRIO DA DOCUMENTAÇÃO

    Visão Geral do Projeto

    Arquitetura Geral do Sistema

    Diagrama de Módulos

    Modelo de Dados (JSONs)

    Endpoints e Interações Internas

    Fluxo de Execução do Jogo

    Instruções de Instalação e Execução

    Estrutura de Diretórios

    Padrões de Codificação

    Processo de Expansão

    Considerações Finais

<a name="1"></a>
1. 📖 VISÃO GERAL DO PROJETO

Este sistema é um jogo textual interativo com base simbólica, filosófica e ritualística. Cada dia representa um ciclo da Criação, com escolhas morais, falas de NPCs e eventos ocultos que constroem a jornada do jogador.

    Tecnologias: HTML, CSS, JavaScript (ES6+), Vite (dev/build)

    Objetivo: Simular uma jornada iniciática por meio de texto dinâmico

    Metodologia: Modelo Cascata Caracolado + PaRDeS + CTMU

<a name="2"></a>
2. 🏛 ARQUITETURA GERAL DO SISTEMA

📦 public/
📦 src/
 ┣ 📁 core/          ← Lógica de jogo, tempo, moralidade, fluxo
 ┣ 📁 data/          ← JSONs externos: dias, eventos, personagens
 ┣ 📁 ui/            ← HUD, renderer, componentes visuais
 ┣ 📁 styles/        ← CSS ritualístico e temático
 ┣ 📁 assets/        ← Sons, imagens (futuros), fontes
 ┣ 📄 main.js        ← Entry point do jogo
 ┗ 📄 index.html     ← Estrutura base do jogo

Padrão adotado: Modular em camadas, estilo MVC adaptado (Model = JSONs, View = UI, Controller = renderer.js + eventos.js)

<a name="3"></a>
3. 📊 DIAGRAMA DE MÓDULOS

        [ index.html ]
               ↓
        [ main.js ] ←────────┬─────────┐
            ↓                ↓         ↓
    [ renderer.js ]   [ hud.js ]   [ npcManager.js ]
            ↓                ↓         ↓
      [ eventos.js ]     [ dias.json ]  ←↔ [ localStorage ]
            ↓
    [ eventoNPC.json ] ← [ personagens.json ]

<a name="4"></a>
4. 📁 MODELO DE DADOS (JSONs)
dias.json

{
  "id": "dia1",
  "nome": "Yom Rishon",
  "titulo": "O Caos e a Pedra",
  "descricao": "...",
  "arquivo": "dia1.json"
}

diaN.json

{
  "id": "e1",
  "titulo": "Despertar",
  "descricao": "Você vê a Pedra pela primeira vez.",
  "opcoes": [
    {
      "texto": "Tocá-la",
      "proximo": "e2",
      "build": "virtuoso"
    }
  ]
}

personagens.json

{
  "npc_id": "prof_flex",
  "nome": "Professor Flexível",
  "fala": {
    "virtuoso": "Nunca subestime uma dobra bem feita.",
    "anomalia": "Você anda dobrando a moral também?",
    "profano": "Hmmm, falta firmeza na sua postura ética."
  }
}

<a name="5"></a>
5. 🔁 ENDPOINTS E INTERAÇÕES INTERNAS (VIA FETCH)
Ação	Arquivo	Formato
Carregar dias	/data/dias.json	JSON com metadados
Carregar eventos de um dia	/data/diaN.json	Lista de eventos
Carregar NPCs	/data/personagens.json	Lista de NPCs
Salvar progresso	localStorage.setItem()	Chave/valor
Avançar dia	Verifica evento final → carrega próximo dia	

<a name="6"></a>
6. 🔄 FLUXO DE EXECUÇÃO DO JOGO

    main.js → busca dias.json

    Primeiro dia é carregado (dia1.json)

    renderer.js exibe o primeiro evento

    Usuário escolhe uma opção → eventos.js atualiza progresso

    Build é atualizada → hud.js mostra moral

    NPC pode surgir → npcManager.js exibe fala condicional

    Último evento do dia? → Avança para o próximo

    Final do jogo → Loop ou finalização simbólica

<a name="7"></a>
7. 🛠️ INSTRUÇÕES DE INSTALAÇÃO E EXECUÇÃO
✅ Ambiente de Desenvolvimento

npm install
npm run dev

✅ Build para Produção

npm run build

✅ Hospedagem estática

    Coloque a pasta dist/ em qualquer servidor (Netlify, GitHub Pages, Vercel)

<a name="8"></a>
8. 🗂️ ESTRUTURA DE DIRETÓRIOS

📦 src/
 ┣ 📁 core/
 ┃ ┣ eventos.js
 ┃ ┣ tempo.js
 ┃ ┗ moralidade.js
 ┣ 📁 data/
 ┃ ┣ dia1.json
 ┃ ┣ dia2.json
 ┃ ┣ ...
 ┃ ┗ personagens.json
 ┣ 📁 ui/
 ┃ ┣ hud.js
 ┃ ┗ renderer.js
 ┣ 📁 styles/
 ┃ ┣ base.css
 ┃ ┣ tema.css
 ┃ ┗ ritual.css
 ┗ main.js

<a name="9"></a>
9. 🧩 PADRÕES DE CODIFICAÇÃO

    ES6 Modules (import/export)

    Comentários JSDoc

    Funções puras sempre que possível

    JSONs versionados separadamente para expansão

    Sem dependências externas (exceto Vite para dev)

<a name="10"></a>
10. 🌀 PROCESSO DE EXPANSÃO

    Adicionar novo dia → criar diaN.json + inserir no dias.json

    Adicionar evento → inserir novo ID no diaN.json

    Adicionar NPC → incluir npc_id no evento + fala em personagens.json

    Novo build? → Atualizar hud.js e moralidade.js

<a name="11"></a>
11. 📜 CONSIDERAÇÕES FINAIS

Este sistema é vivo. Ele foi criado para crescer com o jogador, adaptar-se moralmente e gerar espelhos simbólicos de sua jornada interior.
A estrutura modular favorece expansão, refinamento, integração com áudio e mesmo exportação futura para formatos como:

    Electron (Desktop)

    Capacitor (Mobile App)

    WebAssembly (ritual engine)

