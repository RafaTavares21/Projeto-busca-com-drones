import { useMemo } from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { GRAIN } from '../timing';

type Props = {
  /** Intensidade do grao. 0 desliga. */
  grain?: number;
  /** Escurecimento das bordas. */
  vignette?: number;
  /** Leve dominante quente/fria, para tirar o digital do preto. */
  grade?: boolean;
};

/**
 * Tratamento de lente e pelicula, composto em DOM sobre o canvas 3D.
 *
 * Uma cadeia de pos-processamento em WebGL seria o caminho obvio, mas o
 * `EffectComposer` nao desenha sob o frameloop manual do `<ThreeCanvas>` — o
 * Remotion captura o frame sem o passe do composer e o resultado sai preto.
 * Fazer o acabamento em DOM tem tres vantagens praticas: renderiza em qualquer
 * maquina sem GPU, custa uma fracao do tempo por frame, e continua 100%
 * deterministico porque o grao vem de `random()` semeado pelo numero do frame.
 */
export const FilmTreatment: React.FC<Props> = ({ grain = GRAIN.opacity, vignette = 0.9, grade = true }) => {
  const frame = useCurrentFrame();

  // Um punhado de ladrilhos gerados uma unica vez e alternados ao longo do
  // tempo. Regenerar ruido a cada frame custaria caro e, a 30 fps, treme demais.
  const tiles = useMemo(() => {
    if (grain <= 0 || typeof document === 'undefined') return [];
    const size = GRAIN.tile;
    return Array.from({ length: 8 }, (_, t) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        // Ruido monocromatico: grao colorido leria como artefato de compressao.
        const v = random(`grain:${t}:${i}`) * 255;
        img.data[i * 4 + 0] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL();
    });
  }, [grain]);

  const step = Math.floor(frame / GRAIN.holdFrames);
  const tile = tiles.length > 0 ? tiles[step % tiles.length] : undefined;

  // Deslocar o ladrilho evita que o olho perceba a repeticao da textura.
  const offsetX = Math.floor(random(`grain-x:${step}`) * GRAIN.tile);
  const offsetY = Math.floor(random(`grain-y:${step}`) * GRAIN.tile);

  return (
    <>
      {grade ? (
        <AbsoluteFill
          style={{
            // Sombra levemente fria e alta luz levemente quente: e o que separa
            // um preto "de camera" de um preto "de CSS".
            background:
              'radial-gradient(120% 80% at 50% 38%, rgba(255,244,232,0.045) 0%, rgba(0,0,0,0) 55%),' +
              'linear-gradient(180deg, rgba(10,14,24,0.10) 0%, rgba(0,0,0,0) 40%, rgba(6,8,14,0.14) 100%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            // Queda longa e tardia. Uma vinheta que comeca cedo lê como
            // mascara circular colada sobre a imagem, nao como lente.
            background: `radial-gradient(112% 82% at 50% 45%, rgba(0,0,0,0) 46%, rgba(0,0,0,${(
              vignette * 0.34
            ).toFixed(3)}) 76%, rgba(0,0,0,${(vignette * 0.86).toFixed(3)}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {tile ? (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${tile})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: `${offsetX}px ${offsetY}px`,
            opacity: grain,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </>
  );
};
