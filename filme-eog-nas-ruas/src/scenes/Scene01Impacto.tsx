import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { Particles } from '../three/Particles';
import { RedHands, handCoverage } from '../three/RedHands';
import { Stage } from '../three/Stage';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range } from '../animations/interpolate';
import { BRAND, COLORS, LABELS } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.impacto;

/**
 * CENA 01 — IMPACTO (0s a 2.5s)
 *
 * Sete frames de preto real. Sem esse silencio o gesto seguinte nao tem de
 * onde vir — impacto e uma relacao, nao um valor absoluto.
 *
 * Entao a mao vermelha rasga o quadro. Ela nao e um efeito: e o elemento
 * grafico da propria peca, e e o gesto dela que carrega a camera junto. O
 * letreiro da marca chega na esteira da mao, vindo do fundo do espaco, e passa
 * rente a lente.
 *
 * A sensacao de escala nao vem de escalar o letreiro: vem de move-lo em
 * profundidade a velocidade constante e deixar a perspectiva trabalhar.
 */
export const Scene01Impacto: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Camera --------------------------------------------------------------
  // A camera e arrancada pelo gesto e volta ao eixo. Nao e trepidacao: e um
  // deslocamento com direcao, que decai.
  const whip = 1 - progress(frame, B.whip[0], B.whip[1], EASE.power4Out);
  const cameraX = whip * 190;
  const cameraY = whip * -54;

  // --- Mao -----------------------------------------------------------------
  const rasgo = handCoverage(frame, B.rasgo, 'slash');

  // --- O letreiro ----------------------------------------------------------
  // Velocidade constante em Z, atravessando o plano da camera. A aceleracao
  // aparente e puramente perspectiva: o objeto nao acelera, a lente e que o
  // aproxima.
  const logoZ = range(frame, [B.eogIn[0], B.ruasIn[1]], [-3000, BASE_Z + 620]);
  const logoOpacity = inOut(frame, [B.eogIn[0], B.eogIn[0] + 6, B.ruasPass, B.ruasPass + 6]);
  // Giro lento e curto: sem ele a extrusao fica de frente e some.
  const logoGiro = range(frame, [B.eogIn[0], B.ruasIn[1]], [0.34, -0.12], EASE.glide);

  const passagem = pulse(frame, B.ruasPass - 8, B.ruasPass + 8, 0.5);
  const calor = Math.max(rasgo * 0.8, passagem);

  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);
  const meta = inOut(frame, [26, 38, 58, 68]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.2 + calor * 0.5} redWash={calor * 0.9} grunge={0.5} parallax={-34} />

      <Stage exposure={1.05} redBounce={0.6 + calor * 0.8}>
        <CameraRig
          position={[cameraX, cameraY, BASE_Z]}
          shake={whip * 18}
          handheld={6}
          roll={whip * 0.07}
          seed="impacto"
        />
        <Lighting key={2.6} fill={0.14} rim={1.4 + calor * 7} rimPosition={[-560, 200, -880]} top={0.9} ambient={0.05} />

        {/* Fragmentos apenas na esteira do gesto, e so enquanto ele acontece. */}
        <Particles
          count={20}
          radius={1100}
          depth={2200}
          size={8}
          shard
          color={COLORS.red}
          drift={[520, 240, 140]}
          opacity={0.34 * rasgo}
          startFrame={B.estilhaco[0]}
          seed="rasgo-estilhaco"
        />
        <Particles
          count={30}
          radius={1300}
          depth={2600}
          size={3.5}
          color={COLORS.bone}
          drift={[210, 70, 90]}
          opacity={0.14 * inOut(frame, [B.estilhaco[0], B.estilhaco[0] + 6, B.estilhaco[1] - 8, B.estilhaco[1]])}
          startFrame={B.estilhaco[0]}
          seed="rasgo-poeira"
        />

        <Glow position={[0, 0, -800]} size={2600} color={COLORS.redHot} intensity={calor * 0.34} />

        <LogoExtruded
          height={620}
          position={[0, 0, logoZ]}
          rotation={[0, logoGiro, -0.02]}
          finish={1}
          opacity={logoOpacity}
          exposure={1.05}
        />

        {/* A mao passa em primeiro plano, na frente de tudo. */}
        <RedHands frame={frame} window={B.rasgo} from="right" coverage={1.15} tilt={-18} z={1400} motion="slash" />
      </Stage>

      <TextOverlay
        topLeft={{ text: BRAND.name, reveal: meta }}
        topRight={{ text: LABELS.drop, reveal: meta }}
      />

      <FilmTreatment vignette={0.92} />
    </AbsoluteFill>
  );
};
