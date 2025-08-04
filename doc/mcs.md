SEPARAÇÃO EM MÓDULOS (MICROSERVIÇOS CLIENT-SIDE)
📁 Módulo: dataLoader
Descrição	Responsável por carregar arquivos .json externos (eventos, dias, NPCs).
Entrada	arquivo (string: caminho relativo do JSON)
Saída	objetoJS (JSON parseado) ou fallback
Comunicação	Chamado por gameEngine, npcManager, eventManager via import
Exemplo	const dia = await carregarJSON("data/dia1.json");
📁 Módulo: gameEngine
Descrição	Coordena o ciclo de jogo: carrega dia, evento, processa escolhas e avança narrativa.
Entrada	evento atual, opção clicada, build atual
Saída	próxima tela renderizada, build atualizada, possível interrupção de NPC
Comunicação	Chama: dataLoader, renderer, npcManager, storage, hudController
📁 Módulo: renderer
Descrição	Renderiza eventos (título, descrição, opções) no DOM.
Entrada	Objeto evento
Saída	DOM atualizado com texto e botões
Comunicação	Recebe evento do gameEngine, chama callback() nas opções clicadas
📁 Módulo: npcManager
Descrição	Interrompe o fluxo com falas de NPCs com base no evento ou build.
Entrada	eventoId, build, estadoAtual
Saída	Fala exibida no HUD ou em modal
Comunicação	Chama dataLoader, comunica renderer ou feedback.js
📁 Módulo: hudController
Descrição	Atualiza o HUD (barra de progresso, nome do dia, build atual).
Entrada	buildAtual, diaAtual, eventoAtual
Saída	Atualiza elementos visuais do HUD
Comunicação	Chamado pelo gameEngine ou diretamente em renderer.js
📁 Módulo: storage
Descrição	Lê e escreve progresso no localStorage.
Entrada	Objeto com progresso {dia, evento, build}
Saída	JSON recuperado ou salvo
Comunicação	Usado por gameEngine, reset, hudController
📁 Módulo: pedraFalante
Descrição	Gera frases simbólicas ao final de cada evento, baseadas na build.
Entrada	build, eventoId
Saída	Frase textual (string)
Comunicação	Chamado pelo gameEngine após cada escolha. Interage com renderer
📁 Módulo: eventManager
Descrição	Coordena a transição de eventos com base na escolha feita.
Entrada	proximoEventoId, buildAtual
Saída	Próximo evento renderizado
Comunicação	Coordena renderer, atualiza estado com storage, consulta npcManager
📁 Módulo: reset
Descrição	Permite reiniciar o jogo do zero.
Entrada	Clique do jogador no botão "Recomeçar"
Saída	localStorage limpo, página recarregada
Comunicação	Atua diretamente, recarrega o index.html
🕸️ DIAGRAMA DE INTERAÇÃO ENTRE MÓDULOS

                 +------------------------+
                 |       index.html       |
                 +-----------+------------+
                             |
                             v
                 +------------------------+
                 |      gameEngine        |
                 +-----+-----+-----+------+
                       |     |     |
                       v     v     v
              +--------+   +---------+   +------------+
              | renderer | | storage |   | npcManager |
              +----+-----+ +----+----+   +------+-----+
                   |            |               |
                   v            v               v
             +-----+------+  +---+-------+  +----+------+
             | hudController| |dataLoader|  |feedback.js|
             +-------------+ +-----------+  +-----------+

✅ Forma de Comunicação

    Assíncrona via fetch() e await — para JSONs.

    Modular via import/export — cada script é um microserviço JS.

    DOM e Callbacks — eventos clicáveis chamam controladores.
