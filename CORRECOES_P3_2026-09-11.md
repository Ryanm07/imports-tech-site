# Correções de conteúdo e P3 — 11 de setembro de 2026

Esta entrega resolve A09, A10 e A11 da auditoria, além da simplificação da
história e da revisão de dados solicitadas por Ryan. Os demais itens da auditoria
continuam separados desta etapa.

- **A09:** README descreve a versão ativa e os limites de cada hospedagem.
  A auditoria de julho está identificada como histórica; a intro e o cadastro
  visual antigo não são apresentados como recursos ativos da home.
- **A10:** descrição e cartão social apresentam o estúdio. Sitemap usa datas
  reais de revisão e preserva as datas das páginas legais que não mudaram.
- **A11:** o menu da home recebe o e-mail da mesma função usada pelas demais
  páginas. Não houve alteração na cena, câmera, movimentação ou barra lateral.
- **História:** sete momentos curtos, leitura comum, âncoras antigas preservadas,
  marco de cinco mil incluído sem inventar uma data exata. A foto dos mil é
  mencionada sem acrescentar parabéns ou acontecimentos não confirmados.
- **Dados:** consulta manual ao [canal oficial](https://www.youtube.com/@Imports_Tech/about)
  em 11/09/2026 às 12:01 BRT: cerca de 5.160 inscritos, 92 vídeos e 1.093.813
  visualizações. A página informa fonte, arredondamento e horário.
- **Validade:** a API e a página omitem contadores quando a consulta passa de
  12 horas, tem data inválida/futura ou está marcada como desatualizada. Não
  renovam a data em builds. A API não usa cache de resposta.
- **Textos auxiliares:** privacidade identifica a hospedagem e a preferência
  local de iluminação; comunidade omite Telegram sem link; contato fica direto.

## Validação

54 testes, TypeScript, ESLint, formatação, builds Next/Vercel e Vinext/Cloudflare,
verificação do servidor Next e inspeção visual no navegador. A história foi
conferida em desktop, 390 × 844 e 667 × 320, com links de marcos e hash inválido.
Os builds verificaram seus bundles públicos; o servidor continuou recusando as
quatro tentativas de acesso privado com identidade falsificada.

## Limites que permanecem

A Vercel ainda não sincroniza automaticamente com o YouTube. Após a validade da
consulta manual, o site encaminha o visitante ao canal para ver números atuais.
Garantir contadores continuamente atualizados exige uma integração de servidor
em etapa posterior. O painel legado não edita o novo texto de `lib/about-story.ts`.
Nenhum banco, modelo 3D ou serviço pago foi adicionado nesta entrega.
