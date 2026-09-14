# Conjunto de gravação Imports Tech

Modelos originais construídos no Blender 5.2.1 LTS pelo complemento MCP local: **Ulanzi U200 Ring Bar, Ulanzi MT09 e Samsung Galaxy S25 Ultra**. As três peças permanecem editáveis em coleções separadas; o conjunto está montado, com os três pés apoiados no chão e o celular na horizontal.

## Arquivos

Pasta de entrega: `outputs/recording-kit/`.

| Arquivo | Conteúdo | Tamanho verificado |
|---|---|---:|
| `imports-tech-recording-kit.blend` | Cena editável, materiais, câmeras de apresentação e animação da iluminação | Ver arquivo local |
| `imports-tech-recording-kit.glb` | Conjunto montado, sem cenário de apresentação | 1.059.236 bytes |
| `ulanzi-u200.glb` | Ring bar e grampo | 495.316 bytes |
| `ulanzi-mt09.glb` | Tripé com adaptador ilustrativo | 339.820 bytes |
| `galaxy-s25-ultra.glb` | Celular, orientação retrato e origem central | 224.312 bytes |
| `front-on.png`, `front-off.png`, `rear.png` | Renders do conjunto para revisão | PNG |

## Modelagem e referências

O [dossiê de referências](</C:/Users/Ryvam/Documents/New project/outputs/referencias-ulanzi-s25/README.md>) reúne imagens e fontes. Foram reproduzidos a moldura de quatro difusores, controles, sapatas, portas e grampo do U200; as pernas curvas, reforços, anel vermelho e topo GoPro do MT09; o contorno, moldura, anéis de câmera, botões, portas e S Pen recolhida do celular.

O S25 Ultra usa dimensões nominais de corpo **162,8 × 77,6 × 8,2 mm**. A espessura total aumenta com os anéis de câmera, cuja saliência foi estimada visualmente. Cor Silverblue e ausência de capa são escolhas ajustáveis desta versão.

A moldura principal do U200 foi construída em **290 × 220 × 31 mm**, como dimensão provisória: a pesquisa encontrou divergência com a arte de 255 × 220 mm. Controles e sapatas acrescentam pequenas saliências ao volume final. A abertura, detalhes pequenos e adaptador do MT09 são reconstruções visuais, sem alegação de precisão de fabricação ou validação de uma montagem física.

## Acender e apagar

No Blender, o objeto `UlanziU200` tem a propriedade personalizada `light_on`:

- Quadro **1**: apagada.
- Quadro **60**: acesa.
- Quadro **120**: apagada novamente.

A linha do tempo contém transições suaves e marcadores em português. A propriedade dirige a emissão do material `U200_Diffuser` e quatro luzes de apresentação. Os pés e o celular permanecem estáticos.

O GLB é entregue com a ring bar **apagada**, sem animação de material embutida. No site, o controlador restaura a cor de emissão e muda a intensidade de `U200_Diffuser` de 0 a 3, conservando o mesmo modelo. As quatro luzes usadas no render não são exportadas. Clicar no kit alterna a iluminação e abre suas informações, com um botão acessível para acender/apagar.

## Exportação e verificação

O conjunto GLB possui **26.514 triângulos**, **42 primitivas de material** e **39 materiais**. Os arquivos são autossuficientes, sem texturas externas, câmeras, luzes ou plano de chão. O detalhe microscópico procedural da pegada do MT09 permanece no Blender; o GLB conserva seu acabamento básico sem exigir textura.

Os três modelos foram reimportados do GLB no Blender e seus limites espaciais coincidiram com os originais, com tolerância de 0,01 mm. A animação foi verificada nos quadros 1/60/120: emissão 0/4/0 e luz de apresentação 0/0,6/0. Relatórios em `build-report.json`, `glb-inspection.json` e `reimport-validation.json` na pasta de entrega.

## Integração no estúdio

O apoio foi adaptado para um tripé de piso: montagem a **1,43 m**, celular a **1,61 m** no chão da cena e topo a **1,785 m**. É uma adaptação visual de piso, não uma alegação de que o MT09 real atinge essa altura. A ring bar e o celular usam escala uniforme 1,5 na cena, sem deformar proporções; seus GLBs preservam as medidas nativas.

A versão editável de piso está em `outputs/recording-kit/imports-tech-recording-kit-floor.blend`, com prévia em `floor-preview.png`. Reprodução por `scripts/blender/create_recording_floor.py` e `recording_floor_stand.py`.

Os ativos públicos independentes são `recording-floor-stand.glb` (174.504 bytes, 4.420 triângulos), `ulanzi-u200.glb` (495.316 bytes) e `galaxy-s25-ultra.glb` (224.312 bytes): **894.132 bytes no total**, 22.530 triângulos, sem imagens externas. O GLB do conjunto completo não é carregado pelo site.

Alta e Cinemática carregam os detalhes sob demanda. Máxima economia, Leve e Equilibrada usam modelos procedurais simplificados, sem baixar esses GLBs. Em falha de download, o kit conserva a versão leve. A ring bar compartilha geometria e clona somente seu material mutável; a transição respeita redução de movimento e para de pedir frames ao terminar. A troca de qualidade preserva a iluminação e os grupos interativos. O celular continua selecionável e pode ser pego separadamente.

Verificações automatizadas cobrem GLBs reais, dimensões, limites de geometria/download, pés no chão, emissão da exportação apagada, isolamento do cache e descarte de recursos. A prévia também foi conferida em primeira pessoa. Isso não substitui medições de FPS em aparelhos físicos variados.

## Reprodução

Script principal: [create_recording_kit.py](</C:/Users/Ryvam/Documents/New project/scripts/blender/create_recording_kit.py>). Os módulos `recording_u200.py`, `recording_mt09.py` e `recording_s25.py` geram as geometrias originais. Execute o principal na API Python do Blender com `__file__` apontando para o caminho real e `__name__='__main__'`.

O script cria uma cena própria, preserva cenas anteriores e escreve as entregas em `outputs/recording-kit`. Os GLBs usam metros e Y para cima; a cena editável usa o sistema nativo do Blender, Z para cima. As malhas exportadas são cópias avaliadas e agrupadas por material/produto; as peças da cena editável mantêm sua organização.
