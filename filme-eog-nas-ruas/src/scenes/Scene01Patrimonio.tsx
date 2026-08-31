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
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { inOut, progress, range, rad } from '../animations/interpolate';
import { BRAND, COLORS, FONTS, GUTTER, TRACKING } from '../styles/tokens';
import { BEATS, HEIGHT, WIDTH } from '../timing';

const B = BEATS.patrimonio;

/**
 * CENA 01 — PATRIMONIO (0s a 4.5s)
 *
 * O filme abre com a linguagem da arquitetura, nao com a da moda: camera lenta,
 * quadro parado, tipografia de etiqueta de museu. O centro de Sao Paulo tratado
 * como acervo.
 *
 * A aproximacao comeca fechada no ornamento do Theatro e RECUA para revelar
 * quem esta ali. Isso so e possivel porque esta foto tem 24,5 MP — folga de
 * quase 3x sobre o quadro. Nas fotos de 1,6 MP este movimento amoleceria a
 * imagem, e por isso ele acontece aqui e nao em outro lugar.
 *
 * O letreiro nasce em PEDRA, o material da propria fachada — cinza fosco,
 * dentro da paleta preto/branco/vermelho. E a tese do filme dita em uma
 * imagem: a marca se coloca como patrimonio antes de se declarar rua.
 */
export const Scene01Patrimonio: React.FC = () => {
  const frame = useCurrentFrame();
  const theatro = useAsset('heroTheatro');

  // Recuo lento e continuo. Comeca em close no ornamento, abre para o conjunto.
  const abertura = progress(frame, B.aproximacao[0], B.aproximacao[1], EASE.glide);
  const plateHeight = fillHeightAt(-420, range(abertura, [0, 1], [3.4, 1.42]));
  // O enquadramento sobe junto: fechado na luminaria, aberto na escadaria.
  const plateY = range(abertura, [0, 1], [-HEIGHT * 0.62, -HEIGHT * 0.05]);

  const foto = inOut(frame, [B.silencio[1] - 4, B.silencio[1] + 14, 999, 1000]);

  // O relevo entra por escala e opacidade, nao por corte: ele se materializa.
  const relevo = progress(frame, B.relevoIn[0], B.relevoIn[1], EASE.power4Out);
  const giro = range(progress(frame, B.relevoGiro[0], B.relevoGiro[1], EASE.glide), [0, 1], [-0.46, -0.1]);

  const etiqueta = progress(frame, B.etiqueta[0], B.etiqueta[1], EASE.power3Out);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <Background pool={0.24} grunge={0.32} />

      <Stage exposure={1.0} environmentIntensity={0.75} redBounce={0.25}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={3} seed="patrimonio" />
        <Lighting
          // Luz de museu: uma fonte alta e dura sobre o objeto, quase sem
          // preenchimento. O relevo existe pela sombra, nao pelo brilho.
          key={2.2}
          fill={0.14}
          rim={1.4}
          rimPosition={[-620, 260, -700]}
          top={3.2}
          topPosition={[-320, 1250, 1150]}
          topAngle={0.6}
          ambient={0.07}
        />

        {theatro ? (
          <PhotoPlate
            asset={theatro}
            height={plateHeight}
            position={[0, plateY, -420]}
            opacity={foto}
            exposure={0.86}
          />
        ) : null}

        {/* Placa comemorativa, e nao adesivo: encostada na margem esquerda,
            sobre o embasamento escuro da fachada. Duas razoes obrigam esta
            posicao — a peca que o modelo veste JA carrega a estampa do logo, e
            repetir a marca sobre o peito criaria duas versoes dela brigando no
            mesmo lugar; e o cinza da pedra so existe contra fundo escuro. */}
        <LogoExtruded
          height={range(relevo, [0, 1], [110, 215])}
          position={[-WIDTH * 0.235, -HEIGHT * 0.19, 260]}
          rotation={[rad(-8), giro, 0]}
          finish={0}
          opacity={relevo}
          exposure={0.9 + relevo * 0.4}
        />
      </Stage>

      {/* Etiqueta de museu: pequena, tracada, alinhada a margem. */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: GUTTER,
            top: GUTTER,
            // Sombra longa e difusa: a etiqueta cai sobre ceu claro e precisa
            // se descolar sem ganhar caixa nem barra.
            textShadow: '0 2px 22px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.6)',
          }}
        >
          <MaskedLine
            reveal={etiqueta}
            fontSize={24}
            lineHeight={1.5}
            travel={140}
            textStyle={{
              fontFamily: FONTS.grotesque,
              fontWeight: 500,
              letterSpacing: TRACKING.widest,
              textTransform: 'uppercase',
              color: COLORS.bone,
            }}
          >
            {BRAND.place}
          </MaskedLine>
          <div style={{ height: 10 }} />
          <MaskedLine
            reveal={etiqueta * 1.4 - 0.4}
            fontSize={19}
            lineHeight={1.7}
            travel={140}
            textStyle={{
              fontFamily: FONTS.grotesque,
              fontWeight: 400,
              letterSpacing: TRACKING.wider,
              textTransform: 'uppercase',
              color: COLORS.ash,
            }}
          >
            Theatro Municipal · 1911
          </MaskedLine>
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.86} />
    </AbsoluteFill>
  );
};
