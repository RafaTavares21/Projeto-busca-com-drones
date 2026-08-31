import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { Stage } from '../three/Stage';
import { Logo3D } from '../three/Logo3D';
import { RedHandTransition } from '../three/RedHandTransition';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { BRAND, COLORS, FONTS, TRACKING } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.brand;

/**
 * CENA 04 — EOG DRIP (9s a 12s)
 *
 * O letreiro da marca emerge do fundo do espaco, extrudado, e cresce ate
 * dominar o quadro. A mao vermelha vem da direcao oposta, de tras da lente, e
 * as duas se encontram no plano da camera: e esse encontro — nao um corte —
 * que dispara a trepidacao, o clarao e os estilhacos.
 *
 * Os dois elementos sao a mesma identidade vista de dois jeitos: o letreiro
 * traz as maos dentro dele, e a mao que colide e a mesma, isolada. Nada
 * desliza horizontalmente; a tridimensionalidade vem da camera e da
 * profundidade real de cada elemento.
 */
export const Scene04Brand: React.FC = () => {
  const frame = useCurrentFrame();

  const logoIn = springAt(frame, 'heavy', {
    delay: B.eogIn[0],
    durationInFrames: B.eogIn[1] - B.eogIn[0],
  });
  const logoZ = range(logoIn, [0, 1], [-3200, -150]);
  // Giro que atravessa a colisao: e ele que mantem a parede da extrusao visivel
  // depois do impacto, em vez de deixar o letreiro chapado de frente.
  const logoSpin = range(progress(frame, 0, 90, EASE.glide), [0, 1], [0.62, -0.28]);

  const shock = pulse(frame, B.shock[0], B.shock[1], 0.12);
  const flash = pulse(frame, B.collision - 2, B.collision + 10, 0.16);

  // Deriva lenta depois do impacto: mantem o bloco vivo sem texto tremendo.
  const drift = progress(frame, B.drift[0], B.drift[1], EASE.sineInOut);
  const driftRotY = range(drift, [0, 1], [-0.07, 0.05]);
  const driftX = range(drift, [0, 1], [54, -54]);

  const signature = progress(frame, B.signature[0], B.signature[1], EASE.editorial);
  const signatureMask = progress(frame, B.signature[0], B.signature[0] + 18, EASE.expoOut);

  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.36 + flash * 0.5} redWash={flash * 0.9 + 0.14} grunge={0.5} parallax={-20} />

      <Stage exposure={1.04} redBounce={0.7 + flash * 0.8}>
        <CameraRig
          position={[driftX, 0, BASE_Z]}
          handheld={6}
          shake={shock * 30}
          roll={driftRotY * 0.14}
          seed="brand"
        />
        <Lighting key={2.5} fill={0.16} rim={2 + flash * 9} rimPosition={[440, 60, -820]} top={1} ambient={0.06} />

        <Glow position={[0, 0, -520]} size={2500} color={COLORS.redHot} intensity={flash * 0.5 + 0.05} />

        {/* Estilhacos disparados no impacto, nunca antes. */}
        <Particles
          count={24}
          radius={980}
          depth={1900}
          size={6}
          shard
          color={COLORS.red}
          drift={[240, 130, 400]}
          opacity={0.28 * (1 - drift * 0.65)}
          startFrame={B.collision}
          seed="brand-shards"
        />

        <group rotation={[0, driftRotY, 0]}>
          <Logo3D
            height={742}
            position={[0, 40, logoZ]}
            rotation={[0, logoSpin, 0]}
            opacity={inOut(frame, [B.eogIn[0], B.eogIn[0] + 8, B.exit[0], B.exit[1]])}
            depth={140}
            layers={34}
            exposure={0.98 + flash * 0.45}
            ghosts={logoIn < 0.9 ? 4 : 0}
            ghostOffset={[0, 0, -320]}
            ghostOpacity={0.09 * (1 - logoIn)}
          />
        </group>

        {/* A mao vem da direcao oposta, de tras da lente, e colide com o
            letreiro. Os dois sao a mesma identidade vista de dois jeitos. */}
        <RedHandTransition
          frame={frame}
          window={[B.dripIn[0], B.dripIn[0] + 32]}
          from="right"
          coverage={1.2}
          tilt={-16}
          z={1250}
          motion="slash"
        />
      </Stage>

      {/* A assinatura: depois do choque, a marca escrita por extenso, calma. */}
      <AbsoluteFill style={{ alignItems: 'center' }}>
        <MaskedLine
          reveal={signatureMask}
          fontSize={26}
          lineHeight={1.5}
          travel={140}
          style={{
            // Ancorado em coordenada absoluta: a tipografia 3D vive no espaco
            // da cena e nao participa do fluxo, entao centralizar as duas
            // juntas as sobreporia.
            position: 'absolute',
            top: 1430,
            transform: `translateX(${(driftX * -0.3).toFixed(1)}px)`,
          }}
          textStyle={{
            fontFamily: FONTS.grotesque,
            fontWeight: 600,
            letterSpacing: TRACKING.widest,
            textTransform: 'uppercase',
            color: COLORS.ash,
            opacity: signature,
          }}
        >
          {BRAND.tagline}
        </MaskedLine>
      </AbsoluteFill>

      <FilmTreatment vignette={0.9} />
    </AbsoluteFill>
  );
};
