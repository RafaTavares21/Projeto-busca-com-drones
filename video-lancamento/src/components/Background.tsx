import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/tokens';
import { range } from '../animations/interpolate';
import { EASE } from '../animations/easings';

type Props = {
  /** Intensidade do halo central que separa o sujeito do fundo. */
  pool?: number;
  /** Deriva de parallax do fundo, em px. */
  parallax?: number;
  /** Acento vermelho por tras do sujeito. */
  redWash?: number;
  /** Textura grunge. Muito sutil por definicao — e acabamento, nao efeito. */
  grunge?: number;
};

/**
 * Fundo de estudio.
 *
 * Nao e um preto chapado: e um ciclorama, com um halo de luz atras do sujeito
 * que cai para o preto absoluto nas bordas. E esse degrade que cria a
 * profundidade entre produto, camera e fundo.
 */
export const Background: React.FC<Props> = ({ pool = 1, parallax = 0, redWash = 0, grunge = 0.4 }) => {
  const frame = useCurrentFrame();

  // Respiro lentissimo do fundo — impede que a imagem pareça congelada nos
  // trechos em que o sujeito quase nao se move.
  const breathe = range(frame, [0, 450], [0, 1], EASE.sineInOut);
  const shift = parallax * breathe;

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: COLORS.black }} />

      <AbsoluteFill
        style={{
          transform: `translate3d(${shift.toFixed(2)}px, ${(shift * 0.4).toFixed(2)}px, 0)`,
          background:
            `radial-gradient(105% 68% at 50% 42%, rgba(48,48,53,${(0.42 * pool).toFixed(3)}) 0%, ` +
            `rgba(20,20,23,${(0.22 * pool).toFixed(3)}) 44%, rgba(0,0,0,0) 88%)`,
        }}
      />

      {redWash > 0 ? (
        <AbsoluteFill
          style={{
            background:
              `radial-gradient(78% 52% at 50% 56%, rgba(225,6,0,${(0.26 * redWash).toFixed(3)}) 0%, ` +
              `rgba(122,4,0,${(0.10 * redWash).toFixed(3)}) 46%, rgba(0,0,0,0) 86%)`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}

      {grunge > 0 ? <GrungeTexture opacity={grunge} /> : null}
    </>
  );
};

/**
 * Textura grunge gerada em SVG.
 *
 * `feTurbulence` produz o ruido fractal inteiramente no navegador — sem asset,
 * sem download e sem variacao entre renders, ja que a semente e fixa.
 */
const GrungeTexture: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill style={{ opacity: opacity * 0.05, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="grunge">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.7" numOctaves={4} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grunge)" />
    </svg>
  </AbsoluteFill>
);
