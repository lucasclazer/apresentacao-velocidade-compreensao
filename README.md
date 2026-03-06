# Velocidade vs Compreensão

Apresentação interativa sobre o impacto da aceleração por IA no desenvolvimento de software.

**Mensagem central:** Quanto mais rápido o processo fica, mais a equipe precisa de estrutura para acompanhar.

## Demo

[Abrir apresentação](https://lucasclazer.github.io/apresentacao-velocidade-compreensao/)

## Navegação

A apresentação tem 3 fases:

1. **Hero** — Esfera de partículas animada com morph de texto
2. **Título** — "Velocidade vs Compreensão" com transição visual
3. **Mapa interativo** — Grafo de cenários de desenvolvimento plotados por velocidade e compreensão

### Interações no mapa

- **Hover nos quadrantes** — Destaca a área e mostra descrição
- **Arrastar nos astros** — Puxa o grafo inteiro com efeito de mola
- **Hover nos cantos** — Partículas formam shapes (code, AI, etc)

## Stack

- React 19 + Vite
- Three.js (hero com GLSL shaders)
- Canvas 2D (partículas nos cantos)
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

Criado para reunião interna da Evoluum sobre como integrar IA no fluxo de desenvolvimento sem perder compreensão do que está sendo construído.
