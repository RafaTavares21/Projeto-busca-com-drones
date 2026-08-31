# EOG DRIP — DROP 01

Filme vertical de lançamento, construído inteiramente de forma programática com
Remotion + React + TypeScript + Three.js. Sem After Effects, sem clipes de
vídeo, sem geração por IA: cada frame é uma função pura do número do frame.

**Formato:** 1080 × 1920 (9:16) · 30 fps · 450 frames (15 s) · H.264

**Narrativa:** IMPACTO → IDENTIDADE → PRODUTO → DETALHES → MARCA → DROP

---

## Como rodar

```bash
npm install
npm run assets    # recorta os assets do produto a partir de public/assets/source
npm run fonts     # gera a fonte typeface do Three.js a partir do TTF
npm run studio    # editor interativo em localhost:3000
npm run build     # renderiza out/eog-drip-drop-01.mp4
```

### Ambientes sem GPU ou com rede restrita

O Remotion baixa o próprio Chrome Headless Shell e usa WebGL por hardware. Em
containers sem GPU (ou com egress bloqueado) aponte-o para um Chromium local:

```bash
export REMOTION_BROWSER_EXECUTABLE="$PWD/scripts/chromium-swiftshader.sh"
export CHROMIUM_BIN=/caminho/para/headless_shell   # opcional
npm run build
```

O wrapper injeta `--enable-unsafe-swiftshader`. A partir do Chromium 138 o
fallback automático para WebGL por software foi descontinuado, e sem essa flag
o contexto WebGL simplesmente não é criado — **as cenas 3D saem pretas, sem
nenhum erro**.

---

## Assets do produto

Os arquivos originais ficam intactos em `public/assets/source/`. O comando
`npm run assets` gera as versões usadas em cena.

| papel | arquivo | o que é | função na narrativa |
|---|---|---|---|
| `productFront` | `shirt-front.png` | a peça, frente | abre o reveal da cena 02 |
| `productBack` | `shirt-back.png` | a peça, costas | revelada atrás da mão, no pico do gesto |
| `productWorn` | `product-back.jpg` | a peça vestida | o caimento e o corpo, na cena de detalhes |
| `printMark` | `print-front.png` | a estampa isolada | assina o último frame |
| `hands` | `hands.png` | as mãos vermelhas | gesto de impacto, máscara e transição |

### Trocar a peça do próximo drop

`src/assets.ts` é a única lista de arquivos do filme. As cenas pedem os assets
pelo **papel que cumprem na narrativa**, nunca pelo nome do arquivo:

```ts
export const ASSETS = {
  productFront: { src: 'assets/shirt-front.png',  kind: 'photo' },
  productBack:  { src: 'assets/shirt-back.png',   kind: 'photo' },
  productWorn:  { src: 'assets/product-back.jpg', kind: 'photo' },
  printMark:    { src: 'assets/print-front.png',  kind: 'art'   },
  hands:        { src: 'assets/hands.png',        kind: 'art'   },
};
```

Trocar o drop é substituir os arquivos em `source/` e rodar `npm run assets`.
Nenhuma cena precisa ser reescrita. Um asset que não carrega não derruba o
filme: a cena simplesmente não o desenha.

O campo `kind` decide o material. `photo` é exibida como foi fotografada — a
luz já está gravada na imagem, e iluminá-la de novo somaria duas iluminações e
destruiria a fotografia. `art` recebe a luz da cena, porque é justamente a luz
que dá volume a uma arte chapada.

### Duas formas de preparar um asset

`scripts/prepare-assets.mjs` trata cada tipo de arquivo pelo que ele é.

**Artes chapadas** (`print-front`, `hands`) chegam como JPEG sobre preto, sem
canal alfa. São **chaveadas**: o script recorta o fundo e grava PNGs com alfa
real, cortando a moldura vazia para que a arte seja posicionada pela própria
proporção. O corte usa o **canal mais forte** do pixel, não a luminância
perceptual — as mãos são vermelho saturado, que tem luminância baixa e seria
comido por um corte perceptual.

