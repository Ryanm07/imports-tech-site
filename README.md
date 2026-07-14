# Imports Tech — site oficial

Portal do canal Imports Tech com biblioteca de vídeos, reviews, garimpos,
métricas públicas, Mural da Comunidade anônimo, painel privado do proprietário e
sincronização persistente com a API oficial do YouTube.

## Stack

- Next.js 16, React 19, TypeScript e Vinext/Vite;
- Cloudflare Workers, D1, Drizzle e Scheduled Events;
- CSS próprio, preservando a identidade azul-marinho e amarela do canal;
- Cloudflare Turnstile nas escritas públicas do Mural;
- autenticação da hospedagem apenas na rota privada `/admin`.

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

## Flags e segredos

Copie `.env.example` para `.env.local` apenas no desenvolvimento. Valores reais
pertencem ao gerenciador de segredos da hospedagem e nunca ao repositório.

As quatro flags de produção permanecem explicitamente desligadas:

```env
COMMUNITY_ENABLED=false
ADMIN_ENABLED=false
EDITORIAL_DB_ENABLED=false
INTRO_ENABLED=false
```

| Variável                         | Uso                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `YOUTUBE_API_KEY`                | Chave server-side da YouTube Data API v3. Nunca vai para URL, JSON público ou bundle cliente. |
| `YOUTUBE_CHANNEL_ID`             | ID oficial do canal.                                                                          |
| `OWNER_EMAILS`                   | Allowlist privada e fonte de recuperação do proprietário.                                     |
| `RATE_LIMIT_SALT`                | Segredo aleatório com pelo menos 24 caracteres para o hash de origem.                         |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Chave pública do widget Turnstile.                                                            |
| `TURNSTILE_SECRET_KEY`           | Segredo server-side de validação Turnstile.                                                   |
| `TELEGRAM_CHANNEL_URL`           | Link HTTPS opcional para `t.me`/`telegram.me`.                                                |
| `TELEGRAM_GROUP_URL`             | Link HTTPS opcional para `t.me`/`telegram.me`.                                                |
| `ALLOWED_ORIGINS`                | Origens HTTPS adicionais confiáveis, separadas por vírgula.                                   |
| `SITE_URL`                       | Origem canônica; nunca é usada como salt.                                                     |

Sem salt, chave pública ou segredo do Turnstile, as escritas do Mural falham
fechadas. O site público continua disponível.

### Como obter a chave do YouTube

1. No Google Cloud Console, crie ou selecione um projeto.
2. Ative **YouTube Data API v3**.
3. Crie uma API key e restrinja-a à API do YouTube e ao ambiente do Worker.
4. Salve-a como segredo `YOUTUBE_API_KEY` na hospedagem.
5. Não coloque a chave em `NEXT_PUBLIC_*`, `.env.example`, links ou logs.

## YouTube persistente

Visitantes nunca consultam Google ou feed do YouTube. `/api/youtube` lê somente
o D1; se ele ainda não estiver populado, usa um snapshot versionado e marcado
como histórico.

A sincronização:

- percorre todos os `nextPageToken` da playlist de uploads;
- deduplica IDs, busca detalhes em lotes de até 50 e preserva a ordem;
- mantém vídeos ausentes como `unavailable`, sem apagar metadados editoriais;
- faz upsert sem sobrescrever categoria, tags, resumo, destaque ou relações;
- registra tentativa, sucesso, erro, modo, contagens e lock concorrente;
- usa `X-Goog-Api-Key`, não query string;
- tenta o feed somente dentro do job, como catálogo parcial de contingência.

Freshness de catálogo e métricas é independente:

- `videoCatalogSource`, `videoCatalogUpdatedAt`, `videoCatalogPartial`,
  `videoCatalogStale`, `indexedVideoCount`;
- `channelMetricsSource`, `channelMetricsUpdatedAt`, `channelMetricsStale`.

Crons configurados:

```text
0 * * * *     incremental a cada hora
15 3 * * *   completa diariamente às 03:15 UTC
```

O proprietário também pode usar **Sincronizar agora** ou **Sincronização
completa** no painel.

## D1 e migrations

O binding lógico é `DB`, definido em `.openai/hosting.json`.

