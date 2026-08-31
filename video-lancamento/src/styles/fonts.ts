import { continueRender, delayRender, staticFile } from 'remotion';

/**
 * Carregamento de fontes auto-hospedadas.
 *
 * As fontes ficam em /public e nao em um CDN: o render roda em paralelo em
 * varios workers e qualquer requisicao externa vira uma fonte de nao
 * determinismo (e de frames com fallback tipografico).
 *
 * O `delayRender` garante que nenhum frame seja capturado antes dos arquivos
 * estarem prontos.
 */
const FACES: Array<{ family: string; file: string; descriptors: FontFaceDescriptors }> = [
  { family: 'Anton', file: 'fonts/Anton-Regular.ttf', descriptors: { weight: '400', style: 'normal' } },
  { family: 'Archivo', file: 'fonts/Archivo-Variable.ttf', descriptors: { weight: '100 900', style: 'normal' } },
  { family: 'Playfair Display', file: 'fonts/PlayfairDisplay-Italic.ttf', descriptors: { weight: '400 900', style: 'italic' } },
];

let started = false;

export const loadBrandFonts = (): void => {
  if (started || typeof document === 'undefined') {
    return;
  }
  started = true;

  const handle = delayRender('Carregando fontes da marca');

  Promise.all(
    FACES.map(async ({ family, file, descriptors }) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, descriptors);
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      // Falhar alto: um frame renderizado com fonte de fallback e refugo.
      throw new Error(`Falha ao carregar as fontes da marca: ${(err as Error).message}`);
    });
};
