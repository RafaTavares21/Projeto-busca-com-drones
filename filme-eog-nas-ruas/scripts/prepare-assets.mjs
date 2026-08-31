/**
 * Prepara os assets da campanha EOG NAS RUAS.
 *
 * Roda em tres frentes:
 *
 *   1. VETORIZA o letreiro da marca. O logo chega como bitmap, e um bitmap
 *      nao pode ser extrudado como geometria — so empilhado em camadas
 *      chapadas. Tracjar as curvas primeiro e o que permite ao `LogoExtruded`
 *      construir volume de verdade, com bisel e luz correndo na aresta.
 *   2. RECORTA as maos vermelhas, que chegam sobre fundo preto chapado.
 *   3. NORMALIZA a fotografia: as fotos vem em resolucoes muito diferentes
 *      (de 1,6 a 24,5 MP) e a direcao precisa saber quais aguentam movimento
 *      de camera pesado. O relatorio no fim do script diz exatamente isso.
 *
 * Os originais ficam intactos em `public/assets/source/`.
 * Rodar com: npm run assets
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public/assets/source');
const OUT = path.join(root, 'public/assets');

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Chaveia o fundo escuro de uma arte chapada e corta a moldura vazia. */
const cutout = async (name, { lo = 0.04, hi = 0.16, pad = 8 } = {}) => {
  const { data, info } = await sharp(path.join(SRC, `${name}.jpg`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // O corte usa o canal MAIS FORTE, e nao a luminancia perceptual: as maos
      // sao vermelho saturado, que tem luminancia baixa e seria comido por um
      // corte perceptual — justamente a cor da marca.
      const level = Math.max(data[i], data[i + 1], data[i + 2]) / 255;
      const alpha = Math.round(255 * smoothstep(lo, hi, level));
      data[i + 3] = alpha;
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({
      left,
      top,
      width: Math.min(w - left, maxX - minX + 1 + pad * 2),
      height: Math.min(h - top, maxY - minY + 1 + pad * 2),
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${name}.png`));

  console.log(`  ${name}.png`.padEnd(30) + `${out.width}x${out.height}   recortado`);
};

/** Copia uma fotografia, com nitidez leve para sobreviver a ampliacao em cena. */
const photo = async (name, ext = 'png') => {
  const src = path.join(SRC, `${name}.${ext}`);
  const dest = path.join(OUT, `${name}.jpg`);
  const info = await sharp(src).sharpen({ sigma: 0.5 }).jpeg({ quality: 92 }).toFile(dest);
  const mp = (info.width * info.height) / 1e6;
  // Ate quanto a foto pode ser ampliada antes de amolecer, considerando um
  // quadro de 1080x1920. Este numero e o que decide onde a camera pode andar.
  const headroom = Math.min(info.width / 1080, info.height / 1920);
  const uso = headroom >= 2 ? 'CLOSE E MOVIMENTO' : headroom >= 1 ? 'quadro cheio' : 'plano medio';
  console.log(
    `  ${name}.jpg`.padEnd(30) +
      `${info.width}x${info.height}`.padEnd(12) +
      `${mp.toFixed(1)} MP   folga ${headroom.toFixed(2)}x   ${uso}`,
  );
};

console.log('\nVETOR');
execFileSync(
  'node',
  [
    path.join(root, 'scripts/vectorize.mjs'),
    path.join(SRC, 'logo-eog.jpg'),
    path.join(OUT, 'logo.svg'),
    '3',
  ],
  { stdio: 'inherit' },
);

console.log('\nARTE CHAPADA');
await cutout('maos');

console.log('\nFOTOGRAFIA');
await photo('theatro-hero', 'jpg');
await photo('theatro-regata', 'jpg');
for (const n of [
  'torre-preta', 'dupla-chevron', 'trio-noite', 'costas-noite',
  'portao-dia', 'balaustrada', 'trio-torre', 'portao-trio',
]) {
  await photo(n);
}

console.log('');
