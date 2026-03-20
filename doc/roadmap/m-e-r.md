🧩 ENTIDADES PRINCIPAIS

1. 📘 Dia
Atributo	Tipo	Descrição
id	string	Identificador único do dia ("dia1" etc.)
nome	string	Nome simbólico do dia (ex: "Yom Rishon")
titulo	string	Título evocativo (ex: "O Caos e a Pedra")
descricao	string	Descrição do dia, aparece na abertura
arquivo	string	Nome do arquivo que contém os eventos (dia1.json)

🔗 Relacionamento: 1 Dia → N Eventos
2. 🧱 Evento
Atributo	Tipo	Descrição
id	string	ID único do evento dentro do dia ("evento1")
titulo	string	Título do evento
descricao	string	Texto principal narrativo
opcoes	array	Lista de opções interativas (ver abaixo)
falaPedra	string?	Frase simbólica exibida após escolha (opcional)
3. 🧭 Opcao
Atributo	Tipo	Descrição
texto	string	Texto exibido no botão de escolha
proximo	string	ID do próximo evento a ser carregado
build	enum	"virtuoso" | "profano" | "anomalia" — Define o impacto moral da escolha
eventoNPC	string?	ID do evento extra disparado com essa opção (opcional)

🔗 Relacionamento: 1 Evento → N Opções
4. 🧑‍🎤 EventoNPC
Atributo	Tipo	Descrição
id	string	Identificador único ("npc1")
npcId	string	Referência ao NPC que fala
fala	string	Texto falado pelo NPC
condicao	object?	Condição para disparo (ex: dia = 3, build = "anomalia")
5. 🧙 NPC
Atributo	Tipo	Descrição
id	string	Identificador ("ancião", "voz-interna")
nome	string	Nome visível (ou simbólico)
estilo	string	Tag de estilo visual (ex: "sábio", "sarcasmo")
imagem	string?	(Reservado para versão com imagens)
6. 💬 FalaPedra
Atributo	Tipo	Descrição
build	enum	"virtuoso" | "profano" | "anomalia"
frases	array	Lista de frases que podem ser sorteadas para esta build

🔗 Relacionamento: 1 Build → N Frases
7. 🏆 Conquista
Atributo	Tipo	Descrição
id	string	ID única da conquista
titulo	string	Nome da conquista
descricao	string	Explicação simbólica da conquista
condicao	object	Regra de ativação (ex: 3 escolhas como virtuoso)
8. 📄 ResumoFinal
Atributo	Tipo	Descrição
conquistas	array	Lista de conquistas ativadas
escolhas	array	Histórico com: dia, evento, opção escolhida, build
npcFalados	array	Lista de NPCs que interagiram
finalizacao	string	Frase final da Pedra ou da Build dominante
🔗 RELACIONAMENTOS ENTRE ENTIDADES

dias.json
  ↳ [ Dia ]
        ↳ diaN.json
             ↳ [ Evento ]
                   ↳ [ Opcao ] --(triggers)--> [ EventoNPC ]
                                 ↳ build → [ FalaPedra ]
                                 ↳ build → [ Conquista ]
ResumoFinal ← registra → todas escolhas

🧠 CONVENÇÕES DE NOMES E IDs
Entidade	Padrão de ID
Dia	"dia1", "dia2"
Evento	"ev1", "ev2"
Opcao	index ou slug (não precisa de ID)
NPC	"ancião-sacada", "voz-esquadro"
EventoNPC	"npc1", "npc2"
Build	"virtuoso", "profano", "anomalia"
FalaPedra	agrupado por build
Conquista	"virtude3x", "devorador1x"
