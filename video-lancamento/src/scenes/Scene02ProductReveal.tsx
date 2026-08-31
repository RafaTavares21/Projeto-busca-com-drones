import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { ProductPlate } from '../three/ProductPlate';
import { RedHandTransition } from '../three/RedHandTransition';
import { Stage } from '../three/Stage';
import { BASE_Z } from '../three/stageConfig';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { inOut, progress, rad, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { BRAND, COLORS } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.productReveal;

/**
 * CENA 02 — PRODUCT REVEAL (2.5s a 6s)
 *
 * A peca entra pequena e distante, de frente, com a camera avancando e a luz
 * vermelha correndo pela estampa. Entao a mao atravessa o quadro e, no frame
 * de maior cobertura, a peca gira ATRAS dela: quando a mao sai, o que esta em
 * cena sao as costas.
 *
 * A virada frente/costas e escondida por um objeto em movimento, e nao por um
 * fade. A diferenca importa: um fade informa que houve uma transicao; um
 * objeto que passa faz a transicao desaparecer — e, como o objeto e a mao da
 * propria estampa, a marca acaba assinando o proprio corte.
 *
 * As duas faces sao placas de mesma proporcao e compartilham escala,
 * enquadramento e deriva. E isso que faz as duas lerem como a MESMA peca
 * girando, e nao como duas imagens diferentes cortadas uma na outra.
 */
export const Scene02ProductReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const front = useAsset('productFront');
  const back = useAsset('productBack');
  const shown = frame >= B.swap ? back : front;

  // --- Camera --------------------------------------------------------------
  // Dolly continuo por toda a cena. Para de avancar antes do ultimo frame:
  // uma camera ainda acelerando no corte denuncia o corte.
  const dolly = range(frame, [0, 100], [BASE_Z * 1.62, BASE_Z * 0.98], EASE.glide);

  // --- A peca --------------------------------------------------------------
  // Cresce de 0.16 a 1 numa mola pesada: a peca tem massa, chega e assenta.
  const grow = springAt(frame, 'heavy', {
    delay: B.frontIn[0],
    from: 0.16,
    to: 1,
    durationInFrames: B.frontIn[1] - B.frontIn[0],
  });
  const appear = progress(frame, 0, 8, EASE.power3Out);

  // Depois da virada a peca continua sendo empurrada. Manter o movimento
  // atravessando o corte e o que costura as duas faces numa coisa so.
  const push = progress(frame, B.backIn[0], B.backIn[1], EASE.glide);
  const pushScale = range(push, [0, 1], [1, 1.08]);

  // Deriva lateral lenta: devolve movimento a uma imagem que e, tecnicamente,
  // plana, e evita que a peca fique cravada no centro do quadro.
  const parallax = progress(frame, 0, 105, EASE.glide);
  const plateX = range(parallax, [0, 1], [34, -34]);
  const plateY = range(parallax, [0, 1], [-12, 10]);

  // --- Luz vermelha percorrendo a peca --------------------------------------
  const sweepT = progress(frame, B.frontLight[0], B.frontLight[1], EASE.sineInOut);
  const sweepX = range(sweepT, [0, 1], [-1000, 1000]);
  const sweepPower = Math.sin(sweepT * Math.PI);

  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);
  const meta = inOut(frame, [B.backIn[0] + 14, B.backIn[0] + 28, 92, 102]);

  // As placas tem ~452px de altura na origem. A 0.42 da altura do quadro elas
  // sao ampliadas ~1.8x — o limite do que a foto aguenta antes de amolecer.
  const plateHeight = HEIGHT * 0.42;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.5} redWash={sweepPower * 0.34} grunge={0.35} parallax={22} />

      <Stage exposure={1.02} environmentIntensity={0.5} redBounce={0.5 + sweepPower * 0.5}>
        <CameraRig position={[0, 0, dolly]} handheld={5} seed="reveal" />

        <Lighting
          key={1.5}
          fill={0.18}
          rim={2.2 + sweepPower * 4}
          rimPosition={[sweepX, 150, -640]}
          top={3.4}
          topPosition={[-380, 1150, 1380]}
          topAngle={0.64}
          ambient={0.06}
        />

        <Glow position={[sweepX * 0.5, 20, -560]} size={1700} color={COLORS.redHot} intensity={sweepPower * 0.18} />

        {/* A PECA. Frente ate o pico do gesto, costas depois dele. */}
        {shown ? (
          <ProductPlate
            asset={shown}
            height={plateHeight}
            position={[plateX, plateY, 0]}
            scale={grow * pushScale}
            opacity={appear}
            rotation={[0, rad(-3 + sweepT * 6), 0]}
            // A luz vermelha atravessa a peca abrindo a exposicao e puxando a
            // dominante para o quente, e volta ao neutro quando ela passa.
            exposure={0.74 + sweepPower * 0.5}
            tint={sweepPower > 0.02 ? '#FFE6E0' : undefined}
          />
        ) : null}

        {/* Poeira de estudio. Existe para dar volume ao ar, e nada mais. */}
        <Particles
          count={26}
          radius={900}
          depth={2000}
          size={3.2}
          color={COLORS.bone}
          drift={[12, 24, 0]}
          opacity={0.12}
          startFrame={0}
          seed="reveal-dust"
        />

        {/* A mao cobre a virada. Passa em primeiro plano, na frente de tudo. */}
        <RedHandTransition frame={frame} window={B.handWipe} from="left" coverage={2.45} tilt={12} z={1500} motion="wipe" />
      </Stage>

      <TextOverlay
        topLeft={{ text: 'Drop 01 / Peça 01', reveal: meta }}
        bottomRight={{ text: BRAND.tagline, reveal: meta }}
      />

      <FilmTreatment vignette={0.8} />
    </AbsoluteFill>
  );
};
