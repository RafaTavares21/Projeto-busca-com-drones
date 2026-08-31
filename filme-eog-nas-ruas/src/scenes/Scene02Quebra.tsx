import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { Particles } from '../three/Particles';
import { PhotoPlate } from '../three/PhotoPlate';
import { RedHands } from '../three/RedHands';
import { Stage } from '../three/Stage';
import { BASE_Z, fillHeightAt } from '../three/stageConfig';
import { useAssets, type AssetRole } from '../assets';
import { EASE } from '../animations/easings';
import { progress, pulse, range, rad } from '../animations/interpolate';
import { COLORS } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.quebra;

/** A rua chega em tres golpes. Cada frame aqui e um corte, nao uma transicao. */
const RAJADA: readonly AssetRole[] = ['torrePreta', 'duplaChevron', 'portaoDia'];

/**
 * CENA 02 — A QUEBRA (4.5s a 7.5s)
 *
 * A pedra recebe a cor da marca. Nao e troca de matiz: o material inteiro
 * muda — o cinza mineral da fachada vira a tinta densa do vermelho EOG, e as
 * maos acendem dentro do proprio letreiro. E a marca saindo do pedestal.
 *
 * As maos atravessam o quadro e a rua aparece atras delas. E o mesmo recurso de
 * um corte escondido atras de um objeto que passa: um fade informaria que houve
 * transicao; um objeto que cruza faz a transicao desaparecer. E como o objeto e
 * a mao da propria estampa, a marca assina o proprio corte.
 *
 * A profundidade aqui vem de velocidade, nao de recorte: a fotografia esta em
 * z=-900 e quase parada, o letreiro em z=+300 e girando, e as maos passam
 * rentes a lente. Tres planos, tres velocidades.
 */
export const Scene02Quebra: React.FC = () => {
  const frame = useCurrentFrame();
  const assets = useAssets();

  // A virada de material.
  const virada = progress(frame, B.virada[0], B.virada[1], EASE.power3Out);
  const naRua = frame >= B.rua;

  // Qual golpe da rajada esta no ar.
  const golpe = frame >= B.rajada[1] ? 2 : frame >= B.rajada[0] ? 1 : 0;
  const foto = assets[RAJADA[golpe] ?? 'torrePreta'];
  const entrouEm = golpe === 0 ? B.rua : (B.rajada[golpe - 1] ?? B.rua);

  // Reacao do corte: trepidacao curta que decai. Nao e efeito, e consequencia.
  const impacto = 1 - progress(frame, B.impacto[0], B.impacto[1], EASE.power4Out);
  const clarao = pulse(frame, B.rua - 2, B.rua + 10, 0.2);

  // Empurrao curto dentro de cada golpe: a imagem nunca fica parada.
  const empurrao = progress(frame - entrouEm, 0, 22, EASE.expoOut);

  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);
  const logoGiro = range(progress(frame, 0, 90, EASE.glide), [0, 1], [-0.1, 0.28]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background
        pool={naRua ? 0.4 : 0.24}
        redWash={virada * 0.3 + clarao * 0.7}
        grunge={0.42}
        parallax={-26}
      />

      <Stage exposure={1.02} environmentIntensity={naRua ? 0.5 : 0.75} redBounce={0.3 + virada * 0.7}>
        <CameraRig
          position={[0, 0, BASE_Z]}
          handheld={naRua ? 9 : 3}
          shake={impacto * 26}
          roll={impacto * 0.05}
          seed="quebra"
        />
        <Lighting
          key={naRua ? 1.6 : 2.2}
          fill={0.16}
          rim={1.4 + virada * 3.4 + clarao * 6}
          rimPosition={[-520, 220, -740]}
          top={naRua ? 1.6 : 3.2}
          ambient={0.07}
        />

        {naRua && foto ? (
          <PhotoPlate
            asset={foto}
            height={fillHeightAt(-900, range(empurrao, [0, 1], [1.14, 1.02]))}
            position={[range(empurrao, [0, 1], [22, -22]) * (golpe % 2 === 0 ? 1 : -1), 0, -900]}
            exposure={0.82}
          />
        ) : null}

        <Glow position={[0, 0, -560]} size={2200} color={COLORS.redHot} intensity={clarao * 0.42 + virada * 0.08} />

        <LogoExtruded
          height={range(virada, [0, 1], [420, 456])}
          // Alto no quadro: sobre o rosto de quem esta usando a peca, o
          // letreiro cobriria justamente o assunto do filme.
          position={[0, naRua ? HEIGHT * 0.34 : -HEIGHT * 0.2, 300]}
          rotation={[rad(-4), logoGiro, 0]}
          finish={virada}
          exposure={1.05 + clarao * 0.5}
        />

        {/* Poeira apenas no impacto, e apenas enquanto ele dura. */}
        <Particles
          count={22}
          radius={1000}
          depth={1800}
          size={6}
          shard
          color={COLORS.red}
          drift={[320, 180, 260]}
          opacity={0.3 * impacto}
          startFrame={B.rua}
          seed="quebra-estilhaco"
        />

        {/* As maos passam rentes a lente e entregam a rua atras delas. */}
        <RedHands frame={frame} window={B.maos} from="right" coverage={2.2} tilt={-14} z={1450} motion="wipe" />
      </Stage>

      {clarao > 0 ? (
        <AbsoluteFill
          style={{ backgroundColor: COLORS.red, opacity: clarao * 0.5, mixBlendMode: 'screen' }}
        />
      ) : null}

      <FilmTreatment vignette={0.88} />
    </AbsoluteFill>
  );
};
