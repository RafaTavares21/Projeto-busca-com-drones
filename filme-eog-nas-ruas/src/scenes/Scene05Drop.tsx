import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { Stage } from '../three/Stage';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { progress, pulse, range, rad } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { BRAND, COLORS, FONTS, TRACKING } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.drop;

/**
 * CENA 05 — DROP (17.5s a 20s)
 *
 * Preto. Um clarao vermelho de tres frames. Seis frames de silencio — e essa
 * pausa que da peso ao que vem depois. Entao a assinatura.
 *
 * Depois de vinte segundos de profundidade, o fecho ganha forca por quase
 * abandona-la: o letreiro para de girar e assenta quase de frente, e o resto e
 * tipografia plana. O ultimo frame precisa aguentar ser visto parado.
 */
export const Scene05Drop: React.FC = () => {
  const frame = useCurrentFrame();

  const clarao = pulse(frame, B.clarao[0], B.clarao[1], 0.3);

  const marca = springAt(frame, 'solid', {
    delay: B.marca[0],
    durationInFrames: B.marca[1] - B.marca[0],
  });
  // Giro que desacelera ate quase parar: a marca chega e assenta.
  const giro = range(progress(frame, B.marca[0], B.marca[1] + 16, EASE.expoOut), [0, 1], [0.5, 0.04]);

  const regua = progress(frame, B.regua[0], B.regua[1], EASE.power4Out);
  const breve = springAt(frame, 'snap', { delay: B.breve[0], durationInFrames: B.breve[1] - B.breve[0] });
  const contato = progress(frame, B.contato[0], B.contato[1], EASE.power3Out);
  const fim = 1 - progress(frame, B.fim[0], B.fim[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: fim }}>
      <Background pool={0.14 + clarao * 0.6} redWash={clarao} grunge={0.34} />

      {clarao > 0 ? (
        <AbsoluteFill style={{ backgroundColor: COLORS.red, opacity: clarao * 0.9, mixBlendMode: 'screen' }} />
      ) : null}

      <Stage exposure={1.04} environmentIntensity={0.6} redBounce={0.6}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={3} seed="drop" />
        <Lighting key={2.4} fill={0.18} rim={3} rimPosition={[-480, 220, -640]} top={2.6} ambient={0.08} />
        <LogoExtruded
          height={470 * marca}
          position={[0, HEIGHT * 0.11, 240]}
          rotation={[rad(-2), giro, 0]}
          finish={1}
          opacity={marca}
          exposure={1.15}
        />
      </Stage>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: HEIGHT * 0.42,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 420,
            height: 1,
            background: COLORS.ashDim,
            transform: `scaleX(${regua.toFixed(4)})`,
          }}
        />

        <div
          style={{
            marginTop: 52,
            fontFamily: FONTS.display,
            fontSize: 104,
            letterSpacing: TRACKING.wide,
            color: COLORS.red,
            transform: `scale(${range(breve, [0, 1], [0.24, 1]).toFixed(4)})`,
            opacity: breve,
          }}
        >
          {BRAND.status}
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 26,
            alignItems: 'baseline',
            fontFamily: FONTS.grotesque,
            fontSize: 25,
            fontWeight: 600,
            letterSpacing: TRACKING.wider,
            textTransform: 'uppercase',
            color: COLORS.ash,
            opacity: contato,
            transform: `translateY(${((1 - contato) * 18).toFixed(1)}px)`,
          }}
        >
          <span>{BRAND.handle}</span>
          <span style={{ color: COLORS.ashDim }}>·</span>
          <span>{BRAND.site}</span>
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.78} grain={0.042} />
    </AbsoluteFill>
  );
};
