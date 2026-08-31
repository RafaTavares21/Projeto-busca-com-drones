import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { PhotoPlate } from '../three/PhotoPlate';
import { Stage } from '../three/Stage';
import { BASE_Z, fillHeightAt } from '../three/stageConfig';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { progress, range } from '../animations/interpolate';
import { BRAND, COLORS, FONTS, TRACKING } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.nasRuas;

/**
 * CENA 04 — NAS RUAS (14s a 17.5s)
 *
 * A frase da campanha, em escala de monumento, sobre a fotografia do trio
 * contra a torre. A tipografia aqui nao legenda a imagem: ela ocupa o quadro
 * como se estivesse gravada na fachada.
 *
 * O parallax e a ferramenta principal: a arquitetura deriva num sentido e a
 * tipografia no oposto. Contrapor as direcoes rende mais separacao do que
 * empilhar varias camadas andando juntas — e produz espaco de verdade a partir
 * de uma imagem plana.
 */
export const Scene04NasRuas: React.FC = () => {
  const frame = useCurrentFrame();

  const torre = useAsset('trioTorre');

  const p = progress(frame, B.parallax[0], B.parallax[1], EASE.glide);

  // Duas velocidades em sentidos opostos. Com apenas dois planos, contrapor as
  // direcoes rende mais separacao do que empilhar tres na mesma direcao.
  const fundoX = range(p, [0, 1], [-38, 38]);
  const tipoX = range(p, [0, 1], [16, -16]);

  const abertura = progress(frame, B.abertura[0], B.abertura[1], EASE.expoOut);
  const escala = range(abertura, [0, 1], [1.16, 1.04]);

  const frase = progress(frame, B.frase[0], B.frase[0] + 20, EASE.expoOut);
  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.34} redWash={0.14} grunge={0.4} />

      <Stage exposure={1.02} environmentIntensity={0.5}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={7} seed="nas-ruas" />
        <Lighting key={1.5} fill={0.16} rim={2} rimPosition={[520, 180, -700]} top={2} ambient={0.07} />

        {torre ? (
          <PhotoPlate
            asset={torre}
            height={fillHeightAt(-820, escala)}
            position={[fundoX, 0, -820]}
            opacity={abertura}
            exposure={0.74}
          />
        ) : null}

      </Stage>

      {/* A frase vive na camada DOM: tipografia deste tamanho precisa do
          rasterizador de texto do navegador, nao de geometria. */}
      <AbsoluteFill
        style={{
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingLeft: 68,
          transform: `translateX(${tipoX.toFixed(1)}px)`,
          pointerEvents: 'none',
        }}
      >
        <div>
          {BRAND.tagline.split(' ').map((palavra, i) => (
            <MaskedLine
              key={palavra}
              reveal={frase * 1.6 - i * 0.3}
              fontSize={218}
              lineHeight={0.93}
              textStyle={{
                fontFamily: FONTS.display,
                letterSpacing: TRACKING.tight,
                color: COLORS.white,
                // Sombra dura e curta: a tipografia precisa se descolar da
                // fotografia sem parecer adesivo.
                textShadow: '0 10px 46px rgba(0,0,0,0.62)',
              }}
            >
              {palavra}
            </MaskedLine>
          ))}
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.9} />
    </AbsoluteFill>
  );
};
