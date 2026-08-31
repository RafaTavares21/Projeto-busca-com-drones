import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { PhotoPlate } from '../three/PhotoPlate';
import { Stage } from '../three/Stage';
import { BASE_Z, fillHeightAt } from '../three/stageConfig';
import { useAssets, type AssetRole } from '../assets';
import { EASE } from '../animations/easings';
import { progress, range, rad } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { COLORS, FONTS, GUTTER, PRODUTO, TRACKING } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.marcaFixa;

/**
 * A sequencia da cidade, em ordem de luz: fim de tarde, hora azul, noite.
 * A legenda de cada uma vem do lugar, nao do produto — o filme esta falando de
 * territorio.
 */
const CIDADE: readonly { role: AssetRole; legenda: string }[] = [
  { role: 'portaoDia', legenda: 'Theatro Municipal' },
  { role: 'duplaChevron', legenda: 'Rua Formosa' },
  { role: 'balaustrada', legenda: 'Vale do Anhangabaú' },
  { role: 'costasNoite', legenda: 'Viaduto do Chá' },
  { role: 'trioNoite', legenda: 'Praça Ramos' },
  { role: 'trioTorre', legenda: 'Centro' },
];

/**
 * CENA 03 — MARCA FIXA (7.5s a 14s)
 *
 * O letreiro assume uma posicao na tela e NAO SAI MAIS DELA. A cidade troca
 * atras: seis lugares, do fim de tarde a noite fechada.
 *
 * O corte some porque a ancora nao se move. E o recurso central da cena, e o
 * que faz uma sequencia de fotos parada parecer um plano continuo: o olho
 * segura no elemento fixo e aceita que o mundo mude em volta. Custa precisao —
 * qualquer deslocamento do logo entre um corte e outro denunciaria os dois.
 *
 * O que se move e a camera, de leve, e as fotos, em deriva lenta. O logo gira
 * no proprio eixo para a extrusao continuar viva, mas seu centro fica cravado.
 */
export const Scene03MarcaFixa: React.FC = () => {
  const frame = useCurrentFrame();
  const assets = useAssets();

  // Qual foto esta no ar. As trocas vem do timing, nunca calculadas aqui.
  const indice = B.trocas.reduce((acc, troca) => (frame >= troca ? acc + 1 : acc), 0);
  const atual = CIDADE[Math.min(indice, CIDADE.length - 1)];
  const foto = atual ? assets[atual.role] : undefined;

  // Frame em que a foto no ar entrou — base para a deriva e para a legenda.
  const entrouEm = indice === 0 ? 0 : (B.trocas[indice - 1] ?? 0);
  const desde = frame - entrouEm;

  // Deriva lenta dentro de cada foto: sem isso a imagem parada denuncia que e
  // uma foto. Com isso, lê como plano.
  const deriva = progress(desde, 0, 40, EASE.glide);
  const fotoEscala = range(deriva, [0, 1], [1.04, 1.12]);
  const fotoX = range(deriva, [0, 1], [26, -26]) * (indice % 2 === 0 ? 1 : -1);

  const ancora = springAt(frame, 'solid', { delay: B.ancora[0], durationInFrames: B.ancora[1] - B.ancora[0] });
  // O giro mantem a parede da extrusao visivel; o centro nao se desloca.
  const giro = range(progress(frame, 0, 195, EASE.sineInOut), [0, 1], [0.3, -0.3]);

  const legenda = progress(desde, 4, 16, EASE.power3Out) * (1 - progress(desde, 22, 30, EASE.power2In));

  // A ficha da peca aparece uma vez so, no meio da sequencia. Repeti-la a cada
  // troca a transformaria em ruido; aparecendo uma vez, e informacao.
  const ficha = progress(frame, 92, 108, EASE.power3Out) * (1 - progress(frame, 150, 168, EASE.power2In));
  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.3} grunge={0.4} />

      <Stage exposure={1.0} environmentIntensity={0.55} redBounce={0.45}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={6} seed="marca-fixa" />
        <Lighting key={1.9} fill={0.18} rim={2.6} rimPosition={[-480, 200, -660]} top={2.2} ambient={0.07} />

        {foto ? (
          <PhotoPlate
            asset={foto}
            // Sangra na altura: estas fotos tem folga 0.75x, entao ampliar
            // pouco e cortar as laterais e o que preserva a nitidez.
            height={fillHeightAt(-800, fotoEscala)}
            position={[fotoX, 0, -800]}
            exposure={0.8}
          />
        ) : null}

        {/* A ANCORA. Posicao fixa em X e Y do primeiro ao ultimo frame. */}
        {/* A ancora vive na parte alta do quadro, onde a fotografia guarda ceu
            e fachada. Sobre os rostos ela cobriria o assunto — e o assunto e
            justamente quem esta usando a peca. */}
        <LogoExtruded
          height={368 * ancora}
          position={[0, HEIGHT * 0.24, 320]}
          rotation={[rad(-3), giro, 0]}
          finish={1}
          opacity={ancora}
          exposure={1.12}
        />
      </Stage>

      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: GUTTER,
            bottom: GUTTER,
            // A legenda cai sobre fotografia de luminancia imprevisivel; a
            // sombra longa resolve sem precisar de tarja.
            textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 54px rgba(0,0,0,0.7)',
          }}
        >
          <MaskedLine
            reveal={legenda}
            fontSize={23}
            lineHeight={1.5}
            travel={140}
            textStyle={{
              fontFamily: FONTS.grotesque,
              fontWeight: 500,
              letterSpacing: TRACKING.widest,
              textTransform: 'uppercase',
              color: COLORS.bone,
              opacity: legenda,
            }}
          >
            {atual?.legenda ?? ''}
          </MaskedLine>
        </div>

        {/* Ficha da peca, alinhada a direita — o oposto da legenda de local.
            As duas margens conversam sem nunca disputar o mesmo eixo. */}
        <div
          style={{
            position: 'absolute',
            right: GUTTER,
            bottom: GUTTER,
            textAlign: 'right',
            textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 54px rgba(0,0,0,0.7)',
          }}
        >
          {[PRODUTO.tecido, PRODUTO.caimento].map((linha, i) => (
            <MaskedLine
              key={linha}
              reveal={ficha * 1.5 - i * 0.34}
              fontSize={23}
              lineHeight={1.5}
              travel={140}
              textStyle={{
                fontFamily: FONTS.grotesque,
                fontWeight: 500,
                letterSpacing: TRACKING.widest,
                textTransform: 'uppercase',
                color: i === 0 ? COLORS.bone : COLORS.ash,
                textAlign: 'right',
              }}
            >
              {linha}
            </MaskedLine>
          ))}
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.9} />
    </AbsoluteFill>
  );
};
