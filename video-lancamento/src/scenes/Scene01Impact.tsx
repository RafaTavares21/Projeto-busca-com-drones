import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MotionBlur } from '../components/MotionBlur';
import { RedBrushStroke } from '../components/RedBrushStroke';
import { HudOverlay } from '../components/HudOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { Stage } from '../three/Stage';
import { Typography3D } from '../three/Typography3D';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range } from '../animations/interpolate';
import { COLORS } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.impact;

/**
 * CENA 01 — IMPACT (0s a 2.5s)
 *
 * Abre em preto real. Uma pincelada vermelha rasga a tela, a camera e
 * chicoteada na direcao contraria e a poeira do gesto fica em suspensao.
 * NEVER entao vem do fundo do espaco e passa rente a lente.
 *
 * A sensacao de escala nao vem de escalar o texto: vem de mover a geometria em
 * profundidade a velocidade constante e deixar a perspectiva fazer o trabalho.
 * O que a camera ve e um objeto de trinta metros passando a um metro dela.
 */
export const Scene01Impact: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Pincelada -----------------------------------------------------------
  const sweep = progress(frame, B.brushSweep[0], B.brushSweep[1], EASE.power4Out);
  // Ela permanece em cena, mas recua para o fundo quando a tipografia chega.
  const brushOpacity = inOut(frame, [B.brushSweep[0], B.brushSweep[0] + 3, 46, 66], EASE.linear, EASE.power2Out);
  // O borrao existe apenas enquanto o gesto acontece.
  const brushBlur = 1 - progress(frame, B.brushSweep[0] + 2, B.brushSweep[1], EASE.power2Out);

  // --- Camera --------------------------------------------------------------
  // Chicote: a camera e arrancada para o lado no impacto e volta ao eixo.
  const whip = 1 - progress(frame, B.cameraWhip[0], B.cameraWhip[1], EASE.power4Out);
  const shake = whip * 26;
  const cameraX = whip * 150;

  // --- Tipografia ----------------------------------------------------------
  // Velocidade constante em Z. A aceleracao aparente e puramente perspectiva.
  const z = range(frame, [B.typeApproach[0], B.typeApproach[1]], [-3200, BASE_Z + 900]);
  const typeOpacity = inOut(frame, [B.typeApproach[0], B.typeApproach[0] + 8, B.typePassBy, B.typePassBy + 6]);

  // O borrao da tipografia so entra na aproximacao final.
  const typeBlur = progress(frame, 44, B.typePassBy, EASE.power2In);

  // A rim vermelha cresce conforme o texto se aproxima e estoura na passagem.
  const rim = progress(frame, B.rimPeak[0], B.rimPeak[1], EASE.power3Out);
  const passFlash = pulse(frame, B.typePassBy - 6, B.typePassBy + 8, 0.55);

  // --- Saida ---------------------------------------------------------------
  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);

  const hudReveal = inOut(frame, [10, 22, 58, 68]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.35 + rim * 0.4} redWash={rim * 0.7 + passFlash * 0.5} grunge={0.5} parallax={-30} />

      <MotionBlur amount={brushBlur} layers={7} lagInFrames={1}>
        <RedBrushStroke progress={sweep} opacity={brushOpacity} />
      </MotionBlur>

      <Stage exposure={1.05} redBounce={0.6 + rim * 0.7}>
        <CameraRig
          position={[cameraX, 0, BASE_Z]}
          shake={shake}
          handheld={7}
          roll={whip * 0.06}
          seed="impact"
        />
        <Lighting
          key={2.4}
          fill={0.14}
          rim={1.2 + rim * 7}
          rimPosition={[-520, 220, -900]}
          top={0.8}
          ambient={0.05}
        />

        {/* Fragmentos lancados pela pincelada, viajando na mesma diagonal. */}
        <Particles
          count={22}
          radius={1150}
          depth={2400}
          size={9}
          shard
          color={COLORS.red}
          drift={[420, 210, 120]}
          opacity={0.34 * brushOpacity}
          startFrame={B.debrisBurst[0]}
          seed="debris-red"
        />
        <Particles
          count={38}
          radius={1300}
          depth={2800}
          size={4}
          color={COLORS.bone}
          drift={[180, 60, 90]}
          opacity={0.16}
          startFrame={B.debrisBurst[0]}
          seed="debris-dust"
        />

        <Glow position={[0, 40, -700]} size={2400} color={COLORS.redHot} intensity={rim * 0.32 + passFlash * 0.4} />

        <Typography3D
          text="NEVER"
          size={420}
          depth={150}
          position={[0, 0, z]}
          rotation={[0, 0.07, -0.012]}
          opacity={typeOpacity}
          faceColor={COLORS.white}
          sideColor="#0F0F0F"
          ghosts={typeBlur > 0.05 ? 5 : 0}
          ghostOffset={[0, 0, -320]}
          ghostOpacity={0.1 * typeBlur}
        />
      </Stage>

      <HudOverlay
        top={[
          { text: 'Never Broke Again', reveal: hudReveal },
          { text: 'Drop 01', reveal: hudReveal, align: 'right' },
        ]}
        marks={hudReveal * 0.8}
      />

      <FilmTreatment vignette={0.95} />
    </AbsoluteFill>
  );
};