**As peças** (`shirt-front`, `shirt-back`) foram fotografadas apoiadas sobre o
modelo, então um recorte retangular traz junto jeans, degraus e a mão dele.
Chavear não resolve: a peça é preta, parte do fundo também é, e a estampa é
branca — não existe limiar que separe os três. A solução é óptica em vez de
geométrica: uma **queda suave de alfa nas bordas** faz o contexto se dissolver
no preto do filme, e o que sobra é a peça. Numa composição de fundo preto isso
lê como iluminação, não como recorte.

---

## Arquitetura

```
src/
├── Root.tsx                    Composição principal + cada cena isolada
├── timing.ts                   ← TIMELINE MESTRE (única fonte de ritmo)
├── assets.ts                   ← REGISTRO DE ASSETS (única lista de arquivos)
├── compositions/DropOne.tsx    Montagem das 5 cenas + camada de transições
├── scenes/                     Uma cena por arquivo, só orquestração
├── components/                 Camada DOM/SVG (2D)
├── three/                      Camada WebGL (3D)
├── animations/                 Easing, molas, ruído, interpoladores
└── styles/                     Tokens de direção de arte e fontes
```

### Princípios

**Toda animação deriva de `useCurrentFrame()`.** Não há `setTimeout`,
`setInterval`, `Date.now()`, `Math.random()` nem o ticker do GSAP. O GSAP entra
apenas como biblioteca de curvas: `gsap.parseEase()` devolve uma função pura
`(t) => t'`. A física de mola vem do `spring()` do Remotion, resolvido
analiticamente a partir do frame. Até o "orgânico" — deriva de câmera, poeira,
dispersão de estilhaços — sai de `random()` semeado do Remotion, que é uma
função hash pura da seed. O mesmo frame produz sempre o mesmo pixel, em
qualquer worker de render.

**Um único arquivo de ritmo.** Todos os beats vivem em `timing.ts`. Ajustar a
edição é mudar números lá, não caçar `delay` espalhado por cinco componentes.

**Produto e tipografia dividem a mesma câmera.** As imagens do produto são
planos dentro da cena 3D, não camadas DOM por cima. Quando a câmera avança,
produto e texto ganham perspectiva juntos — é isso que faz o filme ler como um
sistema único em vez de camadas empilhadas.

**Assets carregam ACIMA do `<ThreeCanvas>`.** O Remotion desenha cada frame uma
única vez; uma fonte ou textura que chega por estado de um componente interno
nunca aparece, porque o canvas já fez seu draw. `TypefaceProvider` e
`AssetProvider` seguram o frame via `delayRender` e só então montam a árvore.

**Cenas não se sobrepõem.** Cada uma monta e desmonta seu próprio contexto
WebGL. A `TransitionLayer` global cobre exatamente o quadro em que a troca
acontece, o que é o que impede o remount de aparecer.

---

## A mão vermelha

As mãos são parte da identidade da peça, então no filme elas não decoram:
elas cortam.

Na cena 01 a mão rasga o quadro e **carrega a câmera junto** — o chicote de
câmera é consequência do gesto, não um efeito somado por cima.

Na cena 02 ela atravessa o quadro em primeiro plano e, no frame de maior
cobertura, a peça gira **atrás dela**: quando a mão sai, o que está em cena são
as costas. É o mesmo recurso de um corte escondido atrás de um objeto que passa.
A diferença importa: um fade informa que houve uma transição; um objeto que
passa faz a transição desaparecer — e, como o objeto é a mão da própria
estampa, a marca acaba assinando o próprio corte.

As duas faces são placas de mesma proporção e compartilham escala,
enquadramento e deriva, e a câmera continua avançando através do corte. É isso
que faz as duas lerem como a **mesma peça girando**, e não como duas imagens
diferentes cortadas uma na outra.

