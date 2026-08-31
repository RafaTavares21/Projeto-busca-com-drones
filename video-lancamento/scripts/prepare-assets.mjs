/**
 * Prepara os assets oficiais do produto para o pipeline.
 *
 * As artes chegam como JPEG sobre fundo preto chapado — sem canal alfa e com
 * o halo de compressao tipico do JPEG em volta das bordas duras. Este passo
 * resolve as duas coisas de uma vez:
 *
 *   1. recorta o fundo por chaveamento e grava um PNG com alfa real;
 *   2. corta a moldura vazia, para que a arte possa ser posicionada pela sua
 *      propria proporcao, sem offsets magicos espalhados pelas cenas.
 *
 * O chaveamento usa o CANAL MAIS FORTE do pixel, nao a luminancia perceptual:
 * as maos sao vermelho saturado, que tem luminancia baixa e seria comido por
 * um corte perceptual. Os arquivos originais ficam intactos em
 * `public/assets/source/`.
 *
 * Rodar com: npm run assets
 */
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

/** Recorta o fundo escuro e devolve o buffer RGBA + a caixa do conteudo. */
const keyBackground = async (file, { lo = 0.05, hi = 0.20 } = {}) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
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

  if (maxX < 0) {
    throw new Error(`${path.basename(file)}: nada sobrou apos o chaveamento`);
  }

  return { data, w, h, box: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } };
};

/** Chaveia, corta a moldura vazia e grava um PNG com alfa. */
const cutout = async (name, { lo, hi, pad = 8 } = {}) => {
  const src = path.join(SRC, `${name}.jpg`);
  const dest = path.join(OUT, `${name}.png`);

  const { data, w, h, box } = await keyBackground(src, { lo, hi });

  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const width = Math.min(w - left, box.width + pad * 2);
  const height = Math.min(h - top, box.height + pad * 2);

  const info = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9 })
    .toFile(dest);

  console.log(
    `  ${name}.png  ${info.width}x${info.height}  ` +
      `(recortado de ${w}x${h}, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`,
  );
};

/**
 * Recorta uma peca da foto de campanha e a prepara como PLACA.
 *
 * As duas pecas foram fotografadas apoiadas sobre o modelo, entao um recorte
 * retangular traz junto jeans, degraus e a mao dele. Chavear nao resolve: a
 * peca e preta, parte do fundo tambem e, e a estampa e branca — nao existe
 * limiar que separe os tres.
 *
 * A solucao e otica em vez de geometrica: uma queda suave de alfa nas bordas
 * faz o contexto se dissolver no preto do filme, e o que sobra e a peca. Numa
 * composicao de fundo preto isso lê como iluminacao, nao como recorte.
 */
const plate = async (name, box, { falloff = 0.38, contrast = 1.1 } = {}) => {
  const src = path.join(SRC, 'campaign-post.jpg');
  const dest = path.join(OUT, `${name}.png`);

  const cropped = await sharp(src)
    .extract(box)
    .linear(contrast, -(128 * contrast) + 128)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const { width: w, height: h } = info;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Distancia normalizada ate a borda mais proxima, em cada eixo.
      const dx = Math.min(x, w - 1 - x) / (w * falloff);
      const dy = Math.min(y, h - 1 - y) / (h * falloff);
      const edge = Math.min(1, Math.min(dx, dy));
      // smoothstep: a borda nao pode ter emenda visivel.
      const a = edge * edge * (3 - 2 * edge);
      const i = (y * w + x) * 4;
      data[i + 3] = Math.round(255 * a);
    }
  }

  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(dest);

  console.log(`  ${name}.png  ${out.width}x${out.height}  (placa da foto de campanha)`);
};

/** A foto do produto nao e chaveada: ela e uma fotografia, nao uma arte. */
const photo = async (name) => {
  const src = path.join(SRC, `${name}.jpg`);
  const dest = path.join(OUT, `${name}.jpg`);
  const meta = await sharp(src).metadata();

  // Nitidez leve: a foto e ampliada em cena e a ampliacao come micro-contraste.
  const info = await sharp(src).sharpen({ sigma: 0.6 }).jpeg({ quality: 94 }).toFile(dest);
  console.log(`  ${name}.jpg  ${info.width}x${info.height}  (origem ${meta.width}x${meta.height})`);
};

console.log('Preparando assets do produto...');
await cutout('print-front', { lo: 0.05, hi: 0.20 });
await cutout('hands', { lo: 0.04, hi: 0.16 });
await photo('product-back');

// As duas pecas, recortadas da foto de campanha do @eog.drip.
// As caixas foram medidas na foto ja sem a interface do Instagram; o offset
// vertical de 394px recoloca cada uma nas coordenadas do arquivo original.
const UI_OFFSET = 394;
await plate('shirt-front', { left: 188, top: 672 + UI_OFFSET, width: 432, height: 452 });
await plate('shirt-back', { left: 716, top: 672 + UI_OFFSET, width: 436, height: 446 });
console.log('Concluido.');
