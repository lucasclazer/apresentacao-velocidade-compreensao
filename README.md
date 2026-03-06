# Velocidade vs Compreensao

Apresentacao interativa sobre o impacto da aceleracao por IA no desenvolvimento de software.

**Mensagem central:** Quanto mais rapido o processo fica, mais a equipe precisa de estrutura para acompanhar.

## Demo

[Abrir apresentacao](https://lucasclazer.github.io/apresentacao-velocidade-compreensao/)

## Navegacao

A apresentacao tem 3 fases:

1. **Hero** — Esfera de particulas animada com morph de texto
2. **Titulo** — "Velocidade vs Compreensao" com transicao visual
3. **Mapa interativo** — Grafo de cenarios de desenvolvimento plotados por velocidade e compreensao

### Interacoes no mapa

- **Hover nos quadrantes** — Destaca a area e mostra descricao
- **Arrastar nos astros** — Puxa o grafo inteiro com efeito de mola
- **Hover nos cantos** — Particulas formam shapes (code, AI, etc)

## Stack

- React 19 + Vite
- Three.js (hero com GLSL shaders)
- Canvas 2D (particulas nos cantos)
- SVG interativo (mapa de risco)

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Contexto

Criado para reuniao interna da Evoluum sobre como integrar IA no fluxo de desenvolvimento sem perder compreensao do que esta sendo construido.