Não há máscara por stencil nem shader. Cobertura física é mais simples, mais
barata e — porque a mão tem a silhueta irregular de uma mão real — mais bonita
que um wipe geométrico. `RedHandTransition` expõe `handCoverage()`, e é a cena
que decide o que fazer com o pico.

Na cena 03 uma mão pequena liga uma especificação à outra, declarando as duas
como o mesmo sistema. Sem ela seriam duas legendas soltas.

---

## Timeline

| # | Cena | Tempo | Conteúdo |
|---|------|-------|----------|
| 01 | IMPACT | 0 – 2.5 s | Silêncio, a mão rasga o quadro, EOG chega, DRIP passa rente à lente |
| 02 | PRODUCT REVEAL | 2.5 – 6 s | A peça de frente → mão atravessa → as costas, no pico do gesto |
| 03 | DETAILS | 6 – 9 s | Ficha técnica em tipografia editorial no espaço negativo |
| 04 | EOG DRIP | 9 – 12 s | Colisão em profundidades opostas + assinatura |
| 05 | FINAL DROP | 12 – 15 s | Flash vermelho, silêncio, lockup, DROP 01 / COMING SOON |

Cada cena também é registrada como composição isolada (`Scene01-Impact`, …)
para trabalhar 90 frames no Studio sem arrastar a timeline inteira.

---

## Tipografia

| fonte | uso |
|-------|-----|
| Anton | EOG / DRIP e toda a tipografia de impacto, 2D e 3D extrudada |
| Archivo | metadados de canto e etiquetas de ficha técnica |
| Playfair Display Italic | a assinatura da cena 04 — o contraponto editorial |

Todas auto-hospedadas em `public/fonts/`. Um CDN dentro do render seria fonte
de não determinismo e de frames com fallback tipográfico.

O Three.js não distribui fontes pelo npm e o `TextGeometry` só aceita o formato
`typeface`. `npm run fonts` converte o TTF da Anton via `opentype.js`.

---

## Notas de implementação

**Pós-processamento em DOM, não em WebGL.** O `EffectComposer` do
`@react-three/postprocessing` não desenha sob o frameloop manual do
`<ThreeCanvas>`: o Remotion captura o frame sem o passe do composer e o
resultado sai preto — inclusive com um composer vazio. Vinheta, grão e correção
de cor são compostos como camadas DOM (`FilmTreatment`), o que renderiza em
qualquer máquina, custa uma fração do tempo por frame e continua determinístico.
O halo que o bloom daria é colocado à mão, onde a direção de arte quer, pelo
`<Glow>` aditivo.

**Objetos em primeiro plano são dimensionados na escala da sua profundidade.**
Um plano posto a z=1500 com altura calculada na escala de z=0 aparece várias
vezes maior que o quadro. `RedHandTransition` converte com
`visibleHeightAt(z)` antes de dimensionar e de calcular o percurso.

**Motion blur é seletivo.** O `<Trail>` renderiza a subárvore várias vezes,
então só é montado nos frames de movimento violento. Na tipografia 3D e na mão
o borrão vem de cópias fantasma deslocadas — muito mais barato que subframes.

**Máscaras de texto usam pixels, nunca `em`.** Um `height: 1em` num elemento que
não declara `font-size` resolve contra os 16px herdados do documento, e uma
linha de 226px aparece cortada numa faixa de 16 — sem quebrar nada, o texto
apenas some. `<MaskedLine>` calcula a altura a partir do `fontSize` e elimina a
classe inteira.

**A fotografia do produto tem 849 × 538.** É uma paisagem de baixa resolução
dentro de um quadro vertical, então ela é exibida como placa larga com preto
acima e abaixo — linguagem de editorial — e a aproximação é limitada a 1.12×
para não ampliar a imagem além do que ela aguenta. Uma foto de resolução maior
permitiria enquadramentos mais fechados.
