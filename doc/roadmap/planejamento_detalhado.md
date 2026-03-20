🧱 PLANEJAMENTO DETALHADO – Jogo Textual Moderno
🎯 OBJETIVO

    Construir um jogo textual simbólico, responsivo, leve e 100% modular usando apenas tecnologias modernas do frontend (JS, HTML, CSS). Narrativas serão lidas a partir de arquivos .json, com eventos encadeados, escolhas morais (Virtuoso, Profano, Anomalia), falas de NPCs, HUD e progresso salvo no navegador.

📌 ETAPAS GERAIS
Etapa	Nome	Objetivo	Status
1️⃣	Estrutura Inicial	Preparar pastas, index.html e configs básicas	✅ Pronto
2️⃣	JSON & Dados	Organizar arquivos diaN.json, dias.json, personagens.json, eventoNPC.json	✅ Pronto
3️⃣	Renderizador	Construir renderer.js para exibir blocos e opções	🟡 A Fazer
4️⃣	Navegação entre eventos	Implementar sistema de rotas por nome (proximo) e carregamento sequencial	🟡 A Fazer
5️⃣	Moralidade & Build	Definir build do jogador (Virtuoso, Profano, Anomalia) com mutação por opção	🟡 A Fazer
6️⃣	NPCs	Interrupção narrativa com falas de NPCs com base na build	🟡 A Fazer
7️⃣	HUD Minimalista	Criar barra superior com nome do dia, moralidade e progresso (tempo)	🟡 A Fazer
8️⃣	Salvamento	Criar sistema com localStorage ou IndexedDB para salvar onde parou	🟡 A Fazer
9️⃣	Finalização de Dia	Detectar fim do dia e carregar próximo JSON (diaN+1.json)	🟡 A Fazer
🔟	PWA (opcional)	Manifest, serviceWorker, modo offline	🔲 Fase Avançada
💬	Diálogos Contextuais	Adicionar microinterações ocultas, frases filosóficas aleatórias	🔲 Refinamento final
🧩 ETAPAS DETALHADAS
1️⃣ Estrutura de Arquivos

text-game/
├── index.html
├── main.js
├── renderer.js
├── npcManager.js
├── hud.js
├── storage.js
├── data/
│   ├── dias.json
│   ├── dia1.json
│   ├── dia2.json
│   ├── ...
│   ├── personagens.json
│   └── eventoNPC.json
├── styles/
│   ├── base.css
│   ├── tema.css
│   └── hud.css

2️⃣ Estrutura do dias.json

Contém todos os dias, nome, descrição e caminho do JSON de dados:

[
  {
    "id": "dia1",
    "nome": "Yom Rishon",
    "titulo": "O Caos e a Pedra",
    "arquivo": "dia1.json"
  }
]

3️⃣ Arquivo main.js

    Função principal que:

    Carrega o dias.json

    Começa no dia atual salvo no localStorage

    Passa o controle ao renderer.js

import { carregarDia } from './renderer.js';
import { obterProgresso } from './storage.js';

const dias = await fetch('./data/dias.json').then(res => res.json());
const progresso = obterProgresso();

const diaAtual = progresso?.diaAtual || 'dia1';
carregarDia(diaAtual);

4️⃣ Arquivo renderer.js

    Responsável por:

    Carregar o arquivo .json do dia atual

    Renderizar blocos historia, rotina, evento

    Exibir opções e lidar com proximo

5️⃣ Moralidade (Builds)

Cada opção pode conter um campo "build": "virtuoso", "profano" ou "anomalia". Isso será salvo na memória do jogador. Usaremos uma variável global ou localStorage.
6️⃣ NPCs (npcManager.js)

Lógica:

    Após uma ação, há 30% de chance de interrupção com NPC

    NPC é sorteado de personagens.json com base na moralidade atual

    Exibe fala + botão “continuar história”

7️⃣ HUD

Será um bloco fixo no topo da tela com:
Elemento	Conteúdo
Dia atual	"Yom Sheni"
Build atual	"Virtuoso"
Progresso	% concluído
8️⃣ Salvamento (storage.js)

Salva:

    Dia atual

    Evento atual

    Build atual

Permite continuar de onde parou.
9️⃣ Avanço entre dias

No final de um dia (fim), o botão leva ao próximo JSON (dia2.json, etc). Atualiza o progresso.
🔟 PWA (Avançado)

Manifest + Service Worker para instalar como app e funcionar offline.
✅ Vantagens do Modelo
Vantagem	Detalhes
100% Modular e Reutilizável	Adicionar novos dias é só criar novo .json
Sem dependência de servidor	Funciona via GitHub Pages, Netlify, Vercel
Escalável para futuras features	Sons, imagens, animações
Base sólida para gamificação	Pontuação, reencenação, conquistas
Narrativa simbólica viva	Moralidade real, NPCs, tempo, builds
