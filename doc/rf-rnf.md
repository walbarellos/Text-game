✅ REQUISITOS FUNCIONAIS (RF)
ID	Requisito Funcional	Descrição Detalhada
RF01	Carregamento de dias sequenciais	O jogo deve carregar arquivos diaN.json com base no índice do dias.json, controlando fluxo automaticamente.
RF02	Renderização de eventos narrativos	Blocos de texto com título, descrição, opções e fala final devem ser exibidos dinamicamente.
RF03	Encadeamento por opções	Cada opcao.proximo deve apontar para outro evento no mesmo dia.
RF04	Classificação moral por opção	Cada opção conterá uma chave build (virtuoso, profano, anomalia), influenciando a trajetória moral do jogador.
RF05	Registro de progresso	O jogo deve salvar no localStorage os dados: diaAtual, eventoAtual, buildAtual.
RF06	Sistema de NPCs com interrupção	Após certas ações, NPCs definidos em eventoNPC.json devem interromper o fluxo principal com falas reativas.
RF07	HUD simbólica	Interface deve exibir: nome do dia (Yom), build ativa, barra de progresso textual e tempo restante.
RF08	Avanço automático de dia	Ao final do último evento de um diaN.json, o sistema deve carregar automaticamente o próximo dia.
RF09	Reset do jogo	O jogador poderá reiniciar o jogo manualmente, limpando localStorage e reiniciando o ciclo.
RF10	Modularidade total com JSON	Todos os dados (dias, eventos, NPCs, falas) serão lidos de arquivos .json, sem codificação hardcoded.
RF11	Frases da Pedra	Ao final de cada evento, a Pedra pode emitir uma frase simbólica associada à escolha moral feita.
RF12	Diálogos com humor filosófico	Eventos e NPCs podem conter falas com ironia, absurdo ou crítica social, inspiradas em Kafka, Groucho ou Pirandello.
RF13	Títulos simbólicos	Cada evento terá um titulo evocativo e enigmático para reforçar a imersão ritual.
RF14	Eventos e falas reativas por build	Algumas descrições, falas ou respostas dos NPCs mudam conforme a build moral do jogador.
RF15	Suporte a eventos extras	O jogo deve ser capaz de pausar a linha principal e executar eventos secundários (ex: eventoNPC.json).
RF16	Sistema de conquistas (opcional)	O jogo poderá registrar conquistas por comportamento, ex: “Escolheu 3x como Virtuoso”.
RF17	Caminhos divergentes por build	Algumas escolhas levarão a caminhos narrativos exclusivos de determinada build.
RF18	Exportação do resumo da jornada	Ao final do jogo, o jogador poderá exportar sua jornada (builds, falas, escolhas) em .json ou .txt.
🚫 REQUISITOS NÃO FUNCIONAIS (RNF)
ID	Requisito Não Funcional	Descrição Detalhada
RNF01	Arquitetura 100% client-side	O jogo deve rodar inteiramente no navegador, com fetch() e leitura local dos JSONs.
RNF02	Uso de HTML/CSS/JS puro	Inicialmente, o jogo será desenvolvido com tecnologias nativas. Build poderá ser gerenciado por Vite.
RNF03	Compatibilidade mobile	O layout deve ser responsivo, adaptando-se a celulares e tablets (min 320px).
RNF04	Tempo de carregamento < 2s	Todos os arquivos .json devem ser carregados de forma assíncrona e otimizados.
RNF05	Salvamento offline	O uso de localStorage garante persistência do progresso mesmo após fechar o navegador.
RNF06	Interface contemplativa	Estilo minimalista, sem distrações visuais. Tipografia simbólica, fundo ritualístico. Sem botões excessivos.
RNF07	Código modular e reutilizável	Separação em múltiplos scripts: renderer.js, hud.js, storage.js, npcManager.js, etc.
RNF08	Baixo consumo de memória	Arquitetura leve, carregando apenas o necessário por evento (objetivo: <500kb totais).
RNF09	Atualizações seguras	Os arquivos JSON podem ser alterados e adicionados sem necessidade de recompilação.
RNF10	PWA opcional	Estrutura de build preparada para incluir manifest.json e service worker no futuro.
RNF11	Tratamento de erros	Caso um JSON esteja malformado ou faltando, exibir fallback simbólico: “A Pedra não fala agora.”
RNF12	Suporte a internacionalização	Arquitetura textual deve permitir arquivos alternativos por idioma (ex: dia1_en.json).
RNF13	Exportação da jornada segura	O .json exportado da jornada deve preservar apenas dados textuais e simbólicos, sem risco de execução.
📦 ESTRUTURA SUGERIDA PARA OS .JSON

📁 public/
├── dias.json                 # Mapa mestre dos 7 dias e seus arquivos
├── dia1.json … dia7.json     # Blocos narrativos e opções
├── eventoNPC.json           # Diálogos interruptivos com personagens
├── personagens.json         # Repositório de NPCs reutilizáveis
├── falas-pedra.json         # Frases simbólicas que reagem à moralidade
├── conquistas.json (extra)  # Lista de conquistas e critérios
├── resumo-final.json (extra) # Modelo do arquivo exportado
    
