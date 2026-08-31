/**
 * Gera um arquivo `*.typeface.json` (formato facetype/three.js) a partir de um TTF.
 *
 * O `three` nao distribui fontes pelo npm e o `TextGeometry` so aceita o formato
 * typeface, entao a extrusao 3D da tipografia depende deste passo de build.
 * Rodar com: npm run fonts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Apenas o subconjunto usado no comercial. Manter o arquivo pequeno importa:
// ele e baixado e parseado a cada frame renderizado em paralelo.
const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  '0123456789' +
  " .,:;!?'\"/-—–_&+#()[]°%";

const round = (n) => Math.round(n * 100) / 100;

/**
 * opentype.js entrega os contornos em coordenadas de tela (y para baixo);
 * o formato typeface espera y para cima, entao invertemos de volta.
 * A ordem dos tokens segue o parser do three.js `FontLoader`: em `q` e `b` o
 * ponto FINAL vem antes dos pontos de controle.
 */
function encodeOutline(commands, scale) {
  const out = [];
  const sx = (v) => round(v * scale);
  const sy = (v) => round(-v * scale);

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        out.push('m', sx(cmd.x), sy(cmd.y));
        break;
      case 'L':
        out.push('l', sx(cmd.x), sy(cmd.y));
        break;
      case 'Q':
        out.push('q', sx(cmd.x), sy(cmd.y), sx(cmd.x1), sy(cmd.y1));
        break;
      case 'C':
        out.push('b', sx(cmd.x), sy(cmd.y), sx(cmd.x1), sy(cmd.y1), sx(cmd.x2), sy(cmd.y2));
        break;
      case 'Z':
        break;
      default:
        throw new Error(`Comando de contorno nao suportado: ${cmd.type}`);
    }
  }
  return out.join(' ');
}

function convert(ttfPath, outPath, { resolution = 1000 } = {}) {
  const buf = fs.readFileSync(ttfPath);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

  const unitsPerEm = font.unitsPerEm;
  const scale = resolution / unitsPerEm;

  const glyphs = {};
  const bbox = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity };

  for (const char of new Set(CHARSET)) {
    const glyph = font.charToGlyph(char);
    if (!glyph || glyph.index === 0) {
      console.warn(`  ! glifo ausente para ${JSON.stringify(char)} — ignorado`);
      continue;
    }

    // fontSize = unitsPerEm faz o opentype devolver as coordenadas 1:1 em
    // unidades de fonte; o `scale` acima e aplicado dentro de encodeOutline.
    const { commands } = glyph.getPath(0, 0, unitsPerEm);

    const entry = {
      ha: round((glyph.advanceWidth ?? 0) * scale),
      x_min: round((glyph.xMin ?? 0) * scale),
      x_max: round((glyph.xMax ?? 0) * scale),
      o: encodeOutline(commands, scale),
    };

    glyphs[char] = entry;
    bbox.xMin = Math.min(bbox.xMin, entry.x_min);
    bbox.xMax = Math.max(bbox.xMax, entry.x_max);
    bbox.yMin = Math.min(bbox.yMin, round((glyph.yMin ?? 0) * scale));
    bbox.yMax = Math.max(bbox.yMax, round((glyph.yMax ?? 0) * scale));
  }

  const typeface = {
    glyphs,
    familyName: font.names.fontFamily?.en ?? path.basename(ttfPath, '.ttf'),
    ascender: round(font.ascender * scale),
    descender: round(font.descender * scale),
    underlinePosition: round((font.tables.post?.underlinePosition ?? -100) * scale),
    underlineThickness: round((font.tables.post?.underlineThickness ?? 50) * scale),
    boundingBox: bbox,
    resolution,
    original_font_information: {
      fontFamily: font.names.fontFamily?.en,
      fontSubfamily: font.names.fontSubfamily?.en,
      license: font.names.license?.en,
    },
    cssFontWeight: 'normal',
    cssFontStyle: 'normal',
  };

  fs.writeFileSync(outPath, JSON.stringify(typeface));
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`  -> ${path.relative(root, outPath)}  (${Object.keys(glyphs).length} glifos, ${kb} KB)`);
}

const JOBS = [
  ['public/fonts/Anton-Regular.ttf', 'public/fonts/anton.typeface.json'],
];

console.log('Gerando fontes typeface para o three.js...');
for (const [src, dest] of JOBS) {
  console.log(`  ${src}`);
  convert(path.join(root, src), path.join(root, dest));
}
console.log('Concluido.');
