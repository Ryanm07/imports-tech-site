> **Documento histórico — julho de 2026.** Esta auditoria descreve a versão anterior à home 3D e à simplificação da história. Para o estado vigente, consulte [README.md](README.md) e [DEPLOYMENT.md](DEPLOYMENT.md). Resultados e pendências abaixo pertencem àquela versão.

# Auditoria corretiva final — Imports Tech

Data da conclusão: 15 de julho de 2026

Base de partida: commit `313ee58`, branch `main`

Checkpoints de recuperação: `e597b74` e `82ca615`

## Estado encontrado

- A execução anterior havia parado depois da maior parte da experiência cinematográfica, mas antes da consolidação final.
- A árvore de trabalho ainda continha um ajuste não commitado de resize, seis logs de QA, `.env.local` e `public/mobile-qa.html`.
- Este relatório ainda descrevia 12 capítulos, `time-balance` desconectado e validação pendente.
- O projeto publicado continuava no commit `313ee58` e com `INTRO_ENABLED=false` no runtime.

Os temporários foram removidos, o ajuste pendente foi validado e este documento passou a registrar o estado real da entrega.

## Experiência final implementada

- Home conectada pelo scroll: intro, hero, cinco métricas, apresentação pessoal, quatro marcos, comunidade, empresas e CTA final.
- Narrativa documental com 13 capítulos independentes, voz em primeira pessoa e uma microcena própria para cada capítulo:
  1. origem em setembro de 2025;
  2. mudança de identidade para Imports Tech;
  3. primeira gravação com celular, teclado e timeline;
  4. montagem do equipamento e risco de R$ 300;
  5. primeiro sinal do canal;
  6. descoberta inesperada;
  7. percepção do padrão de crescimento;
  8. transição mecânica de 999 para 1.000 inscritos;
  9. avanço para 200 mil visualizações;
  10. notebook Dell, 500 GB, desmontagem e quase dois dias de processamento;
  11. linha de produção de um vídeo, de 1 hora a 10–15 minutos e até 12 horas de trabalho;
  12. falta de tempo e conciliação da rotina;
  13. meta futura de 1 milhão de inscritos.
- Scroll reversível, fases contínuas, progresso por seção, direção e velocidade usando `requestAnimationFrame` nativo.
- Cena ativa preservada quando a viewport muda entre mobile, tablet e desktop.
- Deep links por hash, voltar/avançar do navegador e navegação por capítulo.
- Desktop com palco sticky e mobile com os 13 artigos no fluxo vertical.
- Fallbacks para movimento reduzido, economia de dados, Canvas indisponível e JavaScript ausente.
- Intro responsiva com vídeo cover, transição para o logo real, Escape, timeout, replay e recuperação de falhas.
- Menu móvel com botão nativo, ARIA, suporte de Enter/Espaço do navegador e Escape com devolução de foco.
- Projetos e rotas editoriais antigas preservados internamente, mas removidos da navegação pública por feature flag e redirects.
- Compatibilidade com a timeline antiga do D1: o capítulo combinado anterior é normalizado sem duplicar ou perder conteúdo.

## Conteúdo e dados

- Textos pessoais, históricos, projetos, dificuldades, aprendizados e metas estão em primeira pessoa.
- Nenhum fato, data ou número foi inventado para completar a narrativa.
- Campos visuais usam allowlists e presets seguros; `visualAsset` está conectado quando o editorial fornece um asset válido.
- Métricas públicas continuam limitadas a `channels.list`; a chave do YouTube permanece somente no servidor.
- Snapshot antigo continua identificado como retrato histórico, sem fingir atualização atual.

## Validação limpa

Executada depois da remoção completa de `node_modules` e de um novo `npm ci`:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado, sem warnings.
- `npm run test`: 32 de 32 testes aprovados.
- `npm run format:check`: aprovado.
- `npm run build`: aprovado.
- Varredura do bundle público: 46 arquivos verificados, nenhum segredo do YouTube encontrado.
- `npm audit --omit=dev`: 0 vulnerabilidades de produção.
- Smoke de rotas: `/`, `/sobre`, `/comunidade`, `/metricas`, `/sitemap.xml` e `/robots.txt` retornaram 200; rotas desativadas retornaram os redirects esperados.
- SSR de `/sobre`: 13 capítulos presentes no HTML.
- Console limpo no smoke visual final: 0 erros e 0 warnings.

O conjunto completo de desenvolvimento ainda reporta 12 advisories transitivos (`1 low`, `5 moderate`, `6 high`) em ferramentas como Vite, Wrangler e Drizzle Kit. Eles não entram nas dependências de produção, conforme o audit com `--omit=dev`.

## QA visual e comportamental

- Intro verificada em desktop e mobile, incluindo transição, ausência de flash e retorno ao topo.
- Home percorrida para baixo e para cima, cobrindo métricas, apresentação, trajetória, comunidade, empresas e CTA.
- Todas as microcenas críticas foram verificadas: 999→1.000, 200 mil, Dell/500 GB/dois ciclos, linha de produção, falta de tempo e meta.
- História verificada em 320×568, 375×667, 768×1024, 1366×768, 1440×900, 1920×1080 e 2560×1440.
- O mesmo capítulo permaneceu ativo durante todos os redimensionamentos; não houve overflow horizontal.
- Hash, voltar, avançar e scroll reverso foram exercitados no navegador.

## Performance

- Baseline do commit `313ee58`: 21 chunks JS, 376.278 bytes brutos e 122.482 bytes gzip.
- Resultado final: 23 chunks JS, 402.850 bytes brutos e 130.761 bytes gzip.
- Variação: +26.572 bytes brutos (+7,06%) e +8.279 bytes gzip (+6,76%).
- Não foram adicionados GSAP, ScrollTrigger, Lenis, Three.js ou outra biblioteca de animação.

## Publicação e configuração

- Projeto Sites preservado: `appgprj_6a55c1441aac8191a90d8e7125bdec33`.
- URL de produção preservada: `https://central-do-canal-2026.vsvsbssy.chatgpt.site/`.
- A intro foi ativada no runtime com `INTRO_ENABLED=true` para acompanhar a experiência validada.
- O controle de acesso existente foi preservado; esta entrega não amplia quem pode acessar o site.

Limitação operacional real: ainda não existe `YOUTUBE_API_KEY` no runtime publicado. O cron de seis horas está implementado, mas a sincronização recorrente só funcionará quando uma chave válida for cadastrada como segredo. Enquanto isso, o site usa o snapshot/fallback explícito e não inventa atualização.

## Legado e riscos residuais

- `app/globals.css` continua grande e contém camadas históricas; a remoção ampla foi evitada porque teria risco maior que benefício nesta entrega.
- Projetos, reviews e migrations antigas permanecem preservados para reativação e compatibilidade de bancos existentes.
- O QA real de resize, touch, hash e scroll foi manual; os testes versionados cobrem os cálculos, presets, fallbacks, schemas e contratos, mas ainda não existe uma suíte E2E de navegador no repositório.
- `vinext start` local encontra o esquema `cloudflare:` fora do runtime de destino; o build do Sites é válido e a verificação de produção é feita no ambiente hospedado.

## Resultado

A experiência cinematográfica foi concluída sem recomeçar o projeto, sem apagar legado e sem inventar conteúdo. O código, o build e o estado publicado correspondem à versão auditada nesta entrega.
