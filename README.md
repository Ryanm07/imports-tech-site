# Imports Tech — estúdio interativo

Estado revisado em 11 de setembro de 2026.

O site abre diretamente em um estúdio 3D, sem vídeo de introdução. A experiência
inclui visão geral, caminhada opcional por câmera, iluminação clara/escura,
objetos clicáveis, lista acessível e barra lateral para alcançar os controles em
telas baixas. A escolha de iluminação é salva no dispositivo.

Os modelos são provisórios. Modelagem fiel, materiais definitivos, efeitos de
inspeção, clipes e a fotografia dos mil inscritos continuam para uma etapa futura.
Esta revisão de conteúdo não altera geometria, câmera, controles ou barra lateral.

## Publicação e rotas

A versão pública está na [Vercel](https://imports-tech-site.vercel.app/).
[DEPLOYMENT.md](DEPLOYMENT.md) descreve os dois ambientes suportados e seus limites.

- `/`: estúdio 3D; objetos definidos em `lib/studio-content.ts`.
  O Buds 4 Pro preto usa o GLB em `public/models/`. Clique no estojo (ou use
  a lista de objetos) para abrir e fechar somente a tampa; os fones continuam
  encaixados. Movimento reduzido troca a posição da tampa sem animação.
- `/sobre`: história em um percurso ilustrado, com estrada elástica que responde
  ao cursor, rolagem nativa e links para marcos antigos. No celular, a estrada
  acompanha o texto pela lateral; movimento reduzido mantém o desenho estático.
  O texto atual está em `lib/about-story.ts`. Não carrega `StoryExperience` nem
  o CSS da antiga navegação por capítulos.
- `/metricas`: números com fonte, data e validade, ou link para consultá-los no canal.
- `/comunidade`: YouTube e links do Telegram somente quando configurados e válidos.
- `/contato`: e-mail oficial; Media Kit somente quando configurado.
- `/privacidade`, `/termos` e `/afiliados`: informações de transparência.

Rotas antigas de vídeos, reviews e garimpos redirecionam para os destinos ativos.
Com `PROJECTS_ENABLED=false`, `/projetos` redireciona para `/sobre`.
Não há fórum, contas públicas, catálogo de uploads, publicação anônima ou moderação
na experiência ativa. A home anterior não está montada.

## Dados e manutenção

Fatos pessoais vêm do relato de Ryan. Datas incertas não são completadas por
inferência. O marco de cinco mil inscritos é histórico, não um contador atual.
Os links de episódios do texto foram conferidos no canal oficial.

Em 11/09/2026, a página pública do YouTube foi conferida manualmente: 5,16 mil
inscritos (arredondados pelo YouTube), 92 vídeos e 1.093.813 visualizações.
O registro em `lib/youtube-service.ts` declara `source: "snapshot"`, a hora real da
consulta e nenhuma sincronização fictícia da API. Após 12 horas, seus números
ficam indisponíveis na página e na API; o visitante pode consultar o canal.
A data de consulta nunca é renovada só porque houve um build ou acesso.

Na hospedagem Cloudflare, quando configurados, D1 e cron atualizam métricas pela
YouTube Data API v3 (`channels.list`, `snippet,statistics`). Esse fluxo não está
ativo na Vercel: a atualização automática depende de uma integração posterior.
Não há scraping automático ou importação de uploads.

O e-mail da home, do rodapé e do contato passa por `getPublicLinks`.
Sitemap registra datas de alterações reais; páginas legais sem mudanças preservam
suas datas. O cartão social compartilhado é `public/og-studio.png`, gerado com
`npx tsx scripts/generate-social-card.tsx`.

## Configuração

Configuração pública de servidor: `SITE_URL`, `YOUTUBE_CHANNEL_ID`,
`TELEGRAM_GROUP_URL`, `TELEGRAM_CHANNEL_URL`, `MEDIA_KIT_URL` e
`COMMERCIAL_CONTACT_EMAIL`. O e-mail padrão é `imports.tech.contact@gmail.com`.
Links inválidos não viram destinos públicos. Media Kit exige HTTPS; Telegram exige
HTTPS em `t.me` ou `telegram.me`.

`YOUTUBE_API_KEY` e `OWNER_EMAILS` são exclusivos do servidor. Nunca usar
`NEXT_PUBLIC_*` para segredos.

- `ADMIN_ENABLED=false` e `EDITORIAL_DB_ENABLED=false`: configuração pública da Vercel.
- `PROJECTS_ENABLED=false`: projetos e navegação correspondente desativados.
- `INTRO_ENABLED`: compatibilidade legada; não ativa uma introdução na home atual.

## Backend legado e documentos históricos

O painel editorial depende do proxy confiável Sites/Cloudflare, da allowlist e do
D1. Na Vercel, as APIs privadas respondem `503` mesmo que flags sejam ligadas por
engano; headers de identidade enviados pelo visitante não concedem acesso.

O cadastro de timeline em `lib/story.ts`, seus componentes visuais e dados no D1
foram preservados como legado. O painel antigo não edita a nova página `/sobre`.
Estados editoriais: `draft`, `review`, `reviewed`, `published`, `archived`.
Somente entradas publicadas são exibidas pelas rotas que usam o repositório.
Não há migração ou exclusão de dados nesta revisão.

[CURRENT_IMPLEMENTATION_AUDIT.md](CURRENT_IMPLEMENTATION_AUDIT.md) e
[DESIGN_REFORMULATION.md](DESIGN_REFORMULATION.md) registram versões anteriores;
não descrevem a experiência publicada hoje.

## Desenvolvimento e validação

```text
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build:vercel
npm run verify:vercel
npm run build
```

Next/Vercel produz `.next/`; Vinext/Cloudflare produz `dist/`. Ambos os builds
examinam os arquivos públicos em busca de chaves do YouTube. Segredos locais,
artefatos de auditoria e diretórios de deploy não devem ser publicados.
