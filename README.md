# Imports Tech — site oficial

Experiência complementar ao canal Imports Tech: história, projetos editoriais,
métricas públicas reais, Mural anônimo simples e acesso ao Telegram e YouTube.
O site não mantém biblioteca, busca nem reprodução interna do catálogo do canal.

## Stack e rotas

- Next.js 16, React 19, TypeScript e Vinext/Vite;
- Cloudflare Workers, Scheduled Events, D1 e Drizzle;
- CSS próprio com a identidade azul-marinho e amarela;
- Turnstile nas escritas públicas do Mural;
- autenticação da hospedagem somente para o proprietário em `/admin`.

Navegação principal: `/`, `/sobre`, `/projetos` e `/comunidade`. A página
`/metricas` é secundária. `/videos`, `/reviews` e `/garimpos` redirecionam para
`/projetos`; um ID de vídeo antigo válido redireciona para o vídeo no canal
oficial. Essas rotas antigas não aparecem no sitemap.

## Instalação e validação

Requer Node.js 22.13 ou superior.

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm audit --omit=dev
```

No PowerShell, use `npm.cmd` se a política local bloquear `npm.ps1`.

## Flags, Secrets e variáveis

Copie `.env.example` para `.env.local` somente no desenvolvimento. Valores reais
pertencem ao gerenciador de segredos da hospedagem.

As flags de produção ficam desligadas até homologação explícita:

```env
ADMIN_ENABLED=false
EDITORIAL_DB_ENABLED=false
COMMUNITY_ENABLED=false
INTRO_ENABLED=false
```

Secrets server-side:

| Variável               | Uso                                                                        |
| ---------------------- | -------------------------------------------------------------------------- |
| `YOUTUBE_API_KEY`      | YouTube Data API v3; nunca é devolvida, registrada ou incluída no cliente. |
| `OWNER_EMAILS`         | Allowlist privada e recuperação do acesso do proprietário.                 |
| `RATE_LIMIT_SALT`      | Salt privado, com pelo menos 24 caracteres, para identidade anonimizada.   |
| `TURNSTILE_SECRET_KEY` | Validação server-side do Turnstile.                                        |

Variáveis não secretas/públicas:

| Variável                         | Uso                                     |
| -------------------------------- | --------------------------------------- |
| `YOUTUBE_CHANNEL_ID`             | ID oficial do canal.                    |
| `SITE_URL`                       | Origem canônica validada.               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Chave pública do widget Turnstile.      |
| `TELEGRAM_CHANNEL_URL`           | Canal HTTPS em `t.me` ou `telegram.me`. |
| `TELEGRAM_GROUP_URL`             | Grupo HTTPS em `t.me` ou `telegram.me`. |

Restrinja `YOUTUBE_API_KEY` no Google Cloud exclusivamente à **YouTube Data API
v3**. Ela não deve usar prefixo `NEXT_PUBLIC_`, ir para URLs ou ser armazenada no
D1. O painel informa apenas se a API está configurada e exibe estado e erros
sanitizados.

## Métricas do YouTube

A sincronização faz uma única consulta oficial:

```text
channels.list
part=snippet,statistics
id=YOUTUBE_CHANNEL_ID
```

A chave segue no header `X-Goog-Api-Key`. Não há `playlistItems.list`,
`videos.list`, feed, scraping, paginação de uploads ou classificação automática
do catálogo. Visitantes leem somente o snapshot em `youtube_channel_state`; se o
D1 falhar ou ainda estiver vazio, recebem um snapshot versionado explicitamente
marcado como antigo.

- cron: `0 */6 * * *` (a cada seis horas);
- sincronização manual: privada e limitada pelo painel;
- falhas preservam o último snapshot válido;
- tentativa, sucesso, fonte, stale e erro sanitizado são independentes;
- dados com mais de 12 horas nunca são apresentados como atuais.

As métricas editoriais (projetos, garimpos e reparos) são calculadas dos registros
publicados. Os projetos mantêm apenas o ID/link editorial do vídeo relacionado.

## D1, migrations e legado preservado

O binding lógico é `DB`, definido em `.openai/hosting.json`. As migrations
`0000`, `0001` e `0002` continuam aditivas e testadas em sequência. Nenhuma
migration destrutiva foi criada nesta simplificação.

Tabelas ativas incluem `owner_accounts`, `owner_actions`, `content_entries`,
`wall_categories`, `wall_topics`, `wall_replies`, `wall_reports`, `wall_blocks`,
`rate_limits`, `youtube_channel_state` e `youtube_sync_runs`.

Tabelas preservadas somente como legado ou compatibilidade:

- comunidade antiga: `profiles`, `community_topics`, `community_replies`,
  `community_reports`, `moderation_actions`;
- YouTube antigo: `youtube_snapshots` e `youtube_videos`.

Elas só devem ser removidas por uma migration separada depois de backup remoto e
aprovação do proprietário.

## Projetos, história, Mural e Telegram

`/projetos` unifica reviews, garimpos e reparos em registros editoriais com
produto, imagem, tipo, valores, problema, reparo, resultado, situação e link
direto para o YouTube. A linha do tempo de `/sobre` continua editável no painel;
quando não há marcos aprovados, o site mostra um único texto factual e um aviso
de conteúdo pendente de revisão.

O Mural não possui cadastro, conta, perfil, e-mail, senha, magic link ou edição
pública. Ele mantém nome informado, categoria, tópico, resposta, denúncia,
pesquisa e ordenação. Publicação normal é automática; conteúdo suspeito fica
pendente; spam é separado. Turnstile, honeypot, origem, limites atômicos, nomes
reservados e hash com salt protegem as escritas. A moderação é exclusiva do
proprietário e usa soft delete como padrão.

Canal e grupo do Telegram aparecem na home, Mural e rodapé. Somente URLs HTTPS
oficiais são aceitas; valor ausente aparece como “Em breve”, sem link quebrado.

## Intro oficial

Assets preparados localmente, nunca em runtime:

```text
public/intro/imports-tech-intro.mp4
public/intro/imports-tech-intro.webm
public/intro/imports-tech-intro-poster.webp
public/intro/imports-tech-intro-final.webp
```

Conversões feitas com FFmpeg:

```text
MP4:  H.264, preset slow, CRF 21, yuv420p, faststart, AAC 128 kb/s, 48 kHz
WebM: VP9, CRF 31, b:v 0, row-mt/tile-columns, Opus 96 kb/s
Poster: frame em 0,04 s, WebP qualidade 82
Final:  frame em 4,83 s, WebP qualidade 90
```

O vídeo-fonte tem aproximadamente 4,907 s, 1280×720, cerca de 24 FPS e áudio
AAC. A intro automática é muda, `playsInline`, uma vez por sessão pela chave
`imports-tech:intro:v3`, pulável por botão ou Escape e possui timeout de oito
segundos. Ela não roda com movimento reduzido, Save-Data ou 2G. A página real já
está renderizada atrás do overlay.

A transição usa `object-fit: cover` e calcula:

```text
scale = max(viewportWidth / 1280, viewportHeight / 720)
offsetX = (viewportWidth - 1280 * scale) / 2
offsetY = (viewportHeight - 720 * scale) / 2
```

A caixa da marca no frame-fonte (`x=468`, `y=263`, `344×193`) é convertida para
o viewport. No fim, Web Animations move essa cópia para o retângulo real obtido
por `data-intro-logo-target.getBoundingClientRect()`. Os anéis fazem a mesma
troca visual em direção a `data-intro-orbit-target`. O frame final sustenta a
continuidade enquanto vídeo e overlay desaparecem. Há fallback por
`timeupdate`, `ended`, erro e timeout. A página História oferece replay e replay
com som após interação.

## Ativação segura

1. Faça backup do D1 remoto.
2. Confirme a ordem e o estado das migrations.
3. Configure os Secrets sem registrá-los em logs.
4. Valide o snapshot do canal e os links do Telegram no ambiente de homologação.
5. Homologue Mural, painel, editorial e intro separadamente.
6. Ative cada flag somente depois de aprovação explícita.

O repositório local não comprova, por si só, Secrets ou dados remotos. Nunca
descreva a API como sincronizada sem uma chamada remota bem-sucedida.
