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
import { inOut, progress, range, rad } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { COLORS } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.productReveal;

/**
 * CENA 02 — PRODUCT REVEAL (2.5s a 6s)
 *
 * A cena vai da IDENTIDADE ao PRODUTO. Abre na estampa — a marca como grafismo
 * puro, pequena e distante, com a camera avancando e a luz vermelha correndo
 * por ela. Entao a mao atravessa o quadro e, no frame de maior cobertura, a
 * cena troca ATRAS dela: quando a mao sai, o que existe e a fotografia da peca
 * vestida.
 *
 * A troca e escondida por um objeto em movimento, e nao por um fade. A
 * diferenca importa: um fade informa que houve uma transicao; um objeto que
 * passa faz a transicao desaparecer, e a marca acaba assinando o proprio corte.
 *
 * A escalada tambem e narrativa — grafismo primeiro, corpo depois. O produto
 * chega como consequencia da identidade, nao como ilustracao dela.
 */
export const Scene02ProductReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const front = useAsset('productFront');
  const back = useAsset('productBack');

  // A troca acontece no pico do gesto. O numero e do beat, nao improvisado.
  const showBack = frame >= B.swap;

  // --- Camera --------------------------------------------------------------
  // Dolly continuo por toda a cena. Para de avancar antes do ultimo frame:
  // uma camera ainda acelerando no corte denuncia o corte.
  const dolly = range(frame, [0, 100], [BASE_Z * 1.62, BASE_Z * 0.94], EASE.glide);

  // --- Estampa (frente) ----------------------------------------------------
  const frontGrow = springAt(frame, 'heavy', {
    delay: B.frontIn[0],
    from: 0.16,
    to: 1,
    durationInFrames: B.frontIn[1] - B.frontIn[0],
  });
  // Sem fade de saida: a estampa existe ate o frame da troca e some nele.
  // Um cross-fade atras da mao produziria um instante preto na fresta entre os
  // dedos — justamente o que a mao existe para evitar.
  const frontOpacity = progress(frame, 0, 8, EASE.power3Out);

  // Luz vermelha percorrendo a arte, de um lado ao outro.
  const sweepT = progress(frame, B.frontLight[0], B.frontLight[1], EASE.sineInOut);
  const sweepX = range(sweepT, [0, 1], [-1000, 1000]);
  const sweepPower = Math.sin(sweepT * Math.PI);

  // --- Fotografia (costas) -------------------------------------------------
  // A foto entra ja grande — ela nao "cresce", ela e revelada. Continuar a
  // aproximacao com a camera preserva o movimento atraves do corte.
  // A foto entra OPACA no frame da troca. O que a fresta entre os dedos mostra
  // e a imagem nova, nao um buraco.
  const backSettle = progress(frame, B.backIn[0], B.backIn[0] + 10, EASE.expoOut);
  const backPush = progress(frame, B.backIn[0], B.backIn[1], EASE.glide);
  const backScale = range(backPush, [0, 1], [0.94, 1.12]) * range(backSettle, [0, 1], [1.04, 1]);

  // Parallax: a peca e o fundo da fotografia andam em ritmos diferentes,
  // o que devolve profundidade a uma imagem que e, tecnicamente, plana.
  const parallax = progress(frame, B.backParallax[0], B.backParallax[1], EASE.glide);
  const plateX = range(parallax, [0, 1], [46, -46]);
  const plateY = range(parallax, [0, 1], [-18, 14]);

  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);
  const meta = inOut(frame, [B.backIn[0] + 14, B.backIn[0] + 28, 92, 102]);

  // A fotografia e 849x538: uma paisagem de baixa resolucao dentro de um
  // quadro vertical. Exibi-la como placa larga, com preto acima e abaixo, e
  // linguagem de editorial — e evita ampliar a imagem alem do que ela aguenta.
  const plateHeight = HEIGHT * 0.40;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background
        pool={showBack ? 0.34 : 0.62}
        redWash={showBack ? 0.14 : sweepPower * 0.42}
        grunge={0.35}
        parallax={22}
      />

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

        <Glow
          position={[sweepX * 0.5, 20, -560]}
          size={1700}
          color={COLORS.redHot}
          intensity={showBack ? 0.05 : sweepPower * 0.2}
        />

        {/* IDENTIDADE — a estampa como grafismo, recebendo a luz da cena. */}
        {front && !showBack ? (
          <ProductPlate
            asset={front}
            height={HEIGHT * 0.46}
            scale={frontGrow}
            opacity={frontOpacity}
            rotation={[0, rad(-4 + sweepT * 8), 0]}
            exposure={0.96}
          />
        ) : null}

        {/* PRODUTO — a peca vestida. Fotografia exibida como fotografia. */}
        {back && showBack ? (
          <ProductPlate
            asset={back}
            height={plateHeight}
            position={[plateX, plateY, 0]}
            scale={backScale}
            exposure={0.94 + backSettle * 0.14}
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

        {/* A mao cobre a troca. Passa em primeiro plano, na frente de tudo. */}
        <RedHandTransition frame={frame} window={B.handWipe} from="left" coverage={2.45} tilt={12} z={1500} motion="wipe" />
      </Stage>

      <TextOverlay
        topLeft={{ text: 'Drop 01 / Peça 01', reveal: meta }}
        bottomRight={{ text: 'EOG DRIP', reveal: meta }}
      />

      <FilmTreatment vignette={0.8} />
    </AbsoluteFill>
  );
};
