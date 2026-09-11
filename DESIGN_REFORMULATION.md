# Registro da reformulação anterior

Este documento descreve a reforma das páginas que antecedeu o estúdio 3D.
A home editorial e a introdução mencionadas abaixo foram substituídas pela
base interativa documentada no README. As medições de Lighthouse e de tamanho
deste registro não se aplicam à nova cena 3D. O e-mail de contato agora está
publicado, e o texto dos mil inscritos foi corrigido conforme o relato de Ryan.

Entrega local validada em 10/09/2026. A reforma foi feita no projeto existente,
mantendo React, Vinext, Vite, Cloudflare Worker, D1, rotas e repositório editorial.
Nenhuma publicação ou alteração no banco remoto foi realizada.

## Diagnóstico e direção visual

A inspeção anterior incluiu código, dependências, assets, páginas públicas,
rotas desativadas e navegação real em desktop, notebook, tablet e celular.
As capturas anteriores estão em `outputs/redesign/before/`.

Os principais problemas eram a cascata de estilos com aproximadamente 140 KB,
seções de scroll muito longas, falta de hierarquia em páginas secundárias,
identidade escondida no header mobile e processamento contínuo do background.
A intro não continha adequadamente o foco; fontes geradas pelo Vinext no Windows
acabavam apontando para caminhos locais inválidos.

A direção adotada combina azul profundo, amarelo da marca, tipografia editorial
e imagens reais dos vídeos. A home tem composição assimétrica, o lema
“Tecnologia fora do comum”, selo interativo da marca e entrada direta no canal.

## O que mudou

- Home reorganizada em apresentação, vídeos, origem, marcos, comunidade,
  retrato do canal e parcerias. Os vídeos usam thumbnails reais e estados de
  hover/foco com play, zoom contido e feedback de clique.
- Header com marca visível no celular, indicação de página ativa, menu animado,
  foco inicial, Escape e fechamento ao sair da navegação. Footer compacto com
  todos os destinos públicos e legais.
- História, comunidade, contato, métricas e páginas legais compartilham
  hierarquia, espaçamento, superfícies e contraste. Os 13 capítulos da história
  e suas cenas continuam disponíveis, inclusive sem JavaScript.
- Movimento programado por eventos, revelações únicas por interseção, respostas
  discretas ao ponteiro e transições de botões, imagens e navegação. O canvas e
  o controlador de scroll da home sem uso foram removidos.
- A intro preserva replay, som opcional, sessão, recuperação de erro e botão de
  pular. Agora contém foco, desativa o fundo enquanto aberta e restaura os estados
  ao fechar. Movimento reduzido e economia de dados pulam a intro automática
  sem solicitar seus arquivos.
- Fragmentos inválidos como `/sobre#%` não derrubam mais a história. Links
  válidos e fragmentos codificados continuam selecionando o capítulo correto.
- Geist e Geist Mono servidas localmente, com licença OFL, pesos variáveis,
  subconjunto latino e `font-display: swap`. Ícones locais funcionam também nas
  prévias sem violar a CSP. Open Graph utiliza o JPG existente de 1200 × 630.
- `npm start` agora usa `vite preview`, o runtime local adequado ao Worker.
  O comando anterior falhava ao importar o esquema `cloudflare:` no Node.
- Next e eslint-config-next atualizados de 16.2.6 para 16.3.4; removido o override
  antigo do PostCSS e atualizado baseline-browser-mapping. Nenhuma biblioteca de
  animação ou nova dependência de aplicação foi adicionada.

## Sistema visual e manutenção

`app/globals.css` organiza os estilos em arquivos de tokens, base, home,
navegação, páginas e experiências compartilhadas. As cenas narrativas ficam em
`public/styles/story.css`, carregado pela página `/sobre` com precedência de
stylesheet do React. Isso evita que o Vinext reúna essas cenas no CSS da home.

| Decisão                 | Valor principal                                                 |
| ----------------------- | --------------------------------------------------------------- |
| Fundo / superfície      | `#07111f` / `#101f31`                                           |
| Texto / secundário      | `#f3f5f7` / `#afbac9`                                           |
| Marca / foco            | `#ffbe24` / `#91bbff`                                           |
| Container               | 1280 px com gutters fluidos                                     |
| Raios                   | 6, 12 e 20 px                                                   |
| Transições / revelações | 180, 280 e 650 ms                                               |
| Easing                  | `cubic-bezier(0.22, 1, 0.36, 1)`                                |
| Adaptação               | menu em 900 px; composição em 760 px; detalhes mobile em 600 px |

`VideoCard`, `ContactEmail`, ícones, header, footer e comunidade são componentes
reutilizáveis. Os dados publicados e a seleção de vídeos permanecem separados
da apresentação. Não foi introduzido um catálogo externo ou fonte fictícia de
dados.

## Verificação

- Lint, TypeScript, 41 testes e build de produção aprovados. Logs em
  `outputs/redesign/final-*.log`.
- 32 combinações de página/tela aprovadas: oito rotas públicas em 1440 × 1000,
  1366 × 768, 768 × 1024 e 390 × 844. Foram verificados fonte carregada,
  títulos, canonical, imagens, overflow, links, menu e erros de runtime.
  Evidência: `outputs/redesign/final-routes/routes.json`.
