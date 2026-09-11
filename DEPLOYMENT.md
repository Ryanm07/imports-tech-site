# Publicação do Imports Tech Studio

O projeto mantém dois destinos de build. O estúdio, as páginas públicas, os links de vídeos e o contato funcionam nos dois.

| Destino                     | Build                  | Servidor local de produção |
| --------------------------- | ---------------------- | -------------------------- |
| Cloudflare / Sites (Vinext) | `npm run build`        | `npm start`                |
| Vercel (Next.js)            | `npm run build:vercel` | `npm run start:vercel`     |

`vercel.json` seleciona Next.js, instala com `npm ci` e usa o build separado. Nenhum serviço pago ou banco novo é necessário para publicar a experiência pública. A publicação não inclui modelos 3D definitivos: a geometria atual serve para validar navegação, iluminação e interação.

## Diferenças entre os ambientes

No Cloudflare, `db/runtime.ts` continua recebendo o binding D1 `DB` e a autenticação verificada pelo proxy Sites. O Worker conserva sua sincronização agendada do YouTube. As migrações e o código editorial existentes permanecem no projeto.

Na Vercel, o alias de build substitui esse módulo por `db/runtime-node.ts`. Não existe acesso ao D1 da hospedagem anterior. O conteúdo usa os dados versionados. As métricas conferidas manualmente no canal oficial declaram `source: "snapshot"` e a data real da consulta. Depois de 12 horas, a página e a API omitem os números e indicam `source: "unavailable"`. A Vercel ainda não faz sincronização automática do YouTube.

O painel e as APIs privadas permanecem fechados sem um backend confiável: as APIs respondem `503`, inclusive se `ADMIN_ENABLED=true` for configurado por engano. Headers `oai-authenticated-user-*` enviados diretamente à Vercel nunca autenticam o proprietário. A autenticação Sites depende do proxy da hospedagem original e não deve ser simulada na Vercel.

Para habilitar edição privada e sincronização na Vercel, uma etapa posterior precisa conectar um banco persistente, um provedor real de autenticação e um agendamento compatível. Não usar SQLite em disco temporário de funções nem aceitar headers de identidade enviados pelo visitante. Esta publicação não altera nem migra dados do D1 original.

## Configuração pública

- `SITE_URL`: origem HTTPS definitiva; opcional na Vercel quando `VERCEL_PROJECT_PRODUCTION_URL` estiver disponível. O domínio de produção da Vercel é validado e usado como fallback para canonical, sitemap e robots. Um domínio próprio explícito tem prioridade.
- `COMMERCIAL_CONTACT_EMAIL`: opcional; o contato público padrão é `imports.tech.contact@gmail.com`.
- `ADMIN_ENABLED=false` e `EDITORIAL_DB_ENABLED=false`: valores adequados para a publicação pública na Vercel.
- Chaves do YouTube e credenciais privadas são apenas variáveis de servidor, nunca `NEXT_PUBLIC_*`, argumentos públicos de build ou arquivos versionados.

O build verifica os arquivos públicos produzidos em busca de padrões de segredo do YouTube. A configuração Next também preserva CSP e os headers de segurança usados pelo Worker.

## Verificação antes de publicar

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build:vercel
npm run verify:vercel
```

`verify:vercel` inicia temporariamente um servidor Next de produção em `127.0.0.1:4301`. Verifica cinco páginas públicas, contato, headers, a origem e a validade das métricas e quatro tentativas de acesso às APIs privadas com headers de identidade falsificados. O processo de teste é encerrado ao terminar.

Os builds Vinext e Next geram diretórios diferentes (`dist/` e `.next/`). Configurações e credenciais locais de deploy em `.vercel/`, `.env*` e `.wrangler/` continuam ignoradas pelo Git.
