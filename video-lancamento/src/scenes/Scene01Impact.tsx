import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { RedHandTransition, handCoverage } from '../three/RedHandTransition';
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
 * Sete frames de preto real. Sem esse silencio o gesto seguinte nao tem de
 * onde vir — impacto e uma relacao, nao um valor absoluto.
 *
 * Entao a mao vermelha rasga o quadro. Ela nao e um efeito: e o elemento
 * grafico da propria peca, e e o gesto dela que carrega a camera junto. EOG
 * chega na esteira da mao; DRIP vem depois, em outra escala e outra
 * profundidade, e passa rente a lente.
 *
 * A sensacao de escala nao vem de escalar o texto: vem de mover a geometria
 * em profundidade a velocidade constante e deixar a perspectiva trabalhar.
 */
export const Scene01Impact: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Camera --------------------------------------------------------------
  // A camera e arrancada pelo gesto e volta ao eixo. Nao e trepidacao: e um
  // deslocamento com direcao, que decai.
  const whip = 1 - progress(frame, B.cameraWhip[0], B.cameraWhip[1], EASE.power4Out);
  const cameraX = whip * 190;
  const cameraY = whip * -54;

  // --- Mao -----------------------------------------------------------------
  const slash = handCoverage(frame, B.handSlash, 'slash');

  // --- EOG -----------------------------------------------------------------
  // Chega quase instantaneamente e assenta. A palavra curta pede impacto seco.
  const eog = progress(frame, B.eogIn[0], B.eogIn[1], EASE.impact);
  const eogZ = range(eog, [0, 1], [-2600, -120]);
  const eogOpacity = inOut(frame, [B.eogIn[0], B.eogIn[0] + 4, B.dripIn[0] + 10, B.dripIn[0] + 22]);

  // --- DRIP ----------------------------------------------------------------
  // Velocidade constante em Z, atravessando o plano da camera. A aceleracao
  // aparente e puramente perspectiva.
  const dripZ = range(frame, [B.dripIn[0], B.dripIn[1]], [-1900, BASE_Z + 700]);
  const dripOpacity = inOut(frame, [B.dripIn[0], B.dripIn[0] + 5, B.dripPass, B.dripPass + 5]);
  const dripBlur = progress(frame, B.dripIn[0] + 8, B.dripPass, EASE.power2In);

  const pass = pulse(frame, B.dripPass - 8, B.dripPass + 8, 0.5);
  const heat = Math.max(slash * 0.8, pass);

  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);
  const meta = inOut(frame, [26, 38, 58, 68]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.2 + heat * 0.5} redWash={heat * 0.9} grunge={0.5} parallax={-34} />

      <Stage exposure={1.05} redBounce={0.6 + heat * 0.8}>
        <CameraRig
          position={[cameraX, cameraY, BASE_Z]}
          shake={whip * 18}
          handheld={6}
          roll={whip * 0.07}
          seed="impact"
        />
        <Lighting key={2.6} fill={0.14} rim={1.4 + heat * 7} rimPosition={[-560, 200, -880]} top={0.9} ambient={0.05} />

        {/* Fragmentos apenas na esteira do gesto, e so enquanto ele acontece. */}
        <Particles
          count={20}
          radius={1100}
          depth={2200}
          size={8}
          shard
          color={COLORS.red}
          drift={[520, 240, 140]}
          opacity={0.34 * slash}
          startFrame={B.debris[0]}
          seed="slash-debris"
        />
        <Particles
          count={30}
          radius={1300}
          depth={2600}
          size={3.5}
          color={COLORS.bone}
          drift={[210, 70, 90]}
          opacity={0.14 * inOut(frame, [B.debris[0], B.debris[0] + 6, B.debris[1] - 8, B.debris[1]])}
          startFrame={B.debris[0]}
          seed="slash-dust"
        />

        <Glow position={[0, 0, -800]} size={2600} color={COLORS.redHot} intensity={heat * 0.34} />

        <Typography3D
          text="EOG"
          size={430}
          depth={160}
          position={[0, 40, eogZ]}
          rotation={[0, 0.05, 0]}
          opacity={eogOpacity}
          faceColor={COLORS.white}
          sideColor="#0E0E0E"
        />

        <Typography3D
          text="DRIP"
          size={330}
          depth={190}
          position={[0, -60, dripZ]}
          rotation={[0, -0.04, 0.01]}
          opacity={dripOpacity}
          faceColor={COLORS.white}
          sideColor={COLORS.redDeep}
          ghosts={dripBlur > 0.05 ? 5 : 0}
          ghostOffset={[0, 0, -340]}
          ghostOpacity={0.1 * dripBlur}
        />

        {/* A mao passa em primeiro plano, na frente de tudo. */}
        <RedHandTransition
          frame={frame}
          window={B.handSlash}
          from="right"
          coverage={1.15}
          tilt={-18}
          z={1400}
          motion="slash"
        />
      </Stage>

      <TextOverlay
        topLeft={{ text: 'EOG DRIP', reveal: meta }}
        topRight={{ text: 'Drop 01', reveal: meta }}
      />

      <FilmTreatment vignette={0.92} />
    </AbsoluteFill>
  );
};
