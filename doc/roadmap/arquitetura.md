🏛 ARQUITETURA GERAL DO SISTEMA — Jogo Textual Moral e Simbólico
📐 PADRÃO ADOTADO:

MVC Modularizado + Separação de Responsabilidades (SoC)

    Não usamos um framework MVC formal, mas respeitamos seus princípios dividindo o jogo em:

    Modelo (dados e estados: JSON, localStorage),

    Visão (DOM e HUD),

    Controle (lógica de fluxo, encadeamento e reatividade moral).

🧱 CAMADAS DO SISTEMA
1. 📂 Dados (Modelo)

    dias.json – lista com metadados dos dias jogáveis.

    diaN.json – narrativa e eventos do dia.

    personagens.json – NPCs e falas possíveis.

    eventoNPC.json – falas específicas disparadas em ações.

    localStorage – progresso do jogador: dia atual, evento atual, build, conquistas (futuro).

🔧 Funções envolvidas: carregarJSON(), salvarProgresso(), recuperarEstado()
📦 Local: core/storage.js, core/dataLoader.js
2. 🎮 Lógica e Fluxo (Controlador)

    eventManager.js – executa blocos, avalia opções e ramificações.

    npcManager.js – lida com interrupções por NPCs conforme build.

    hudController.js – exibe HUD dinâmica (dia, build, progresso).

    router.js – gerencia transições entre eventos e dias.

📦 Local: core/, logic/
3. 🖼 Visão (Interface)

    renderer.js – renderiza os blocos com título, descrição e botões de escolha.

    hud.js – constrói a HUD superior com dados morais e barra de avanço.

    resetButton.js – botão para reiniciar o jogo.

    feedback.js – exibe frases da Pedra e falas de NPCs.

    index.html – carrega tudo e define a estrutura base.

📦 Local: ui/, components/, index.html

🛠️ TECNOLOGIAS ESCOLHIDAS
Componente	Tecnologia	Justificativa
Build	[Vite.js] (vanilla template)	Carregamento rápido, desenvolvimento modular
Linguagem	JavaScript (ES6+)	Sintaxe moderna, compatível com todos os navegadores
Estilo	CSS3 + custom properties	Controle simbólico via temas (ex: modo ritual)
Fonte	ritua.ttf (ou similar)	Fonte simbólica, suporte a estética ritual
Armazenamento	localStorage	Persistência offline do progresso
Layout	HTML5 sem frameworks	Total controle e leveza (estrutura de texto)
Narrativas	Arquivos .json externos	Modularidade, edição simples, expansão rápida
Organização	Estrutura modular por função	Facilidade de manutenção e escalabilidade

🧬 PADRÕES EXTRAS ADOTADOS
Padrão	Aplicação
SoC (Separação de Responsabilidades)	Cada script tem uma função: render, HUD, NPCs, etc
Fail Safe JSON Loader	Falhas nos arquivos externos não quebram o jogo, exibem fallback
Lazy Loading de Dias	Cada dia só é carregado quando necessário
Reatividade Moral	A build do jogador afeta falas e futuro
Arquitetura PWA-ready	Pode futuramente ser convertida para app com cache e ícone

🔄 FLUXO GERAL DO JOGO

🕹️ index.html
    ↓
📦 loader.js carrega dias.json → primeiro dia
    ↓
🧠 renderizarEvento() exibe 1º bloco
    ↓
👆 jogador escolhe opção → próxima id
    ↓
🧠 npcManager.js pode interromper (fala)
    ↓
📈 hud atualiza build, dia, progresso
    ↓
📁 diaN.json concluído → vai para diaN+1
    ↓
🧱 ciclo simbólico se repete até Yom Shevi’i
