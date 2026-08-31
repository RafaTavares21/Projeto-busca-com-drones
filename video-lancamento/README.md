# NEVER BROKE AGAIN — DROP 01

Comercial vertical de lançamento, construído inteiramente de forma programática
com Remotion + React + Three.js. Sem After Effects, sem assets de vídeo, sem
geração por IA: cada frame é uma função pura do número do frame.

**Formato:** 1080 × 1920 (9:16) · 30 fps · 450 frames (15 s) · H.264

---

## Como rodar

```bash
npm install
npm run fonts     # gera a fonte typeface do Three.js a partir do TTF
npm run studio    # editor interativo em localhost:3000
npm run build     # renderiza out/never-broke-again-drop-01.mp4
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
nenhum erro**. O `remotion.config.ts` já usa o renderer `swangle`.

---

## Arquitetura

```
src/
├── Root.tsx                    Composição principal + cada cena isolada
├── timing.ts                   ← TIMELINE MESTRE (única fonte de ritmo)
├── compositions/DropOne.tsx    Montagem das 5 cenas + camada de transições
├── scenes/                     Uma cena por arquivo, só orquestração
├── components/                 Camada DOM/SVG (2D)
├── three/                      Camada WebGL (3D)
├── animations/                 Easing, molas, ruído, interpoladores
└── styles/                     Tokens de direção de arte e fontes
```

### Princípios

**Toda animação deriva de `useCurrentFrame()`.** Não há `setTimeout`,
`setInterval`, `Date.now()` nem o ticker do GSAP. O GSAP entra apenas como
biblioteca de curvas: `gsap.parseEase()` devolve uma função pura `(t) => t'`. A
física de mola vem do `spring()` do Remotion, resolvido analiticamente a partir
do frame. Até o "orgânico" — trepidação de câmera, poeira, respingos de tinta —
sai de `random()` semeado. O mesmo frame produz sempre o mesmo pixel, em
qualquer worker.

**Um único arquivo de ritmo.** Todos os beats vivem em `timing.ts`. Ajustar a
edição é mudar números lá, não caçar `delay` espalhado por cinco componentes.

**Assets carregam ACIMA do `<ThreeCanvas>`.** O Remotion desenha cada frame uma
única vez; uma fonte ou textura que chega por estado de um componente interno
nunca aparece, porque o canvas já fez seu draw. `TypefaceProvider` e
`ProductAssetProvider` seguram o frame via `delayRender` e só então montam a
árvore.

**Cenas não se sobrepõem.** Cada uma monta e desmonta seu próprio contexto
WebGL. A `TransitionLayer` global cobre exatamente o quadro em que a troca
acontece, o que é o que impede o remount de aparecer.

---

## Timeline

| # | Cena | Tempo | Conteúdo |
|---|------|-------|----------|
| 01 | IMPACT | 0 – 2.5 s | Pincelada vermelha, chicote de câmera, NEVER passando rente à lente |
| 02 | PRODUCT REVEAL | 2.5 – 6 s | Peça cresce de 0.15 → 1, dolly, luz vermelha rasante |
| 03 | PRODUCT INFORMATION | 6 – 9 s | Dois containers em direções opostas, escuro → vermelho |
| 04 | NEVER BROKE | 9 – 12 s | Colisão em profundidades opostas + `again` editorial |
| 05 | FINAL DROP | 12 – 15 s | Flash vermelho, lockup, DROP 01 / COMING SOON |

Cada cena também é registrada como composição isolada (`Scene01-Impact`, …)
para trabalhar 90 frames no Studio sem arrastar a timeline inteira.

---

## O produto

O asset oficial fica em `public/assets/` e é configurado num único lugar —
`PRODUCT`, em `src/three/productAsset.ts`:

