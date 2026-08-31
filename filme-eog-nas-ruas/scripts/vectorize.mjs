/**
 * Vetorizacao de logo a partir de bitmap.
 *
 * Separa a arte por COR, tracja cada camada em curvas de Bezier e remonta um
 * SVG em camadas. Tracjar a imagem inteira de uma vez produziria um unico
 * contorno bilevel e perderia a separacao entre o letreiro e as maos — e e
 * justamente essa separacao que depois permite extrudar cada parte com
 * material proprio no 3D.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { Potrace } from 'potrace';

const SRC = process.argv[2];
const OUT = process.argv[3];
const SCALE = Number(process.argv[4] ?? 2);

/** Constroi uma mascara bilevel para uma camada de cor e a tracja. */
const traceLayer = (buffer, { turdSize, alphaMax }) =>
  new Promise((resolve, reject) => {
    const tracer = new Potrace({
      threshold: 128,
      // `turdSize` descarta manchas menores que N pixels: e o que limpa o
      // ruido de compressao do JPEG sem comer detalhe real do desenho.
      turdSize,
      // `alphaMax` controla quanto o tracjador arredonda os cantos. Baixo
      // preserva as pontas secas do letreiro, que sao a personalidade dele.
      alphaMax,
      optCurve: true,
      optTolerance: 0.18,
      blackOnWhite: true,
    });
    tracer.loadImage(buffer, (err) => {
      if (err) return reject(err);
      // Só o atributo `d` interessa: o SVG final e remontado a mao, em camadas.
      const svg = tracer.getSVG();
      const paths = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
      resolve(paths);
    });
  });

const run = async () => {
  const meta = await sharp(SRC).metadata();
  const W = Math.round(meta.width * SCALE);
  const H = Math.round(meta.height * SCALE);

  // Ampliar antes de tracjar entrega curvas mais fieis: o tracjador trabalha
  // no grid de pixels, entao mais pixels = menos degrau virando curva.
  const base = await sharp(SRC).resize(W, H, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer();

  const n = W * H;
  // Tres camadas, e nao duas: a arte tem branco, vermelho escuro e vermelho
  // claro, e e o par de vermelhos que da profundidade ao desenho das maos.
  // Fundir os dois num so achata o logo — foi o primeiro erro deste tracjado.
  const layers = { white: Buffer.alloc(n), redDark: Buffer.alloc(n), redLight: Buffer.alloc(n) };

  for (let i = 0; i < n; i++) {
    const r = base[i * 4];
    const g = base[i * 4 + 1];
    const b = base[i * 4 + 2];
    const a = base[i * 4 + 3];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const opaque = a > 110;

    const isRed = opaque && sat > 0.42 && r > g && r > b && r > 60;
    // Os dois vermelhos se separam pelo canal verde: o escuro fica em ~0, o
    // claro em ~64. Nenhuma outra medida os distingue de forma estavel.
    const isLightRed = isRed && g > 32;
    const isWhite = opaque && !isRed && max > 120;

    // Potrace lê preto como tinta, entao cada mascara e invertida.
    layers.white[i] = isWhite ? 0 : 255;
    layers.redDark[i] = isRed && !isLightRed ? 0 : 255;
    layers.redLight[i] = isLightRed ? 0 : 255;
  }

  const toPng = (mask) =>
    sharp(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();

  const [whitePaths, darkPaths, lightPaths] = await Promise.all([
    toPng(layers.white).then((b) => traceLayer(b, { turdSize: 8, alphaMax: 0.9 })),
    toPng(layers.redDark).then((b) => traceLayer(b, { turdSize: 8, alphaMax: 1.0 })),
    toPng(layers.redLight).then((b) => traceLayer(b, { turdSize: 8, alphaMax: 1.0 })),
  ]);

  // O SVG e montado em duas camadas nomeadas. O `SVGLoader` do three.js lê
  // cada `<path>` como um Shape, entao esta estrutura vira geometria
  // extrudavel direto, com material proprio por camada.
  // A ordem das camadas e a ordem de empilhamento do desenho original: o
  // letreiro atras, a mao escura sobre ele, a mao clara por cima.
  const group = (id, fill, paths) =>
    `  <g id="${id}" fill="${fill}" fill-rule="evenodd">\n` +
    paths.map((d) => `    <path d="${d}"/>`).join('\n') +
    `\n  </g>\n`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n` +
    group('letreiro', '#FFFFFF', whitePaths) +
    group('mao-fundo', '#C00000', darkPaths) +
    group('mao-frente', '#FF4040', lightPaths) +
    `</svg>\n`;

  fs.writeFileSync(OUT, svg);

  const count = (s) => (s.match(/[MmLlCcQqZz]/g) || []).length;
  console.log(`  ${path.basename(OUT)}`);
  console.log(`    resolucao de traçado: ${W}x${H}  (${SCALE}x a origem)`);
  const report = (label, paths) =>
    console.log(`    ${label.padEnd(11)} ${paths.length} contornos, ${paths.reduce((a, d) => a + count(d), 0)} segmentos`);
  report('letreiro:', whitePaths);
  report('mao fundo:', darkPaths);
  report('mao frente:', lightPaths);
  console.log(`    tamanho:  ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
};

run();
