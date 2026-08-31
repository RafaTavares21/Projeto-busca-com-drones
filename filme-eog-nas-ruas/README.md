# EOG NAS RUAS — filme de campanha

Filme vertical construído inteiramente de forma programática com Remotion +
React + TypeScript + Three.js. Sem After Effects, sem geração por IA: cada frame
é uma função pura do número do frame.

**Formato:** 1080 × 1920 (9:16) · 30 fps · 600 frames (20 s) · H.264

---

## A ideia

O centro monumental de São Paulo tratado como museu, e a marca entrando nele.

O filme abre com a linguagem da arquitetura — câmera de tripé, tipografia de
etiqueta, o letreiro da EOG em **bronze** entre os ornamentos do Theatro
Municipal — e quebra para a linguagem da rua no frame em que o metal vira tinta.
A frase da própria marca, *EOG NAS RUAS*, é a tese.

| # | Cena | Tempo | Conteúdo |
|---|------|-------|----------|
| 01 | PATRIMÔNIO | 0 – 4,5 s | Recuo lento no Theatro. O letreiro nasce em bronze. |
| 02 | A QUEBRA | 4,5 – 7,5 s | O bronze vira marca. As mãos cruzam e entregam a rua. |
| 03 | MARCA FIXA | 7,5 – 14 s | Seis lugares trocam atrás de um letreiro que não se move. |
| 04 | NAS RUAS | 14 – 17,5 s | A frase em escala de monumento, com parallax. |
| 05 | DROP | 17,5 – 20 s | Clarão, assinatura, contato. |

---

## Como rodar

```bash
npm install
npm run assets    # vetoriza o logo e prepara a fotografia
npm run fonts     # gera a fonte typeface do Three.js
npm run studio    # editor interativo
npm run build     # renderiza out/eog-nas-ruas.mp4
```

Em máquinas sem GPU (ou com rede restrita), aponte o Remotion para um Chromium
local antes de renderizar:

```bash
export REMOTION_BROWSER_EXECUTABLE="$PWD/scripts/chromium-swiftshader.sh"
```

O wrapper injeta `--enable-unsafe-swiftshader`. A partir do Chromium 138 o
fallback automático para WebGL por software foi descontinuado, e sem essa flag
o contexto WebGL não é criado — **as cenas 3D saem pretas, sem nenhum erro**.

---

## O letreiro em 3D de verdade

O logo chega como bitmap. `npm run assets` roda o `vectorize.mjs`, que **traça
as curvas** e grava um SVG em três camadas — letreiro, mão de fundo, mão da
frente. O `logoGeometry.ts` lê essas curvas com o `SVGLoader` e as transforma em
`ExtrudeGeometry`: mais de um milhão de vértices de sólido com bisel.

Isso é o salto em relação a empilhar cópias chapadas da arte. A geometria real
responde à luz de qualquer ângulo, tem parede lateral, e sobrevive a um giro de
câmera — de frente e de três-quartos ela continua sendo um objeto.

A separação por cor não é cosmética: é ela que permite dar **bronze** ao
letreiro e vermelho às mãos, e interpolar entre os dois materiais ao longo do
filme. Na cena 02, `finish` vai de 0 a 1 e muda cor, `metalness`, `roughness` e
reflexo de ambiente ao mesmo tempo — por isso a virada lê como troca de
material, e não como ajuste de matiz.

### Por que traçar em três camadas

A primeira tentativa fundiu os dois vermelhos da arte num só e **o logo
achatou**. O par de tons (`#C00000` atrás, `#FF4040` na frente) é o que dá
profundidade ao desenho das mãos. O traçado separa por cor antes de vetorizar.

---

## Fotografia

O registro em `src/assets.ts` declara a **folga** de cada imagem — quantas vezes
ela cabe no quadro. É o dado que decide onde a câmera pode andar:

| folga | fotos | uso |
|-------|-------|-----|
| 2,98× | 2 (Theatro, 24,5 MP) | close e movimento pesado — a abertura da cena 01 |
| 0,75× | 8 (campanha, 1,6 MP) | quadro cheio, deriva leve |

Por isso o recuo longo acontece na cena 01 e não em outro lugar: é a única foto
que aguenta.

**Os recortes de pessoas foram removidos.** Com 155 a 360 px de conteúdo, eles
entravam em cena ampliados de três a cinco vezes, e a queda de qualidade era
visível ao lado da fotografia original. A profundidade que davam foi refeita com
o que existe em alta qualidade: as mãos vermelhas em primeiro plano e a própria
fotografia em camadas de velocidade diferente.

---

## Notas de implementação

**Todo movimento deriva de `useCurrentFrame()`.** Não há `setTimeout`,
`setInterval`, `Date.now()`, `Math.random()` nem o ticker do GSAP. O GSAP entra
só como biblioteca de curvas puras; a mola vem do `spring()` do Remotion; o
ruído orgânico vem de `random()` semeado. O mesmo frame produz sempre o mesmo
pixel, em qualquer worker.

**Planos em profundidade usam `fillHeightAt(z)`.** Um plano atrás do plano zero
aparece menor do que seu tamanho nominal, porque está mais longe da lente.
Dimensionar uma foto de fundo pela altura do quadro sem essa correção deixa
tarja preta em cima e embaixo — e o erro não aparece no código, só no frame
renderizado. O cálculo está centralizado em `stageConfig.ts` justamente para não
poder ser esquecido.

**A âncora da cena 03.** O letreiro assume uma posição na tela e não sai mais
dela enquanto seis fotos trocam atrás. O corte some porque o olho segura no
elemento fixo e aceita que o mundo mude em volta. Qualquer deslocamento do logo
entre um corte e outro denunciaria os dois.

**Fotografia não é re-iluminada.** `PhotoPlate` usa `MeshBasicMaterial` de
propósito: a luz de uma foto já está gravada nela, e somar um rig por cima
produziria duas iluminações. A luz da cena alcança a imagem por `exposure` e
`tint`.

**O letreiro nunca cobre rosto.** Em toda cena com pessoas ele vive na parte
alta do quadro, onde a fotografia guarda céu e fachada. O assunto do filme é
quem está usando a peça.

**Máscaras de texto usam pixels, nunca `em`.** Um `height: 1em` num elemento sem
`font-size` próprio resolve contra os 16 px herdados do documento, e uma linha
de 218 px aparece cortada numa faixa de 16 — sem erro, o texto apenas some.
`<MaskedLine>` calcula a altura a partir do `fontSize`.

**Pós-processamento em DOM.** O `EffectComposer` não desenha sob o frameloop
manual do `<ThreeCanvas>`: o Remotion captura o frame sem o passe do composer e
o resultado sai preto, inclusive com um composer vazio. Vinheta, grão e correção
de cor são camadas DOM (`FilmTreatment`); o halo é colocado à mão pelo `<Glow>`.
