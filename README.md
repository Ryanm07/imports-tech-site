# Imports Tech — site oficial

Site pessoal de Ryan e do canal Imports Tech. A experiência pública apresenta
a história do canal, métricas públicas do YouTube, espaços externos da
comunidade e contato comercial.

## Arquitetura pública

Rotas principais:

- `/` — apresentação, métricas, história curta, marcos, comunidade e empresas;
- `/sobre` — narrativa visual completa em primeira pessoa;
- `/comunidade` — links oficiais para Telegram e YouTube;
- `/metricas` — metodologia e retrato público do canal;
- `/contato` — contato comercial e Media Kit quando configurados.

As rotas antigas `/videos`, `/reviews` e `/garimpos` existem somente para
redirecionar visitantes e links antigos. Detalhes de vídeos válidos redirecionam
para o YouTube. URLs antigas de tópicos da comunidade redirecionam para
`/comunidade`.

Com `PROJECTS_ENABLED=false`, `/projetos` também redireciona para a história;
os dados editoriais permanecem preservados para uma possível reativação.

Não existe catálogo público de vídeos, busca de uploads, fórum, mural,
publicação anônima, contas públicas, denúncias ou moderação na experiência
ativa.

## Regra editorial

Conteúdo pessoal, histórico e de projeto é escrito em primeira pessoa, como uma
conversa direta de Ryan com o visitante. Fatos, datas e números não são
completados por inferência. Conteúdo ainda não confirmado deve permanecer em
`draft`, `review` ou `reviewed`; somente `published` chega ao site público.

O painel aceita os estados:

- `draft` — Rascunho;
- `review` — Aguardando revisão;
- `reviewed` — Revisado;
- `published` — Publicado;
- `archived` — Arquivado.

## Métricas do YouTube

A integração usa exclusivamente `channels.list` da YouTube Data API v3 com
`snippet,statistics`. A chave `YOUTUBE_API_KEY` existe apenas no servidor. Não
há `videos.list`, importação de uploads, feed, scraping, paginação ou taxonomia
automática.

O snapshot válido fica no D1 e é atualizado pelo cron a cada seis horas. Uma
falha registra a tentativa, mas preserva tanto o último retrato válido quanto a
data do último sucesso. A sincronização manual é restrita ao proprietário.

## Variáveis

Segredos de servidor:

- `YOUTUBE_API_KEY`;
- `OWNER_EMAILS`.

Configuração pública de servidor:

- `YOUTUBE_CHANNEL_ID`;
- `SITE_URL`;
- `TELEGRAM_GROUP_URL`;
- `TELEGRAM_CHANNEL_URL`;
- `MEDIA_KIT_URL`;
- `COMMERCIAL_CONTACT_EMAIL`.

Flags, sempre desativadas até homologação explícita:

- `ADMIN_ENABLED=false`;
- `EDITORIAL_DB_ENABLED=false`;
- `INTRO_ENABLED=false`;
- `PROJECTS_ENABLED=false` mantém reviews e garimpos preservados no painel, mas fora da experiência pública.

`MEDIA_KIT_URL` aceita somente HTTPS. Telegram aceita somente HTTPS nos hosts
`t.me` e `telegram.me`. Ausência ou valor inválido resulta em “Em breve”.

## Painel privado

`/admin` é autorizado no servidor por identidade autenticada e
`OWNER_EMAILS`. O cliente nunca recebe a allowlist nem a chave do YouTube. O
painel ativo contém apenas conteúdo editorial, configurações, projetos,
categorias, história, links, estado da intro e sincronização sanitizada das
métricas públicas.

## Dados legados preservados

As migrations existentes são aditivas. Nenhuma migration destrutiva faz parte
desta revisão. Permanecem no schema remoto, sem rota ou componente público:

- mural: `wall_categories`, `wall_topics`, `wall_replies`, `wall_reports`, `wall_blocks`;
- comunidade anterior: `profiles`, `community_topics`, `community_replies`, `community_reports`, `moderation_actions`;
- catálogo antigo do YouTube: `youtube_snapshots`, `youtube_videos`.

Essas tabelas só podem ser removidas em uma migration separada, depois de
backup verificável e aprovação explícita do proprietário.

## Desenvolvimento e validação

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm audit --omit=dev
```

O build também examina o bundle público e falha se encontrar um valor com o
formato de chave da API do YouTube ou o segredo real fornecido ao processo.