```ts
export const PRODUCT = {
  sources: ['assets/camisa.png', 'assets/camisa.jpg'],  // tentados em ordem
  mode: 'print-on-garment',                             // ou 'cutout'
  matte: 'auto',
  matteRange: [0.02, 0.13],
  printScale: 0.62,
  printOffsetY: 0.04,
};
```

**Trocar a peça do próximo DROP é trocar o arquivo e, se necessário, o `mode`.**
Nenhuma cena precisa ser reescrita.

### Os dois modos

| modo | quando usar | o que acontece |
|------|-------------|----------------|
| `print-on-garment` | o arquivo é a **arte da estampa** (fundo chapado) | a arte é aplicada no peito de uma camiseta oversized construída em 3D |
| `cutout` | o arquivo é uma **foto da peça já recortada** | o próprio arquivo é o produto, como plano iluminado pela cena |

Se nenhum caminho de `sources` carregar, a cena cai na peça 3D lisa, sem
estampa. O comercial nunca quebra por falta de asset.

### Transparência

`matte: 'auto'` usa o canal alfa do arquivo quando ele existe; quando não
existe (um JPG, ou um PNG opaco), chaveia o fundo escuro. O corte usa o **canal
mais forte** do pixel, não a luminância perceptual — um vermelho saturado tem
luminância baixa e seria comido por um corte perceptual, que é exatamente o
vermelho da marca. O arquivo original nunca é alterado: o chaveamento acontece
uma vez em memória, no carregamento.

### Integração à cena

A peça é geometria real recebendo luz real — silhueta extrudada, mapa de trama
para quebrar o especular, gola canelada. A estampa é um plano rente à face
frontal com material PBR, então acompanha a rotação, escurece quando a peça sai
do facho e recebe a luz vermelha rasante junto com o tecido. Não é uma imagem
sobreposta ao vídeo.

---

## Fontes

| fonte | uso |
|-------|-----|
| Anton | tipografia de impacto, 2D e 3D extrudada |
| Archivo | HUD, ficha técnica, metadados |
| Playfair Display Italic | `again` — o contraponto editorial |

Todas auto-hospedadas em `public/fonts/`. Um CDN dentro do render seria fonte
de não determinismo e de frames com fallback tipográfico.

O Three.js não distribui fontes pelo npm e o `TextGeometry` só aceita o formato
`typeface`. `npm run fonts` converte o TTF da Anton via `opentype.js`
(`scripts/generate-typeface.mjs`) — rode de novo se trocar a fonte de display.

---

## Notas de implementação

**Pós-processamento em DOM, não em WebGL.** O `EffectComposer` do
`@react-three/postprocessing` não desenha sob o frameloop manual do
`<ThreeCanvas>`: o Remotion captura o frame sem o passe do composer e o
resultado sai preto — inclusive com um composer vazio. Vinheta, grão e
correção de cor são compostos como camadas DOM (`FilmTreatment`), o que
renderiza em qualquer máquina, custa uma fração do tempo por frame e continua
determinístico. O halo que o bloom daria é colocado à mão, onde a direção de
arte quer, pelo `<Glow>` aditivo.

**Motion blur é seletivo.** O `<Trail>` renderiza a subárvore várias vezes, então
só é montado nos frames de movimento violento. Na tipografia 3D o borrão vem de
cópias fantasma deslocadas em profundidade — muito mais barato que subframes.

**Máscaras de texto usam pixels, nunca `em`.** Um `height: 1em` num elemento
que não declara `font-size` resolve contra os 16px herdados do documento, e uma
linha de 236px aparece cortada numa faixa de 16 — sem quebrar nada, o texto
apenas some. `<MaskedLine>` calcula a altura a partir do `fontSize` e elimina a
classe inteira.

**Iluminação de peça plana.** Uma direcional forte ilumina uma superfície plana
por igual e a peça vira recorte de papel. A modelagem vem de um softbox com
queda (`topPosition` / `topAngle`) mais o ambiente procedural — um mapa
equiretangular pintado em memória e convertido por PMREM, sem HDRI de CDN.
