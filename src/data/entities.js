export const ENTITIES = [
  {
    id: 1, name: "Vibe Coder", x: 0.82, y: -0.78,
    color: "#ef4444",
    tag: "PERIGO",
    desc: "Cópia e cola da IA sem ler. O PR passa, mas ninguém entende o que foi feito. Bug em prod vira mistério.",
    risk: 95, examples: ["Aceita tudo sem questionar", "Merge sem review", "\"Funciona, não toca\""]
  },
  {
    id: 2, name: "Startup em Hypergrowth", x: 0.65, y: -0.55,
    color: "#f97316",
    tag: "ALERTA",
    desc: "Ship rápido, escala rápido. A IA gera features em horas, mas a equipe de 5 pessoas virou cuidadora de 200k linhas que ninguém leu.",
    risk: 80, examples: ["Feature factory sem docs", "Onboarding de 3 meses", "Tech debt invisível"]
  },
  {
    id: 3, name: "CTO Ansioso", x: 0.45, y: -0.35,
    color: "#fb923c",
    tag: "ALERTA",
    desc: "Pressiona a equipe a usar IA em tudo para 'ganhar velocidade'. Mede produtividade em linhas geradas, não em compreensão do sistema.",
    risk: 65, examples: ["KPI = PRs mergeados", "\"Por que levou 3 dias?\"", "IA = 10x automático"]
  },
  {
    id: 4, name: "Copilot sem processo", x: 0.7, y: -0.15,
    color: "#fbbf24",
    tag: "RISCO",
    desc: "GitHub Copilot ativado sem cultura de revisão. O código sai mais rápido, mas ninguém questiona as sugestões.",
    risk: 55, examples: ["Autocomplete sem leitura", "Testes que não testam", "Segurança delegada"]
  },
  {
    id: 5, name: "Dev Senior + IA", x: 0.55, y: 0.6,
    color: "#22c55e",
    tag: "IDEAL",
    desc: "Usa IA como amplificador do próprio conhecimento. Sabe questionar o output, revisar o contexto e adaptar ao sistema existente.",
    risk: 15, examples: ["Revisa cada sugestão", "IA acelera, humano dirige", "Documenta decisões"]
  },
  {
    id: 6, name: "Pair Programming c/ IA", x: 0.4, y: 0.75,
    color: "#4ade80",
    tag: "IDEAL",
    desc: "Dev e IA como par. O humano mantém o contexto do negócio, a IA sugere implementação. Revisão contínua cria aprendizado.",
    risk: 10, examples: ["Explica o 'porquê' para a IA", "Questiona cada escolha", "Aprende com sugestões"]
  },
  {
    id: 7, name: "TDD + IA", x: 0.3, y: 0.88,
    color: "#86efac",
    tag: "IDEAL",
    desc: "Testes escritos pelo humano antes do código. A IA preenche a implementação, mas os testes forçam clareza sobre o que o sistema deve fazer.",
    risk: 8, examples: ["Spec antes de código", "IA não adivinha comportamento", "Refactoring seguro"]
  },
  {
    id: 8, name: "Consultoria Tradicional", x: -0.6, y: 0.5,
    color: "#818cf8",
    tag: "NEUTRO",
    desc: "Processo manual, documentação pesada, sprints longos. A equipe entende profundamente, mas o mercado passa na frente.",
    risk: 30, examples: ["Waterfall em 2025", "6 meses antes de 1 linha", "Docs perfeitos, produto atrasado"]
  },
  {
    id: 9, name: "Dev Junior sem mentoria", x: -0.15, y: -0.65,
    color: "#e879f9",
    tag: "PERIGO",
    desc: "Aprende a programar pedindo à IA para resolver. Não desenvolve o modelo mental de como os sistemas funcionam.",
    risk: 85, examples: ["'Só funciona com IA'", "Não sabe debugar", "Cargo cult de código"]
  },
  {
    id: 10, name: "Código Legado + IA", x: 0.25, y: -0.8,
    color: "#f43f5e",
    tag: "PERIGO",
    desc: "IA tenta refatorar código de 10 anos sem contexto histórico. Gera 'melhorias' que quebram edge cases que ninguém documentou.",
    risk: 90, examples: ["IA não conhece o legado", "Refactor sem testes", "O dev que sabia foi embora"]
  },
  {
    id: 11, name: "AI Code Agent autônomo", x: 0.88, y: 0.1,
    color: "#60a5fa",
    tag: "RISCO",
    desc: "Agentes que escrevem, testam e fazem deploy. Alta velocidade, mas o humano se torna apenas aprovador de algo que não entende completamente.",
    risk: 60, examples: ["'Quase não preciso codar'", "Contexto se perde", "Dependência cognitiva"]
  },
  {
    id: 12, name: "Code Review rigoroso", x: -0.1, y: 0.7,
    color: "#34d399",
    tag: "IDEAL",
    desc: "Todo código gerado por IA passa por revisão humana. O processo é mais lento, mas o time mantém o modelo mental do sistema.",
    risk: 12, examples: ["PR com contexto", "Reviewer entende o 'porquê'", "Conhecimento distribuído"]
  },
  {
    id: 13, name: "Documentação Viva", x: -0.4, y: 0.85,
    color: "#2dd4bf",
    tag: "IDEAL",
    desc: "IA ajuda a manter docs atualizadas automaticamente. O time tem velocidade E visibilidade do que foi construído.",
    risk: 5, examples: ["ADRs gerados com IA", "README sempre atual", "Onboarding em 1 semana"]
  },
  {
    id: 14, name: "\"Move fast, fix later\"", x: 0.75, y: -0.9,
    color: "#dc2626",
    tag: "PERIGO",
    desc: "Cultura de ship a qualquer custo. IA amplifica a velocidade mas também amplifica bugs, dívida técnica e colapso cognitivo da equipe.",
    risk: 98, examples: ["Hotfix sobre hotfix", "Ninguém sabe o estado real", "Equipe em burnout"]
  },
  {
    id: 15, name: "Claude Code / Agentic CLI", x: 0.6, y: 0.45,
    color: "#22d3ee",
    tag: "IDEAL",
    desc: "Dev mantém controle total via terminal. Vê cada mudança, aprova ou rejeita. Alta velocidade com compreensão preservada.",
    risk: 12, examples: ["Diff visível antes de aplicar", "Contexto no prompt", "Dev no controle"]
  },
  {
    id: 16, name: "IA além do código", x: -0.25, y: 0.3,
    color: "#a78bfa",
    tag: "NEUTRO",
    desc: "IA não é só para devs. Acelera QA, docs, specs, onboarding, análise de requisitos. Processos manuais que antes levavam dias viram horas.",
    risk: 25, examples: ["QA automatizado com IA", "Specs geradas de reuniões", "Análise de requisitos"]
  },
  {
    id: 17, name: "Full autonomous pipeline", x: 0.92, y: -0.92,
    color: "#b91c1c",
    tag: "PERIGO",
    desc: "CI/CD onde IA detecta bug, gera fix, testa e deploya sem humano no loop. Velocidade máxima, compreensão zero. Ninguém sabe o que mudou.",
    risk: 99, examples: ["Deploy sem aprovação", "Fix automático que quebra outro", "Zero rastreabilidade"]
  },
  {
    id: 18, name: "Vibe Coding com senioridade", x: 0.78, y: 0.25,
    color: "#facc15",
    tag: "RISCO",
    desc: "Senior que faz vibe coding — aceita sugestões rápido porque tem experiência pra filtrar. Funciona, mas depende da pessoa. Não escala pro time.",
    risk: 45, examples: ["Funciona pra ele, não pro time", "Conhecimento tácito", "Não tem processo replicável"]
  },
  {
    id: 19, name: "IA para onboarding", x: 0.2, y: -0.4,
    color: "#f59e0b",
    tag: "ALERTA",
    desc: "Junior usa IA pra entender codebase legado rapidamente. Acelera o início, mas cria falsa sensação de domínio. Sem mentoria, vira dependência.",
    risk: 55, examples: ["'Já entendi o sistema' (não entendeu)", "Pula fundamentos", "Fragilidade técnica"]
  },
];

export const TAG_COLORS = {
  PERIGO: "#ef4444",
  ALERTA: "#f97316",
  RISCO: "#fbbf24",
  NEUTRO: "#818cf8",
  IDEAL: "#22c55e",
};
