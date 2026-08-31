import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { InformationContainer, type InfoState } from '../components/InformationContainer';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { PhotoPlate } from '../three/PhotoPlate';
import { Stage } from '../three/Stage';
import { BASE_Z, fillHeightAt } from '../three/stageConfig';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { inOut, progress, range } from '../animations/interpolate';
import { COLORS, GUTTER, PRODUTO } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.ficha;

/**
 * CENA 03 — ESPECIFICACAO (6s a 9s)
 *
 * O objetivo aqui e percepcao de qualidade, e percepcao de qualidade vem de
 * composicao, nao de informacao. A fotografia sobe e abre a metade inferior do
 * quadro; as especificacoes ocupam esse espaco em tipografia grande, com
 * reveal por mascara e stagger — como um editorial, e nao como uma ficha.
 *
 * A foto escolhida e a das costas na hora azul: e a unica em que a peca ocupa
 * o quadro inteiro e o caimento fica legivel. Falar de modelagem sobre uma
 * fotografia de arquitetura seria escrever uma coisa e mostrar outra.
 *
 * A mao pequena entre os dois blocos e o unico ornamento, e tem funcao: ela
 * liga uma informacao a outra e declara as duas como o mesmo sistema. Sem ela
 * seriam duas legendas soltas.
 */
export const Scene03Ficha: React.FC = () => {
  const frame = useCurrentFrame();

  const costas = useAsset('costasNoite');
  const maos = useAsset('maos');

  // A placa sobe e cede a metade inferior do quadro para o texto.
  const sobe = progress(frame, B.sobe[0], B.sobe[1], EASE.glide);
  const plateY = range(sobe, [0, 1], [0, HEIGHT * 0.24]);
  const cobertura = range(sobe, [0, 1], [1.2, 1.06]);

  // Recuo lento e continuo: a camera observa, nao ataca.
  const dolly = range(frame, [0, 90], [BASE_Z * 0.94, BASE_Z * 1.06], EASE.glide);

  const reduz = progress(frame, B.reduz[0], B.reduz[1], EASE.power3Out);
  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);

  const specA: InfoState = {
    reveal: progress(frame, B.specA[0], B.specA[1], EASE.power4Out),
    opacity: inOut(frame, [B.specA[0], B.specA[0] + 6, B.reduz[0], B.reduz[1]]),
    x: range(progress(frame, B.specA[0], B.specA[1], EASE.power4Out), [0, 1], [-70, 0]),
    y: -reduz * 34,
    scale: range(reduz, [0, 1], [1, 0.94]),
  };

  const specB: InfoState = {
    reveal: progress(frame, B.specB[0], B.specB[1], EASE.power4Out),
    opacity: inOut(frame, [B.specB[0], B.specB[0] + 6, B.reduz[0] + 6, B.reduz[1]]),
    x: range(progress(frame, B.specB[0], B.specB[1], EASE.power4Out), [0, 1], [70, 0]),
    y: -reduz * 34,
    scale: range(reduz, [0, 1], [1, 0.94]),
  };

  const conector = progress(frame, B.conector[0], B.conector[1], EASE.power3Out);
  const meta = inOut(frame, [4, 16, B.reduz[0], B.reduz[1]]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.4} redWash={0.1} grunge={0.4} parallax={14} />

      <Stage exposure={1.0} environmentIntensity={0.45}>
        <CameraRig position={[0, 0, dolly]} handheld={4} seed="ficha" />
        <Lighting key={1.1} fill={0.14} rim={1.6} rimPosition={[520, 120, -700]} top={2.2} ambient={0.05} />

        {costas ? (
          <PhotoPlate
            asset={costas}
            height={fillHeightAt(-560, cobertura)}
            position={[0, plateY, -560]}
            exposure={range(reduz, [0, 1], [0.94, 0.66])}
          />
        ) : null}
      </Stage>

      {/* Degrade que devolve preto a metade de baixo. A tipografia branca cai
          sobre fotografia noturna de luminancia imprevisivel, e sem esta base
          ela precisaria de tarja — que e exatamente o que um editorial nao usa. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0) 34%, rgba(0,0,0,0.86) 62%, ${COLORS.black} 84%)`,
          pointerEvents: 'none',
        }}
      />

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
          pointerEvents: 'none',
        }}
      >
        <InformationContainer eyebrow="Tecido" lines={[PRODUTO.tecido.toUpperCase()]} state={specA} />

        {/* O conector: a mao da propria peca, pequena, ligando os dois blocos. */}
        {maos ? (
          <div
            style={{
              width: 58,
              marginLeft: 30,
              opacity: conector * (1 - reduz),
              transform: `translateY(${((1 - conector) * -18).toFixed(1)}px) rotate(${(
                -8 + conector * 8
              ).toFixed(1)}deg)`,
            }}
          >
            <Img src={maos.url} style={{ width: '100%', display: 'block' }} />
          </div>
        ) : null}

        <InformationContainer eyebrow="Modelagem" lines={['CAIMENTO', 'BOXY']} state={specB} />
      </AbsoluteFill>

      <TextOverlay topLeft={{ text: 'Especificação', reveal: meta }} topRight={{ text: '01 / 02', reveal: meta }} />

      <FilmTreatment vignette={0.84} />
    </AbsoluteFill>
  );
};
