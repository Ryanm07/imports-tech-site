# Imports Tech — site oficial

Portal do canal brasileiro Imports Tech, com catálogo pesquisável de vídeos,
reviews, histórias de garimpos e reparos, métricas públicas e recursos beta de
comunidade e administração.

## Stack

- Next.js 16, React 19 e TypeScript;
- Vinext/Vite em Cloudflare Workers;
- Cloudflare D1 e Drizzle para dados persistentes;
- autenticação “Sign in with ChatGPT” gerenciada pela hospedagem;
- CSS próprio com a identidade azul-marinho e amarela do canal.

O site público continua usando o conteúdo editorial versionado quando YouTube,
D1 ou painel estão indisponíveis. Não há cookies próprios de publicidade ou
analytics.

## Instalação e validação

Requer Node.js 22.13 ou superior.

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Use `npm.cmd` no PowerShell se a política local bloquear `npm.ps1`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e nunca versione valores reais.

| Variável             | Função                                                        |
| -------------------- | ------------------------------------------------------------- |
| `YOUTUBE_API_KEY`    | Ativa a YouTube Data API v3 no servidor.                      |
| `YOUTUBE_CHANNEL_ID` | ID do canal; há um fallback versionado.                       |
| `COMMUNITY_ENABLED`  | Ativa a comunidade beta somente após homologação.             |
| `ADMIN_ENABLED`      | Ativa painel, moderação e conteúdo vindo do D1.               |
| `ADMIN_EMAILS`       | Permite exclusivamente o bootstrap do primeiro administrador. |
| `RATE_LIMIT_SALT`    | Salt privado e longo para anonimizar chaves de rate limit.    |
| `ALLOWED_ORIGINS`    | Origens HTTPS adicionais confiáveis, separadas por vírgula.   |
| `SITE_URL`           | Origem canônica HTTPS validada.                               |

As flags devem permanecer assim até aprovação explícita:

```env
COMMUNITY_ENABLED=false
ADMIN_ENABLED=false
```

## YouTube

Com chave, `/api/youtube` consulta a playlist de uploads, percorre todos os
`nextPageToken`, busca estatísticas em lotes de até 50 IDs e preserva a ordem do
canal. O resultado é salvo em snapshot D1 e mantido em cache de memória. Há
timeout, validação de status HTTP e sinalização de sincronização parcial.

Sem chave, o feed XML público fornece somente o recorte recente. Se ele falhar,
o site usa o último snapshot persistente ou o retrato versionado, sem scraping de
páginas HTML. A resposta sempre informa `source`, `isStale`, `isPartial`,
`lastSuccessfulSyncAt` e `syncedAt`.

## D1 e migrations

O binding lógico `DB` está em `.openai/hosting.json`.

- `0000_pink_power_man.sql` é a migration inicial que acompanhava a versão no
  commit `2335651`;
- `0001_privacy-hardening.sql` é a migration corretiva e não altera a migration
  anterior;
- o teste local aplica `0000`, insere dados legados, aplica `0001`, executa
  `foreign_key_check` e valida índices, unicidade e preservação de registros;
- a migration nova substitui referências públicas por IDs aleatórios, mantém o
  e-mail apenas em `profiles`, remove PII da auditoria e descarta chaves antigas de
  rate limit que podiam conter e-mail.

O repositório não possui acesso direto de inspeção ao estado remoto do D1. Antes
de ativar qualquer flag, confirme no ambiente de homologação que a hospedagem
registrou a aplicação sequencial das duas migrations e faça backup conforme a
política operacional do projeto.

Depois de mudar `db/schema.ts`, gere uma nova migration, revise o SQL e nunca
reescreva uma migration já aplicada:

```bash
npm run db:generate
```

## Privacidade e autorização

Perfis possuem ID público aleatório, e-mail privado único, nome público, papel e
estado. APIs públicas retornam DTOs explícitos; tópicos, respostas e denúncias não
expõem e-mail nem dados administrativos.

A allowlist serve somente para criar o primeiro administrador quando ainda não
existe nenhum. Depois disso, `user`, `moderator` e `admin` são papéis persistidos
no D1. Moderadores atuam em conteúdo e denúncias; administradores também gerenciam
papéis e configurações. Autoalteração de papel e remoção do último administrador
são recusadas e as mudanças são auditadas.

Escritas usam validação de origem completa, `Sec-Fetch-Site` quando disponível,
sanitização, schemas por tipo de conteúdo e rate limit atômico. Respostas
administrativas e autenticadas usam `Cache-Control: private, no-store`.

A conta da comunidade pode ser anonimizada pela interface: e-mail e nome público
são substituídos, enquanto conteúdo e auditoria sem PII podem ser preservados para
integridade das conversas. Um administrador precisa transferir seu papel antes.

**Revisão jurídica obrigatória:** a Política de Privacidade descreve o
comportamento técnico implementado, mas deve passar por revisão jurídica antes da
ativação pública da comunidade, especialmente quanto a base legal, retenção,
transferência internacional e atendimento de direitos.

## Conteúdo e administração

As páginas públicas usam uma única camada de repositório:

- `getPublishedReviews()`;
- `getPublishedFinds()`;
- `getPublishedCategories()`;
- `getFeaturedVideos()`;
- `getSiteSettings()`.

Com `ADMIN_ENABLED=true`, registros publicados e validados do D1 substituem o
fallback por slug ou nome. Se o D1 falhar, o conteúdo versionado continua
disponível. O painel oferece rascunho, validação, edição, prévia, publicação,
arquivo, destaque, remoção lógica, denúncias, restauração, bloqueio, banimento,
papéis e histórico.

## Estrutura

- `app/`: páginas, metadados e APIs;
- `components/`: cabeçalho, rodapé, cards, comunidade e painel;
- `lib/`: repositórios, segurança, conteúdo, busca e YouTube;
- `db/`: schema e acesso D1;
- `drizzle/`: migrations versionadas;
- `public/brand/`: logo e banner oficiais;
- `tests/`: unidade, integração controlada e migration SQLite.

## Publicação segura

1. Execute a validação completa em instalação limpa.
2. Publique com as duas flags desligadas.
3. Confirme rotas, headers, APIs, bundle, imagens, SEO e responsividade.
4. Em ambiente separado, aplique e verifique migrations antes de testar as flags.
5. Valide moderação, anonimização e papéis com contas de teste.
6. Só então peça aprovação explícita para alterar as flags.

Segredos e flags de produção pertencem ao gerenciador de ambiente da hospedagem,
nunca ao repositório.
