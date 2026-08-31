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
 * Fatia uma peca de um recorte que ja veio com canal alfa.
 *
 * A marca forneceu as duas pecas ja recortadas num unico PNG. Isso substitui
 * qualquer tentativa de segmentar automaticamente — e vale registrar por que
 * era impossivel: na foto original a peca e preta, o fundo e uma persiana
 * preta, e a varredura da borda vai de 2 a 48 em luminancia sem nenhum degrau.
 * Nao havia contorno na imagem para um algoritmo achar.
 *
 * Aqui o trabalho e so separar: recorta a peca pedida, descarta a cabeca do
 * modelo que aparece entre as duas, e corta a moldura transparente para que a
 * peca passe a ser posicionada pela propria proporcao.
 */
const splitCutout = async (name, source, box) => {
  const src = path.join(SRC, source);
  const dest = path.join(OUT, `${name}.png`);

  // Dois passes de proposito: o sharp aplica `trim` antes de `extract` dentro
  // do mesmo pipeline, entao encadear os dois recortaria a moldura da imagem
  // inteira primeiro e a caixa cairia fora dos limites.
  const sliced = await sharp(src).extract(box).png().toBuffer();
  const out = await sharp(sliced).trim({ threshold: 2 }).png({ compressionLevel: 9 }).toFile(dest);

  console.log(`  ${name}.png  ${out.width}x${out.height}  (fatiado do recorte da marca)`);
};

/** A foto do produto nao e chaveada: ela e uma fotografia, nao uma arte. */
const photo = async (name, source, box) => {
  const src = path.join(SRC, source);
  const dest = path.join(OUT, `${name}.jpg`);
  const meta = await sharp(src).metadata();

  const pipeline = sharp(src);
  if (box) pipeline.extract(box);

  // Nitidez leve: a foto e ampliada em cena e a ampliacao come micro-contraste.
  const info = await pipeline.sharpen({ sigma: 0.6 }).jpeg({ quality: 95 }).toFile(dest);
  console.log(`  ${name}.jpg  ${info.width}x${info.height}  (origem ${meta.width}x${meta.height})`);
};

console.log('Preparando assets do produto...');
await cutout('print-front', { lo: 0.05, hi: 0.20 });
await cutout('hands', { lo: 0.04, hi: 0.16 });
await photo('product-worn', 'poster.jpg', { left: 40, top: 596, width: 812, height: 336 });

// As duas pecas vem do poster de campanha, e nao do post: la elas estao
// fotografadas em flat-lay isolado, sem os jeans e a mao do modelo por cima,
// o que da uma silhueta limpa. O preco e resolucao — ver as notas do README.
// A cabeca do modelo aparece entre as duas pecas, a partir de y=244. As caixas
// param antes disso, entao cada peca sai limpa sem precisar mascarar nada.
await splitCutout('shirt-front', 'shirts-cutout.png', { left: 88, top: 0, width: 300, height: 244 });
await splitCutout('shirt-back', 'shirts-cutout.png', { left: 478, top: 0, width: 292, height: 236 });
console.log('Concluido.');
