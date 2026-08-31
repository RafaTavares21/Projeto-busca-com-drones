import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { InformationContainer, type InfoState } from '../components/InformationContainer';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { ProductPlate } from '../three/ProductPlate';
import { Stage } from '../three/Stage';
import { BASE_Z } from '../three/stageConfig';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { inOut, progress, range } from '../animations/interpolate';
import { COLORS, GUTTER } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.details;

/**
 * CENA 03 — PRODUCT DETAILS (6s a 9s)
 *
 * O objetivo aqui e percepcao de qualidade, e percepcao de qualidade vem de
 * composicao, nao de informacao. A fotografia sobe e abre a metade inferior do
 * quadro; as especificacoes ocupam esse espaco em tipografia grande, com
 * reveal por mascara e stagger — como um editorial, e nao como uma ficha.
 *
 * A mao pequena entre os dois blocos e o unico ornamento, e tem funcao: ela
 * liga uma informacao a outra e declara as duas como o mesmo sistema. Sem ela
 * seriam duas legendas soltas.
 */
export const Scene03Details: React.FC = () => {
  const frame = useCurrentFrame();

  const back = useAsset('productWorn');
  const hands = useAsset('hands');

  // A placa sobe e cede a metade inferior do quadro para o texto.
  const settle = progress(frame, B.plateSettle[0], B.plateSettle[1], EASE.glide);
  const plateY = range(settle, [0, 1], [0, HEIGHT * 0.22]);
  const plateScale = range(settle, [0, 1], [1.16, 1.02]);

  // Recuo lento e continuo: a camera observa, nao ataca.
  const dolly = range(frame, [0, 90], [BASE_Z * 0.94, BASE_Z * 1.06], EASE.glide);

  const reduce = progress(frame, B.reduce[0], B.reduce[1], EASE.power3Out);
  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);

  const specA: InfoState = {
    reveal: progress(frame, B.specA[0], B.specA[1], EASE.power4Out),
    opacity: inOut(frame, [B.specA[0], B.specA[0] + 6, B.reduce[0], B.reduce[1]]),
    x: range(progress(frame, B.specA[0], B.specA[1], EASE.power4Out), [0, 1], [-70, 0]),
    y: -reduce * 34,
    scale: range(reduce, [0, 1], [1, 0.94]),
  };

  const specB: InfoState = {
    reveal: progress(frame, B.specB[0], B.specB[1], EASE.power4Out),
    opacity: inOut(frame, [B.specB[0], B.specB[0] + 6, B.reduce[0] + 6, B.reduce[1]]),
    x: range(progress(frame, B.specB[0], B.specB[1], EASE.power4Out), [0, 1], [70, 0]),
    y: -reduce * 34,
    scale: range(reduce, [0, 1], [1, 0.94]),
  };

  const connector = progress(frame, B.connector[0], B.connector[1], EASE.power3Out);
  const meta = inOut(frame, [4, 16, B.reduce[0], B.reduce[1]]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.4} redWash={0.1} grunge={0.4} parallax={14} />

      <Stage exposure={1.0} environmentIntensity={0.45}>
        <CameraRig position={[0, 0, dolly]} handheld={4} seed="details" />
        <Lighting key={1.1} fill={0.14} rim={1.6} rimPosition={[520, 120, -700]} top={2.2} ambient={0.05} />

        {back ? (
          <ProductPlate
            asset={back}
            height={HEIGHT * 0.4}
            position={[0, plateY, 0]}
            scale={plateScale}
            exposure={range(reduce, [0, 1], [1.02, 0.72])}
          />
        ) : null}
      </Stage>

      {/* A informacao vive na camada DOM: tipografia editorial precisa do
          rasterizador de texto do navegador, nao de geometria. */}
      <AbsoluteFill
        style={{
          padding: `0 ${GUTTER}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          paddingBottom: HEIGHT * 0.17,
          gap: 46,
        }}
      >
        <InformationContainer eyebrow="Material" lines={['ALGODÃO', 'PREMIUM']} state={specA} />

        {/* O conector: a mao da propria peca, pequena, ligando os dois blocos. */}
        {hands ? (
          <div
            style={{
              width: 58,
              marginLeft: 30,
              opacity: connector * (1 - reduce),
              transform: `translateY(${((1 - connector) * -18).toFixed(1)}px) rotate(${(
                -8 + connector * 8
              ).toFixed(1)}deg)`,
            }}
          >
            <Img src={hands.url} style={{ width: '100%', display: 'block' }} />
          </div>
        ) : null}

        <InformationContainer eyebrow="Modelagem" lines={['CAIMENTO', 'AMPLO']} state={specB} />
      </AbsoluteFill>

      <TextOverlay topLeft={{ text: 'Especificação', reveal: meta }} topRight={{ text: '01 / 02', reveal: meta }} />

      <FilmTreatment vignette={0.84} />
    </AbsoluteFill>
  );
};