- Conferência adicional aprovada em 320 px para home, história e métricas e em
  1920 px para a home. Robots, sitemap, API pública e redirecionamentos antigos
  responderam como esperado; evidência em `outputs/redesign/http-smoke.json`.
- Capturas finais de desktop, notebook, tablet e celular inspecionadas. As
  páginas legais também foram abertas e verificadas.
- Navegação real entre home e história carrega o CSS das cenas; 13 capítulos
  preservados. Testes de fragmentos inválidos e válidos em
  `tests/browser/story-hash-regressions.js`.
- Testes de movimento verificam ausência de RAF em repouso durante 700 ms,
  agrupamento de 100 eventos de ponteiro, conteúdo inserido dinamicamente,
  reveal único, replay, falha de vídeo, Tab/Shift+Tab, Escape e restauração de
  foco. Modo reduzido e economia de dados aprovados.
- Sem JavaScript, os 13 capítulos permanecem visíveis, em fluxo normal, com
  stylesheet carregado. Nenhum conteúdo depende de uma animação para existir.
- O build verifica o bundle público contra vazamento da chave do YouTube.

### Desempenho medido

Lighthouse 13.4.1 sobre o build local no Workers runtime. São medidas de
laboratório, sem a compressão e a distribuição do ambiente hospedado.

| Perfil com cache frio | Performance | Acessibilidade | Boas práticas | SEO |   LCP |   CLS |   TBT |
| --------------------- | ----------: | -------------: | ------------: | --: | ----: | ----: | ----: |
| Desktop               |          98 |            100 |           100 | 100 | 1,0 s | 0,004 |  0 ms |
| Mobile simulado       |          72 |            100 |           100 | 100 | 5,1 s |     0 | 10 ms |

Relatórios completos: `outputs/redesign/lighthouse-desktop.report.html` e
`outputs/redesign/lighthouse-mobile-optimized.report.html`.

O CSS compartilhado entregue caiu de 91.984 para 52.772 bytes nesta etapa de
otimização, redução de aproximadamente 43%. As duas fontes somam 52.396 bytes.
Thumbnails fora do hero usam carregamento tardio; a imagem social passou do PNG
de aproximadamente 1,58 MB para o JPG existente de aproximadamente 83 KB.

A primeira visita mobile ainda tem custo relevante de download e da intro
cinematográfica existente. Ela pode ser pulada, não se repete na sessão e é
omitida automaticamente com movimento reduzido ou economia de dados. A pontuação
mobile não representa uma meta de carregamento rápido plenamente atingida em
rede lenta. INP e FPS em aparelhos reais precisam de medição de campo; não são
garantidos por estes testes. Acessibilidade automática também não substitui
uma avaliação completa com tecnologias assistivas.

## Segurança e limites

O scan Codex Security `0bd765d2-1b34-4fc4-ac26-60bb385bf279` foi concluído para o
snapshot inicial de 26 arquivos. Não identificou vulnerabilidade introduzida
nesse conjunto. Relatório e artefatos em `outputs/redesign/security/`.
O próprio relatório delimita a revisão: ajustes posteriores de fontes, ícones,
CSS, fragmentos e dependências passaram pela verificação local, mas não pertencem
ao snapshot selado. Ingress de autenticação e infraestrutura remota não foram
testados.

`npm audit --omit=dev` retorna zero ocorrências após a atualização. A auditoria
completa ainda registra 20 ocorrências preexistentes na cadeia de ferramentas,
incluindo Vinext, Vite, Cloudflare e react-server-dom-webpack. Alguns desses
pacotes participam do build/runtime; a classificação `devDependency` não prova
ausência de exposição. Uma atualização coordenada dessa infraestrutura permanece
recomendada, especialmente onde a sugestão implica mudança major/beta.
Detalhes em `outputs/redesign/npm-audit-all.json`. Não foi aplicado `audit fix
--force` nem uma troca de arquitetura durante a reforma visual.

O marco “5 mil+” vem do pedido do proprietário. O snapshot da API continua
identificado como antigo, com sua data real; não foi artificialmente atualizado.
Telegram, e-mail comercial e Media Kit continuam dependentes de configuração
válida. Links ausentes recebem estado informativo. O fluxo de copiar e-mail só
aparece quando há endereço publicado; não foi exercitado com um endereço real
porque essa configuração está ausente.

O aviso `? Unknown` de classificação de rotas no build é uma limitação da
análise estática do Vinext. Build, navegação e respostas das páginas foram
testados separadamente.

## Executar e reproduzir

```powershell
npm ci
npm run dev
# Ou, para a prévia do build no Workers runtime:
npm run build
npm start -- --port 3001
# Em outro terminal:
./tests/browser/public-routes.ps1 -BaseUrl http://localhost:3001
```

No Windows deste ambiente, use `localhost`; o servidor de desenvolvimento está
escutando em IPv6 e `127.0.0.1` não é equivalente. Capturas, logs e relatórios
locais ficam em `outputs/`, ignorado pelo Git.
