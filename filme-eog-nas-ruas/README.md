# EOG NAS RUAS — filme de campanha

Filme vertical construído inteiramente de forma programática com Remotion +
React + TypeScript + Three.js. Sem After Effects, sem geração por IA: cada frame
é uma função pura do número do frame.

**Formato:** 1080 × 1920 (9:16) · 30 fps · 600 frames (20 s) · H.264

---

## A ideia

O centro monumental de São Paulo tratado como museu, e a marca entrando nele.

O filme abre com a linguagem da arquitetura — câmera de tripé, tipografia de
etiqueta, o letreiro da EOG gravado em **pedra** na fachada do Theatro
Municipal — e quebra para a linguagem da rua no frame em que a pedra vira tinta.
A frase da própria marca, *EOG NAS RUAS*, é a tese.

| # | Cena | Tempo | Conteúdo |
|---|------|-------|----------|
| 01 | PATRIMÔNIO | 0 – 4,5 s | Recuo lento no Theatro. O letreiro nasce gravado na pedra. |
| 02 | A QUEBRA | 4,5 – 7,5 s | A pedra vira marca. As mãos cruzam e entregam a rua. |
| 03 | MARCA FIXA | 7,5 – 14 s | Seis lugares trocam atrás de um letreiro que não se move. |
| 04 | NAS RUAS | 14 – 17,5 s | A frase em escala de monumento, com parallax. |
| 05 | DROP | 17,5 – 20 s | Clarão, assinatura, contato. |

---

## Como rodar

```bash
npm install
npm run assets    # vetoriza o logo e prepara a fotografia
npm run fonts     # gera a fonte typeface do Three.js
npm run sfx       # sintetiza os efeitos sonoros em public/audio
npm run studio    # editor interativo
npm run validar   # typecheck + validação de áudio + validação de sincronia
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

## A timeline é um arquivo só

`src/timing.ts` é a única fonte de ritmo do filme. Nenhuma cena inventa frame
próprio: cenas, beats, transições, **marcadores** e **cues de som** saem todos
de lá, e os marcadores são *derivados* dos beats em vez de digitados de novo —
mexer no ritmo num lugar move imagem e som juntos.

Os marcadores têm oito tipos: `sceneStart`, `sceneEnd`, `impact`, `transition`,
`beat`, `textReveal`, `productReveal` e `finalHit`. Quem os consome:

- `src/audio/SoundDesign.tsx` — dispara os efeitos exatamente nos frames de ação.
- `src/components/ImpactResponse.tsx` — faz a imagem *reagir* aos golpes.

O `ImpactResponse` vive **acima** das `<Sequence>` de propósito: dentro de uma
sequência o `useCurrentFrame()` devolve o frame local, e os marcadores são
absolutos. Ali em cima os dois relógios são o mesmo.

---

## Desenho de som

Sem trilha musical — só desenho de som, e o silêncio como instrumento. São 34
cues, e **22% do filme é completamente mudo**: os 14 primeiros frames, o respiro
do fim da cena 03 e os últimos frames depois do golpe final. Sem esses vazios os
impactos não teriam contra o que bater.

Cada cue declara, no próprio código, **qual ação visual ele reforça**. Um som
sem ação correspondente é ruído — foi essa regra que manteve a lista em 34
entradas e não em cem. A dinâmica também é desenhada: a cena 01 nunca passa de
0,42; o corte para a rua chega a 0,90; o filme fecha num único golpe seguido de
silêncio.

Os arquivos em `public/audio` são **sintetizados** por `npm run sfx` — ruído,
senóides e envelopes, com PRNG semeado. Nenhum áudio licenciado existe no
projeto, e inventar um arquivo inexistente quebraria o render. Trocar qualquer
efeito por uma gravação real é sobrescrever o `.wav` de mesmo nome: nenhuma
linha de código muda.

A trilha fica preparada mas desligada (`MUSIC.enabled = false`), com a curva
pretendida — INTRO → BUILD → IMPACTO → DROP → FECHO — já mapeada em frames.
Enquanto a flag estiver desligada nenhum arquivo é requisitado.

`npm run validar` confere que todo som existe em disco, que a duração declarada
bate com o cabeçalho RIFF, que todo marcador de impacto tem som, que as janelas
de silêncio continuam mudas e que nada empilha mais de cinco sons ao mesmo tempo.

---

## Tipografia 3D — onde, e onde não

O filme **não** é feito de texto 3D. Só dois elementos existem como geometria
extrudada, e são justamente os dois que carregam a marca:

| Elemento | Onde | Por quê |
|---|---|---|
| o letreiro EOG DRIP | cenas 01, 02, 03, 05 | é a marca; precisa ter matéria |
| `DROP 01` | cena 05 | chega do fundo do palco, atravessando a profundidade |

Todo o resto — etiquetas, legendas, *EOG NAS RUAS*, *EM BREVE*, contato — é
tipografia plana do navegador. **Essa diferença é a hierarquia:** o que tem
volume é o que a marca assina.

---

## Ritmo, e por que a cena 03 acelera

Os seis cortes da cena 03 tinham intervalo constante. Uma grade regular vira
metrônomo: o olho aprende o compasso em dois cortes e para de assistir. Agora os
intervalos fecham — 28, 24, 20, 16, 12 frames — e então **travam** por 50 frames
no último quadro.

Os cortes rápidos correm mudos: um texto que entra e sai em menos de 20 frames
não é lido, é piscada. As legendas de local acompanham só as três primeiras
trocas, e a ficha da peça entra no respiro, quando ela é a única coisa que se
move. Aceleração e depois silêncio é a única figura que um corte regular não
produz.

---

## O letreiro em 3D de verdade

O logo chega como bitmap. `npm run assets` roda o `vectorize.mjs`, que **traça
as curvas** e grava um SVG em três camadas — letreiro, mão de fundo, mão da
frente. O `logoGeometry.ts` lê essas curvas com o `SVGLoader` e as transforma em
`ExtrudeGeometry`: mais de um milhão de vértices de sólido com bisel.

Isso é o salto em relação a empilhar cópias chapadas da arte. A geometria real
responde à luz de qualquer ângulo, tem parede lateral, e sobrevive a um giro de
câmera — de frente e de três-quartos ela continua sendo um objeto.

A separação por cor não é cosmética: é ela que permite dar **pedra** ao
letreiro e vermelho às mãos, e interpolar entre os dois materiais ao longo do
filme. Na cena 02, `finish` vai de 0 a 1 e muda cor, `roughness` e reflexo de
ambiente ao mesmo tempo — por isso a virada lê como troca de material, e não
como ajuste de matiz.

O estado de origem é **pedra cinza**, não bronze. A paleta do filme é preto,
branco e vermelho, e um metal quente introduzia um tom que não pertence à
identidade da EOG DRIP. O cinza da fachada faz o mesmo trabalho narrativo — a
marca começa gravada no patrimônio e só depois ganha cor — sem sair da paleta.
Nenhum dos dois estados brilha: `metalness` é 0 e o reflexo de ambiente fica
abaixo de 0,6, porque especular alto neste vermelho lê como neon.

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
