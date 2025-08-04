
🔁 PLANO DE REFINAMENTO CONTÍNUO — V1.0
📌 Premissas Fundamentais

    Evitar retrabalho: a arquitetura já funcional não será quebrada.

    Crescimento simbiótico: cada melhoria respeita o ciclo de reencenação e reflexão do jogador.

    Expansão por camadas: base estável → reatividade → moralidade → estética → transcendência.

📘 ETAPAS DO CICLO ITERATIVO (Método Caracolado)
Fase	Ação	Responsável	Ferramentas	Métrica de Sucesso
1. Escutar	Coleta de feedback do jogador e testes internos	Logs	HUD + localStorage	🎯 Taxa de cliques nas opções
2. Refletir	Análise filosófica e narrativa das decisões registradas	Narrativa	buildManager.js	🌀 Coerência com a Tríade Moral (Virtude, Anomalia, Profano)
3. Propor	Escrita de novas histórias, falas da Pedra, NPCs reativos	Design	JSONs (diaN.json / personagens)	📈 Número de eventos ramificados
4. Codificar	Implementação limpa, modular e ritualística das mudanças	Dev	JS (ESM) + CSS + Vite	✅ Build sem quebra + nova funcionalidade
5. Avaliar	Rodada de testes e métrica de impacto	QA	Navegador + Logs + Análise UX	⏱️ Retenção do jogador por ciclo
6. Selar	Documentação atualizada + commit ritual	Git / Docs	README + markdown	📚 Check de versão + changelog
🧭 CICLOS RECOMENDADOS (com prioridade)
🔹 CICLO 1 — Refino Visual Simbólico

    Transições com @keyframes + moralidade visual refinada por Build

    Adição de ícones rituais sutis na HUD e botões

    HUD responsiva com acessibilidade total (RNF06)

🔸 CICLO 2 — Ramificação Moral Reativa

    Criação de mini-arcos narrativos diferentes por Build

    Inserção de NPCs exclusivos para caminhos distintos

    Fala da Pedra alterada conforme acúmulo de escolhas (karma simbólico)

🟢 CICLO 3 — Sistema de Feedback do Jogador

    Gravação local de reflexões (caixa de comentários interna)

    Log simbólico de decisões por dia, acessível via botão secreto

    Fala da Pedra que “lembra” de você com base nas decisões

🟣 CICLO 4 — Eventos Sombrios e Reversíveis

    Gatilhos ocultos que invertem o HUD ou travam o progresso se escolhas destrutivas forem dominantes

    Reflexão via NPC ou Pedra sobre a reversão possível

    Caminho de Redenção oculto no Dia 6

🛠️ SUGESTÃO DE INTEGRAÇÃO

    📂 core/karma.js — novo módulo para contabilizar karma e sugerir falas

    📂 data/reflexoes.json — arquivo com frases simbólicas randômicas para feedback do jogador

    🔁 hud.js — passa a ler karma.js e adaptar estilo

✅ MÉTRICAS DE CONTROLE
Indicador	Esperado
Tempo médio por ciclo	3 a 7 minutos
Decisões morais por dia	≥ 5
Eventos únicos desbloqueados	≥ 2 por Build por ciclo
Retenção de sessão	≥ 2 dias consecutivos
Taxa de finalização do Dia 7
