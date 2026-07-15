# Auditoria da implementação atual — Imports Tech

Data da auditoria: 15 de julho de 2026  
Base analisada: commit `313ee58`, branch `main`, com trabalho local em andamento.

## Implementado e funcionando

- Identidade oficial azul-marinho e dourada, assets e intro responsiva: `components/site-intro.tsx`, `lib/intro.ts`, `public/imports-tech-intro.*`, `app/globals.css`.
- Voz pessoal em primeira pessoa e os fatos históricos confirmados: `lib/story.ts`, `app/home-page.tsx`, `app/sobre/page.tsx`.
- Métricas públicas vindas somente de `channels.list`, com snapshot/falhas explícitos e chave no servidor: `lib/youtube-service.ts`, `app/api/youtube/route.ts`.
- Comunidade externa sem fórum ou mural público: `app/comunidade/page.tsx`, `components/telegram-section.tsx`, `lib/telegram.ts`.
- Segurança, rate limit, autorização privada, schema e migrations preservados: `lib/security.ts`, `lib/rate-limit.ts`, `lib/server-auth.ts`, `db/schema.ts`, `drizzle/`.
- Motor nativo de movimento com `requestAnimationFrame`, medidas armazenadas, direção, velocidade, progresso global e por seção: `components/motion/motion-provider.tsx`, `lib/motion.ts`.
- Canvas persistente com DPR limitado, modo leve e pausa quando a aba fica invisível: `components/motion/interactive-background.tsx`.
- Home com hero, métricas sequenciais, apresentação, quatro marcos, comunidade, empresas e encerramento conectados ao scroll: `app/home-page.tsx`, `components/home-scroll-director.tsx`, `app/globals.css`.
- Palco documental desktop e narrativa vertical mobile com navegação por capítulo/hash: `components/story-experience.tsx`.
- Presets editoriais seguros e validação dos campos visuais: `lib/story.ts`, `lib/content-schemas.ts`, `lib/content-repository.ts`, `components/admin-panel.tsx`.
- Projetos preservados internamente e desativados publicamente por `PROJECTS_ENABLED=false`: `lib/features.ts`, `.env.example`, rotas antigas, header, footer, sitemap e painel.

## Implementado parcialmente

- Microcenas existem para os 12 marcos anteriores, mas a especificação mais recente exige separar “Falta de tempo” como o 13º capítulo: `lib/story.ts`, `components/story-micro-scene.tsx`.
- A cena Dell mostra notebook, 500 GB e dois dias, porém ainda precisa comunicar melhor desmontagem repetida, preenchimento progressivo e dois ciclos de relógio: `components/story-micro-scene.tsx`, `app/globals.css`.
- A primeira gravação possui celular e timeline de cortes, mas falta um teclado abstrato explícito: `components/story-micro-scene.tsx`.
- A cena de equipamentos monta celular, tripé, luzes, microfone e computador; o risco de R$ 300 precisa ficar visualmente integrado: `components/story-micro-scene.tsx`.
- O fio dourado atravessa header, seções, timeline e encerramento, mas é composto por elementos coordenados por seção, não por uma única geometria global: `components/motion/interactive-background.tsx`, `app/globals.css`.
- Os testes unitários cobrem fases e presets, mas parte da prova visual ainda é manual e precisa ser complementada com smoke test comportamental: `tests/motion-experience.test.ts`.

## Criado, mas não conectado

- `time-balance` está disponível como preset editorial, porém ainda não é usado por um capítulo público próprio: `lib/story.ts`, `components/story-micro-scene.tsx`.
- O suporte a `visualAsset` existe no schema, mas as cenas atuais usam composições abstratas porque não há assets reais confirmados para esses capítulos: `lib/content-schemas.ts`, `components/story-experience.tsx`.

## Quebrado

- Nenhum erro de TypeScript, teste ou build foi reproduzido na primeira instalação limpa desta rodada.
- Problema visual reproduzido durante o QA: o novo rótulo de cena criou uma quarta célula em um header de três colunas, empurrando Media Kit e YouTube para uma segunda linha. Corrigido em `app/globals.css` com grade desktop de quatro colunas.
- Problema visual reproduzido durante o QA: o hero mobile começava com opacidade `0.18` porque a fase de foco ainda era zero no primeiro viewport. Corrigido para usar a fase de entrada em `app/globals.css`.
- Problema visual reproduzido durante o QA: o layout documental de 768 px comprimia a coluna textual. Corrigido usando a experiência vertical até 820 px em `app/globals.css`.

## Ainda não iniciado nesta rodada

- Separação editorial do capítulo “Falta de tempo”.
- Ampliação da microcena Dell e dos detalhes de teclado/equipamentos.
- Testes comportamentais DOM para scroll reversível, hash, fallback sem Canvas e ausência de lock.
- Validação final completa após essas correções e publicação.

## Desnecessário

- GSAP/ScrollTrigger: o motor nativo atual já fornece scrub contínuo, reversão, cache de medidas e variáveis CSS sem disputar elementos com outro motor.
- Lenis: não é necessário; o scroll nativo preserva teclado, touch, âncoras e histórico.
- Three.js/React Three Fiber: as metáforas são geométricas e funcionam com HTML/CSS/Canvas 2D.
- Migração destrutiva para Projetos: proibida e desnecessária; dados permanecem preservados.

## Legado preservado

- Componentes e dados de Projetos permanecem isolados atrás da flag para possível reativação: `components/project-experience.tsx`, `components/projects-client.tsx`, `lib/projects.ts`, `lib/site-data.ts`, `app/projetos/page.tsx`.
- CSS histórico ainda referencia telas antigas, mas não é carregado como experiência pública navegável; sua remoção ampla nesta rodada teria risco maior que benefício: `app/globals.css`.
- Migrations antigas de mural/owner continuam no histórico para manter bancos existentes reproduzíveis; as superfícies públicas correspondentes seguem removidas.

## Riscos técnicos

- `app/globals.css` é grande e acumula camadas históricas; novas regras devem permanecer isoladas e verificadas em todos os breakpoints.
- A timeline publicada pelo D1 pode conter entradas antigas sem campos visuais; o repositório precisa continuar mesclando os defaults seguros por slug.
- O snapshot do YouTube pode ficar antigo quando a sincronização oficial não estiver configurada; a interface precisa continuar chamando-o de “último retrato”, nunca de dado atual.
- O modo reduzido depende de CSS e detecção do sistema; deve manter todos os 13 artigos no fluxo normal.

## Resultado final

Esta seção será atualizada depois da implementação, dos testes e da publicação.
