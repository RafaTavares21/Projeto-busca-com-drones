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
import { COLORS, FONTS } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.neverBroke;

/**
 * CENA 04 — NEVER BROKE (9s a 12s)
 *
 * As duas palavras chegam de profundidades opostas: NEVER emerge do fundo do
 * espaco, BROKE vem de tras da lente. Elas se cruzam no plano da camera no
 * frame da colisao, e e esse encontro — nao um corte — que dispara a trepidacao,
 * o clarao e os estilhacos.
 *
 * AGAIN entra depois, em serifa italica e por mascara: o contraponto editorial
 * que impede o bloco de virar apenas tipografia pesada.
 */
export const Scene04NeverBroke: React.FC = () => {
  const frame = useCurrentFrame();

  // --- NEVER: vem de tras --------------------------------------------------
  const neverIn = springAt(frame, 'heavy', {
    delay: B.neverIn[0],
    durationInFrames: B.neverIn[1] - B.neverIn[0],
  });
  const neverZ = range(neverIn, [0, 1], [-3400, -180]);

  // --- BROKE: vem da frente ------------------------------------------------
  const brokeIn = springAt(frame, 'heavy', {
    delay: B.brokeIn[0],
    durationInFrames: B.brokeIn[1] - B.brokeIn[0],
  });
  const brokeZ = range(brokeIn, [0, 1], [BASE_Z * 0.92, 200]);

  // --- Colisao -------------------------------------------------------------
  // Uma unica reacao curta, com decaimento rapido. Prolongar isto viraria efeito.
  const shock = pulse(frame, B.collisionShock[0], B.collisionShock[1], 0.12);
  const flash = pulse(frame, B.collision - 2, B.collision + 10, 0.16);

  // --- Deriva de perspectiva -----------------------------------------------
  // Movimento lento e continuo depois da colisao: mantem o bloco vivo sem
  // recorrer a texto tremendo.
  const drift = progress(frame, B.perspectiveDrift[0], B.perspectiveDrift[1], EASE.sineInOut);
  const driftRotY = range(drift, [0, 1], [-0.075, 0.055]);
  const driftX = range(drift, [0, 1], [58, -58]);

  // --- AGAIN ---------------------------------------------------------------
  const again = progress(frame, B.againReveal[0], B.againReveal[1], EASE.editorial);
  const againMask = progress(frame, B.againReveal[0], B.againReveal[0] + 20, EASE.expoOut);

  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.42 + flash * 0.5} redWash={flash * 0.9 + 0.18} grunge={0.5} parallax={-22} />

      <Stage exposure={1.04} redBounce={0.7 + flash * 0.8}>
        <CameraRig
          position={[driftX, 0, BASE_Z]}
          handheld={6}
          shake={shock * 34}
          roll={driftRotY * 0.14}
          seed="collide"
        />
        <Lighting
          key={2.7}
          fill={0.16}
          rim={2.2 + flash * 9}
          rimPosition={[420, 60, -820]}
          top={1}
          ambient={0.06}
        />

        <Glow position={[0, 0, -500]} size={2600} color={COLORS.redHot} intensity={flash * 0.5 + 0.06} />

        {/* Estilhacos disparados no impacto, nao antes. */}
        <Particles
          count={26}
          radius={1000}
          depth={2000}
          size={6}
          shard
          color={COLORS.red}
          drift={[260, 140, 420]}
          opacity={0.3 * (1 - drift * 0.6)}
          startFrame={B.collision}
          seed="collision-shards"
        />

        <group rotation={[0, driftRotY, 0]}>
          <Typography3D
            text="NEVER"
            size={252}
            depth={116}
            position={[0, 168, neverZ]}
            opacity={inOut(frame, [B.neverIn[0], B.neverIn[0] + 8, B.exit[0], B.exit[1]])}
            faceColor={COLORS.white}
            sideColor="#101010"
            ghosts={neverIn < 0.9 ? 4 : 0}
            ghostOffset={[0, 0, -260]}
            ghostOpacity={0.09 * (1 - neverIn)}
          />

          {/* Profundidade deliberadamente diferente: BROKE e a palavra mais
              proxima e mais massiva das duas. */}
          <Typography3D
            text="BROKE"
            size={252}
            depth={168}
            position={[0, -132, brokeZ]}
            opacity={inOut(frame, [B.brokeIn[0], B.brokeIn[0] + 8, B.exit[0], B.exit[1]])}
            faceColor={COLORS.white}
            sideColor={COLORS.redDeep}
            sideEmissive={flash > 0.05 ? COLORS.red : undefined}
            sideEmissiveIntensity={flash * 1.6}
            ghosts={brokeIn < 0.9 ? 4 : 0}
            ghostOffset={[0, 0, 320]}
            ghostOpacity={0.09 * (1 - brokeIn)}
          />
        </group>
      </Stage>

      {/* AGAIN em serifa italica, revelado por mascara. O contraste entre a
          Anton extrudada e a Playfair fina e o que da o tom editorial. */}
      <AbsoluteFill style={{ alignItems: 'center' }}>
        <MaskedLine
          reveal={againMask}
          fontSize={168}
          lineHeight={1.34}
          travel={118}
          style={{
            // Ancorado em coordenada absoluta, e nao por margem sobre um flex
            // centralizado: BROKE vive no espaco 3D e sua posicao na tela nao
            // participa do fluxo, entao centralizar os dois juntos os sobrepoe.
            position: 'absolute',
            top: 1292,
            transform: `perspective(1400px) rotateX(${((1 - again) * 16).toFixed(2)}deg) translateX(${(
              driftX * -0.35
            ).toFixed(1)}px)`,
          }}
          textStyle={{
            fontFamily: FONTS.editorial,
            fontStyle: 'italic',
            fontWeight: 500,
            color: COLORS.bone,
            opacity: again,
          }}
        >
          again
        </MaskedLine>
      </AbsoluteFill>

      <FilmTreatment vignette={0.92} />
    </AbsoluteFill>
  );
};
