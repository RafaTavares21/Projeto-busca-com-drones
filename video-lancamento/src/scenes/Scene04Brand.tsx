import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { Stage } from '../three/Stage';
import { Typography3D } from '../three/Typography3D';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { COLORS, FONTS, TRACKING } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.brand;

/**
 * CENA 04 — EOG DRIP (9s a 12s)
 *
 * As duas palavras chegam de profundidades opostas: EOG emerge do fundo do
 * espaco, DRIP vem de tras da lente. Elas se cruzam no plano da camera no
 * frame da colisao, e e esse encontro — nao um corte — que dispara a
 * trepidacao, o clarao e os estilhacos.
 *
 * Nada desliza horizontalmente. A tridimensionalidade vem da camera e da
 * profundidade real de cada palavra, e as duas tem massa diferente de
 * proposito: DRIP e mais extrudada, porque e a que chega por cima.
 */
export const Scene04Brand: React.FC = () => {
  const frame = useCurrentFrame();

  const eogIn = springAt(frame, 'heavy', {
    delay: B.eogIn[0],
    durationInFrames: B.eogIn[1] - B.eogIn[0],
  });
  const eogZ = range(eogIn, [0, 1], [-3300, -200]);

  const dripIn = springAt(frame, 'heavy', {
    delay: B.dripIn[0],
    durationInFrames: B.dripIn[1] - B.dripIn[0],
  });
  const dripZ = range(dripIn, [0, 1], [BASE_Z * 0.9, 220]);

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
          <Typography3D
            text="EOG"
            size={286}
            depth={120}
            position={[0, 178, eogZ]}
            opacity={inOut(frame, [B.eogIn[0], B.eogIn[0] + 8, B.exit[0], B.exit[1]])}
            faceColor={COLORS.white}
            sideColor="#0F0F0F"
            ghosts={eogIn < 0.9 ? 4 : 0}
            ghostOffset={[0, 0, -280]}
            ghostOpacity={0.09 * (1 - eogIn)}
          />

          <Typography3D
            text="DRIP"
            size={286}
            depth={176}
            position={[0, -142, dripZ]}
            opacity={inOut(frame, [B.dripIn[0], B.dripIn[0] + 8, B.exit[0], B.exit[1]])}
            faceColor={COLORS.white}
            sideColor={COLORS.redDeep}
            sideEmissive={flash > 0.05 ? COLORS.red : undefined}
            sideEmissiveIntensity={flash * 1.6}
            ghosts={dripIn < 0.9 ? 4 : 0}
            ghostOffset={[0, 0, 300]}
            ghostOpacity={0.09 * (1 - dripIn)}
          />
        </group>
      </Stage>

      {/* A assinatura: depois do choque, a marca escrita por extenso, calma. */}
      <AbsoluteFill style={{ alignItems: 'center' }}>
        <MaskedLine
          reveal={signatureMask}
          fontSize={40}
          lineHeight={1.5}
          travel={140}
          style={{
            // Ancorado em coordenada absoluta: a tipografia 3D vive no espaco
            // da cena e nao participa do fluxo, entao centralizar as duas
            // juntas as sobreporia.
            position: 'absolute',
            top: 1360,
            transform: `translateX(${(driftX * -0.3).toFixed(1)}px)`,
          }}
          textStyle={{
            fontFamily: FONTS.editorial,
            fontStyle: 'italic',
            fontWeight: 500,
            letterSpacing: TRACKING.wide,
            color: COLORS.bone,
            opacity: signature,
          }}
        >
          eog drip
        </MaskedLine>
      </AbsoluteFill>

      <FilmTreatment vignette={0.9} />
    </AbsoluteFill>
  );
};
