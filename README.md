# Imports Tech — site oficial

Portal do canal brasileiro Imports Tech, com biblioteca pesquisável de vídeos, reviews, histórias de garimpos e reparos, métricas públicas, busca global e recursos beta de comunidade e administração.

## Stack

- Next.js 16 + React 19 + TypeScript
- Vinext/Vite para execução em Cloudflare Workers
- Cloudflare D1 + Drizzle para dados persistentes da comunidade e administração
- Autenticação “Sign in with ChatGPT” gerenciada pela hospedagem
- CSS próprio com tokens derivados da logo oficial (`#ffb915`, `#011226`)

O projeto não usa bibliotecas grandes de animação, cookies de publicidade ou analytics. A interface pública continua funcional quando YouTube, banco ou comunidade estão indisponíveis.

## Requisitos e instalação

- Node.js 22.13 ou superior

```bash
npm install
npm run dev
```

No Windows PowerShell, caso a política de execução bloqueie `npm.ps1`, use `npm.cmd`.

## Comandos

```bash
npm run dev          # desenvolvimento
npm run typecheck    # tipos TypeScript
npm run lint         # lint
npm test             # build + testes críticos
npm run build        # build Cloudflare Worker
npm run db:generate  # gera migração D1 após mudanças no schema
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nunca versione valores reais.

| Variável | Obrigatória | Função |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Não | Ativa a YouTube Data API v3 no servidor. Sem ela, o site usa o feed público. |
| `YOUTUBE_CHANNEL_ID` | Não | ID do canal; o código mantém o ID oficial como fallback. |
| `COMMUNITY_ENABLED` | Não | `true` ativa a comunidade beta e as rotas de escrita. |
| `ADMIN_ENABLED` | Não | `true` ativa o painel e a API administrativa. |
| `ADMIN_EMAILS` | Para admin | Lista de e-mails administrativos separados por vírgula. |
| `SITE_URL` | Produção | URL canônica do site. |

Valores de produção devem ser configurados na hospedagem Sites, nunca em arquivos versionados.

## Integração com o YouTube

`/api/youtube` executa somente no servidor. A estratégia é:

1. usar a YouTube Data API quando `YOUTUBE_API_KEY` está configurada;
2. usar o feed público da playlist do canal quando não há chave;
3. manter um retrato editorial versionado caso o YouTube falhe;
4. enviar cache público curto e atualizar o frontend em intervalos controlados;
5. pesquisar localmente no navegador, sem chamar a API a cada tecla.

A chave nunca é enviada ao cliente. O feed público fornece vídeos recentes; duração e métricas indisponíveis usam rótulos/fallbacks claros.

## Banco D1 e migrations

O binding lógico `DB` está declarado em `.openai/hosting.json`. O schema em `db/schema.ts` contém:

- `profiles`: identidade mínima, papel e estado do participante;
- `community_topics` e `community_replies`: fórum com soft delete;
- `community_reports`: denúncias;
- `moderation_actions`: auditoria administrativa;
- `content_entries`: reviews, garimpos, destaques, categorias e configurações editáveis;
- `rate_limits`: limitação de escrita por identidade e janela.

Depois de alterar o schema:

```bash
npm run db:generate
```

Revise o SQL em `drizzle/` antes de publicar. A hospedagem aplica migrations versionadas ao recurso D1 vinculado.

## Comunidade beta

A comunidade usa a autenticação da própria plataforma, equivalente ao login externo necessário para este ambiente. Não foi adicionado Supabase porque o projeto já oferece autenticação e banco persistente integrados, evitando duas fontes de identidade.

Proteções implementadas:

- autenticação conferida novamente no servidor;
- autorização administrativa por allowlist no servidor;
- validação e sanitização para texto simples;
- proteção de mesma origem para escritas;
- limite de tamanho e quantidade de links;
- rate limiting persistente;
- papéis `user`, `moderator` e `admin`;
- estados `pending`, `published`, `hidden` e `removed`;
- soft delete, denúncias e histórico de moderação;
- prazo de 30 minutos para editar o próprio tópico.

Quando `COMMUNITY_ENABLED` não é `true`, a página mostra “Comunidade em breve” e todas as APIs de comunidade recusam gravações.

## Primeiro administrador

1. Confirme que a migração D1 foi revisada e aplicada.
2. Configure `ADMIN_EMAILS` com o e-mail da conta usada no “Sign in with ChatGPT”.
3. Ative `ADMIN_ENABLED=true`.
4. Acesse `/admin` e entre com a conta permitida.

Mostrar ou esconder botões não concede permissão: cada operação em `/api/admin/*` verifica identidade e allowlist no servidor e registra a ação.

## Estrutura principal

- `app/`: páginas, metadados e APIs
- `components/`: cabeçalho, rodapé e cards reutilizáveis
- `lib/`: conteúdo editorial, busca, segurança, rate limit e autorização
- `db/`: schema e acesso D1
- `drizzle/`: migrations versionadas
- `public/brand/`: logo e banner oficiais do canal
- `tests/`: testes de renderização, busca, sanitização e proteção de rotas

## Teste manual

1. Abra a home em desktop e celular.
2. Use `Ctrl/Cmd + K` e navegue nos resultados com as setas.
3. Pesquise e filtre a biblioteca em `/videos`.
4. Abra um review e um garimpo e valide breadcrumbs e vídeo relacionado.
5. Simule falha de rede: as áreas dinâmicas devem exibir fallback ou opção de tentar novamente.
6. Com as flags desligadas, confirme as mensagens seguras em `/comunidade` e `/admin`.
7. Ative `prefers-reduced-motion`: os nós orbitais devem ficar estáticos.

## SEO e privacidade

O site inclui títulos por página, canonical, Open Graph, Twitter Card, sitemap, robots, JSON-LD de organização/review, breadcrumbs, 404 e erro coerentes. Não há notas de usuários inventadas, analytics ou rastreamento de publicidade. Páginas de privacidade, termos, afiliados e contato estão disponíveis no rodapé.

## Deploy

O build gera um Worker compatível com Cloudflare/Sites. Na hospedagem atual, o fluxo é: validar, versionar a fonte, empacotar `dist/` com `.openai/hosting.json` e migrations, salvar uma versão e publicar. Segredos e flags de produção são configurados pelo gerenciador de ambiente do Sites.

## Limitações reais

- A comunidade e o painel ficam desativados até a aprovação das flags e da allowlist.
- O catálogo público sem chave usa o limite de itens do feed do YouTube; a API v3 amplia a sincronização.
- Notas e custos não publicados pelo canal aparecem como “não informado” e precisam de curadoria administrativa.
- A contagem “produtos mapeados” e “garimpos catalogados” é editorial e aparece identificada como estimativa até o banco de conteúdo ser preenchido.
