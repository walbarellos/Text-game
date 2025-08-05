🧱 DIAGRAMA ENTIDADE-RELACIONAMENTO (D.E.R.) — VERSÃO TEXTUAL

Aqui está o D.E.R. em texto estruturado, sem imagens nem links:
📁 Entidade: Dia

    id: string (ex: "dia1")

    nome: string (ex: "Yom Rishon")

    titulo: string (ex: "O Caos e a Pedra")

    descricao: string

    arquivo: string (ex: "dia1.json")

Relacionamento: 1 Dia → N Blocos
📁 Entidade: Bloco

    tipo: enum [ "historia", "rotina", "evento" ]

    titulo: string

    descricao: string

    opcoes: Lista de Opção

Relacionamento: 1 Bloco → N Opções
📁 Entidade: Opção

    texto: string

    proximo: string (id do próximo bloco)

    build (opcional): enum [ "virtuoso", "profano", "anomalia" ]

Relacionamento: N Opções → 1 Bloco (referência)
📁 Entidade: NPC

    id: string

    nome: string

    build: enum [ "virtuoso", "profano", "anomalia"]

    fala: string

Relacionamento: 1 NPC → acionado por evento (eventoNPC.json)
📁 Entidade: Estado do Jogador

    diaAtual: string

    eventoAtual: string

    buildAtual: string

    progresso: number (0–100)

Relacionamento: Singleton (estado salvo via localStorage)