- `0000_pink_power_man.sql`: schema inicial legado;
- `0001_privacy-hardening.sql`: hardening anterior;
- `0002_owner_wall_youtube.sql`: migration aditiva para owner, Mural e YouTube.

A `0002` não remove tabelas nem dados legados. Ela cria:

- `owner_accounts`, `owner_actions`;
- `wall_categories`, `wall_topics`, `wall_replies`, `wall_reports`,
  `wall_blocks`;
- `youtube_channel_state`, `youtube_videos`, `youtube_sync_runs`.

O teste automatizado aplica `0000 → 0001 → 0002` sobre banco vazio e também
com dados legados, executa `foreign_key_check` e verifica preservação. Antes de
ativar flags em homologação, faça backup e aplique as migrations na ordem.

## Mural da Comunidade

Não há login, conta, perfil ou e-mail público. O visitante informa nome,
categoria, título e mensagem; respostas e denúncias usam o mesmo modelo simples.
O nome aparece como **Nome informado pelo visitante** e não é verificado.

Proteções implementadas:

- nomes reservados e variações do canal/proprietário/administração;
- normalização Unicode, texto simples, limites de tamanho e de links;
- Turnstile server-side, honeypot e validação de origem;
- rate limits atômicos: 3 tópicos/h, 12 respostas/h e 10 denúncias/h;
- tentativas inválidas consomem limite;
- hash SHA-256 da origem com salt privado; IP simples não é persistido;
- detecção de duplicação, URLs suspeitas, repetição, spam e XSS;
- publicação normal automática; suspeita pendente; spam separado.

O painel owner-only permite pesquisar e filtrar, ocultar, restaurar, remover,
marcar spam, excluir definitivamente com confirmação reforçada, fixar, mover,
encerrar/reabrir, responder oficialmente, gerir categorias, tratar denúncias e
bloquear/encerrar bloqueio de hash. O contador de respostas é recalculado após
ações de moderação.

## Owner e conteúdo editorial

`OWNER_EMAILS` é revalidado no servidor em todo acesso privado e restaura a
conta protegida se necessário. A aplicação não oferece ação para remover,
rebaixar ou bloquear o proprietário e não devolve seu e-mail nas APIs do painel.

`ADMIN_ENABLED` controla somente o painel. `EDITORIAL_DB_ENABLED` controla a
leitura pública do D1 editorial. Registros `archived` e `removed` são tombstones:
eles impedem que o fallback versionado de mesmo slug reapareça. Se o D1 falhar, o
conteúdo versionado continua disponível.

O painel edita reviews, garimpos, vídeos editoriais, categorias, configurações,
destaques e marcos da trajetória. URLs do Telegram também podem ser publicadas
como settings `telegram_channel_url` e `telegram_group_url`.

## Intro e marca

Os caminhos oficiais de marca ficam em `lib/brand.ts`. Não há redesenho do logo.

A intro está preparada, mas desligada e sem arquivos versionados. Para homologar,
adicione externamente:

```text
public/intro/imports-tech-intro.webm
public/intro/imports-tech-intro.mp4
public/intro/imports-tech-intro-poster.webp
```

Ela é `muted`, `playsInline`, uma vez por sessão, pulável, fecha com Escape,
possui timeout, respeita movimento reduzido/economia de dados/conexão lenta e
mantém o DOM principal disponível. Com flag desligada ou arquivos ausentes, o
site abre normalmente.

## Estrutura

- `app/`: páginas, metadados e APIs;
- `components/`: interface pública, Mural, intro e painel;
- `lib/`: conteúdo, segurança, Telegram, marca e YouTube;
- `db/`: schema e bindings D1;
- `drizzle/`: migrations e snapshots;
- `public/brand/`: logo e banner oficiais;
- `tests/`: unidade, segurança, integração controlada e migrations.

## Ativação segura

1. Faça backup do D1 remoto.
2. Aplique `0000`, `0001` e `0002` conforme o estado do ambiente.
3. Configure os segredos sem registrá-los em logs.
4. Rode a sincronização completa do YouTube e confira o painel de saúde.
5. Valide Telegram e, se desejado, envie os arquivos externos da intro.
6. Homologue Mural, owner e editorial em ambiente separado.
7. Ative cada flag somente após aprovação explícita.

O estado remoto do D1, os segredos reais, os links do Telegram e os arquivos da
intro não são validados pelo repositório local.
