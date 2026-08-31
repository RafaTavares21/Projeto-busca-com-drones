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
import { Logo3D } from '../three/Logo3D';
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
 * grafico da propria peca, e e o gesto dela que carrega a camera junto. O
 * letreiro da marca chega na esteira da mao, vindo do fundo do espaco, e passa
 * rente a lente.
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

  // --- O letreiro ----------------------------------------------------------
  // Velocidade constante em Z, atravessando o plano da camera. A aceleracao
  // aparente e puramente perspectiva: o objeto nao acelera, a lente e que o
  // aproxima.
  const logoZ = range(frame, [B.eogIn[0], B.dripIn[1]], [-3000, BASE_Z + 620]);
  const logoOpacity = inOut(frame, [B.eogIn[0], B.eogIn[0] + 6, B.dripPass, B.dripPass + 6]);
  const logoBlur = progress(frame, B.eogIn[1], B.dripPass, EASE.power2In);
  // Giro lento e curto: sem ele a extrusao fica de frente e some.
  const logoSpin = range(frame, [B.eogIn[0], B.dripIn[1]], [0.34, -0.12], EASE.glide);

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

        <Logo3D
          height={620}
          position={[0, 0, logoZ]}
          rotation={[0, logoSpin, -0.02]}
          opacity={logoOpacity}
          depth={110}
          layers={26}
          exposure={1.05}
          ghosts={logoBlur > 0.05 ? 5 : 0}
          ghostOffset={[0, 0, -300]}
          ghostOpacity={0.09 * logoBlur}
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
