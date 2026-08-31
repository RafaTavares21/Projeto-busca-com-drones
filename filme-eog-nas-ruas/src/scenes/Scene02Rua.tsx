import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { PhotoPlate } from '../three/PhotoPlate';
import { RedHands } from '../three/RedHands';
import { Stage } from '../three/Stage';
import { BASE_Z, fillHeightAt } from '../three/stageConfig';
import { useAssets } from '../assets';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range } from '../animations/interpolate';
import { BRAND, COLORS, mixHex } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.rua;

/**
 * CENA 02 — A RUA (2.5s a 6s)
 *
 * A marca acabou de passar pela lente. Agora o filme mostra ONDE ela vive: o
 * centro monumental de Sao Paulo, e a campanha dentro dele.
 *
 * A cena e construida sobre uma troca escondida. O Theatro entra distante e a
 * camera avanca; no frame de maior cobertura da mao, a fotografia troca para o
 * trio contra a torre. Um fade informaria que houve transicao; um objeto que
 * cruza faz a transicao desaparecer — e como o objeto e a mao da propria
 * estampa, a marca assina o proprio corte.
 *
 * A profundidade vem de velocidade, nao de recorte: a fotografia esta longe e
 * quase parada, e a mao passa rente a lente.
 */
export const Scene02Rua: React.FC = () => {
  const frame = useCurrentFrame();
  const assets = useAssets();

  const trocou = frame >= B.troca;
  const foto = assets[trocou ? 'trioTorre' : 'heroTheatro'];

  // Avanco continuo sobre o Theatro. Esta e a unica foto com folga de 2.98x —
  // e por isso que o movimento pesado acontece aqui e nao em outro lugar.
  const avanco = progress(frame, B.theatroIn[0], B.theatroIn[1], EASE.glide);
  // Depois da troca a camera continua andando, mas na foto nova e com menos
  // amplitude: 0.75x de folga nao aguenta o mesmo movimento.
  const depois = progress(frame - B.troca, 0, B.trioIn[1] - B.trioIn[0], EASE.glide);

  const cobertura = trocou ? range(depois, [0, 1], [1.16, 1.02]) : range(avanco, [0, 1], [1.9, 1.24]);
  const plateZ = trocou ? -760 : -520;
  const plateY = trocou ? range(depois, [0, 1], [-HEIGHT * 0.04, 0]) : range(avanco, [0, 1], [-HEIGHT * 0.3, -HEIGHT * 0.06]);
  const plateX = range(trocou ? depois : avanco, [0, 1], [22, -22]) * (trocou ? -1 : 1);

  // A luz vermelha percorre a fachada. Como a fotografia nao e re-iluminada,
  // ela chega por `tint` — e assim que a luz da cena alcanca uma foto.
  const luz = pulse(frame, B.luz[0], B.luz[1], 0.42);
  const clarao = pulse(frame, B.troca - 3, B.troca + 9, 0.25);

  const entrada = inOut(frame, [0, 8, 999, 1000]);
  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);
  const meta = inOut(frame, [B.trioIn[0] + 10, B.trioIn[0] + 22, B.saida[0] - 6, B.saida[0] + 2]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.3} redWash={luz * 0.22 + clarao * 0.6} grunge={0.42} parallax={-22} />

      <Stage exposure={1.02} environmentIntensity={0.5} redBounce={0.35 + clarao * 0.6}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={trocou ? 8 : 4} shake={clarao * 20} seed="rua" />
        <Lighting
          key={trocou ? 1.6 : 2.1}
          fill={0.16}
          rim={1.6 + clarao * 5}
          rimPosition={[-520, 220, -740]}
          top={2.4}
          ambient={0.07}
        />

        {foto ? (
          <PhotoPlate
            asset={foto}
            height={fillHeightAt(plateZ, cobertura)}
            position={[plateX, plateY, plateZ]}
            opacity={entrada}
            exposure={0.84}
            tint={mixHex(COLORS.white, COLORS.redHot, luz * 0.2)}
          />
        ) : null}

        <Glow position={[0, 0, -600]} size={2200} color={COLORS.redHot} intensity={clarao * 0.38} />

        {/* A mao cruza o quadro e a troca acontece atras dela. `wipe` garante
            que o pico de cobertura caia exatamente no frame da troca. */}
        <RedHands frame={frame} window={B.wipe} from="right" coverage={2.2} tilt={-14} z={1450} motion="wipe" />
      </Stage>

      <TextOverlay
        bottomLeft={{ text: BRAND.place, reveal: meta }}
        bottomRight={{ text: BRAND.tagline, reveal: meta }}
      />

      <FilmTreatment vignette={0.88} />
    </AbsoluteFill>
  );
};
