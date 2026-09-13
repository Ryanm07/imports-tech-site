# Acer Nitro 5 AN515-54

Modelo original construído no Blender 5.2.1 via complemento MCP local, para o estúdio Imports Tech. O script reproduzível é `scripts/blender/create_nitro5.py`; a exportação usada pelo site é `public/models/acer-nitro5-an515-54.glb`. O arquivo Blender editável, com animação na linha do tempo, é salvo em `outputs/nitro5/acer-nitro5-an515-54.blend` (fora do pacote público).

## Referências e fidelidade

- A descrição do [vídeo do Imports Tech](https://www.youtube.com/watch?v=Y1nStLptXY0) confirma AN515-54, Intel Core i5, GTX 1650, 8 GB, SSD 128 GB + HD 1 TB. Não confirma sufixo comercial nem modelo exato do processador.
- A [ficha Acer de uma variante do mesmo chassi](https://store.acer.com/en-ca/nitro-5-gaming-laptop-an515-54-5812) fornece dimensões de 363,4 × 255 × 25,9 mm e tela de 15,6 polegadas, 16:9. A configuração de armazenamento dessa variante não foi atribuída ao equipamento do canal.
- Fotos oficiais: [aberto](https://static-ecpa.acer.com/media/catalog/product/a/c/acer-nitro-5-an515-54-photogallery-03_8.png), [tampa/traseira](https://static-ecpa.acer.com/media/catalog/product/a/c/acer-nitro-5-an515-54-photogallery-04_8.png), [portas](https://static-ecpa.acer.com/media/catalog/product/a/c/acer-nitro-5-an515-54-photogallery-07_8.png).

A geometria reproduz a silhueta e os detalhes visíveis: tampa preta com faixas laterais, teclado numérico e WASD vermelhos, touchpad deslocado, faixa vermelha da dobradiça, webcam, portas e ventoinhas. É uma representação visual, não um projeto CAD para fabricação. Grafismo da tela e tipografia geométrica dos logotipos foram recriados; não foram usadas fotografias como texturas nem copiados arquivos 3D de terceiros. O layout de teclado segue as referências visuais disponíveis, sem afirmar a variante regional exata do aparelho.

## Contrato de integração

- glTF em metros, Y para cima e Z positivo para a frente. A base repousa em Y=0; o site usa escala 1,7 para o tamanho da bancada.
- `NitroBase` permanece imóvel na abertura. `LidPivot` começa sem rotação, em `(0, 0.022, -0.116)`, e abre girando X até −112°. Esse ângulo é uma escolha visual da interação.
- O GLB exporta a tampa fechada. O `.blend` mantém uma animação aberta/fechada nos quadros 1–136.
- Materiais e geometria compartilhados; peças agrupadas por material e conjunto móvel. Sem imagens, decodificadores de compressão de malha ou motor físico adicional.
- Níveis basic/low/medium usam geometria procedural simplificada; high/ultra baixam o GLB sob demanda. Estado da tampa é preservado durante a troca e o movimento reduzido aplica a posição imediatamente.
- A física usa a base como colisor para que abrir a tela não faça o notebook flutuar.

## Reprodução

Execute o script pela API Python do Blender com `__file__` apontando para seu caminho real. Ele cria uma cena própria, preservando as outras cenas. Reexecutá-lo substitui apenas a cena gerada com o mesmo nome. A exportação de GLB ocorre antes de adicionar iluminação e cenário de apresentação. Os testes `tests/nitro-asset.test.ts` verificam a exportação real: dimensões, dobradiça, limite de download (900 KB), triângulos (25 mil) e chamadas de desenho (24).
