import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { progress, pulse, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { BRAND, COLORS, FONTS, GUTTER, TRACKING } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.finalDrop;

/**
 * CENA 05 — FINAL DROP (12s a 15s)
 *
 * Preto. Um clarao vermelho de tres frames. E entao seis frames de silencio
 * visual antes de qualquer coisa aparecer — e essa pausa que da peso ao que
 * vem depois.
 *
 * A assinatura e montada em tipografia plana. Depois de doze segundos de
 * profundidade, o fecho ganha forca justamente por abandona-la: nada se move
 * alem do necessario, e o ultimo frame precisa aguentar ser visto parado.
 */
export const Scene05FinalDrop: React.FC = () => {
  const frame = useCurrentFrame();
  const print = useAsset('productFront');

  // Clarao unico e curtissimo. Repeti-lo o transformaria em glitch.
  const flash = pulse(frame, B.redFlash[0], B.redFlash[1], 0.3);

  const mark = springAt(frame, 'solid', {
    delay: B.markIn[0],
    from: 0.86,
    to: 1,
    durationInFrames: B.markIn[1] - B.markIn[0],
  });
  const markOpacity = progress(frame, B.markIn[0], B.markIn[1], EASE.power3Out);

  const wordMask = progress(frame, B.wordmark[0], B.wordmark[0] + 16, EASE.expoOut);
  const rule = progress(frame, B.ruleIn[0], B.ruleIn[1], EASE.power4Out);
  const drop = springAt(frame, 'snap', { delay: B.dropIn[0], durationInFrames: B.dropIn[1] - B.dropIn[0] });
  const coming = progress(frame, B.comingSoon[0], B.comingSoon[1], EASE.power3Out);

  const fade = 1 - progress(frame, B.fadeOut[0], B.fadeOut[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: fade }}>
      <Background pool={0.16 + flash * 0.6} redWash={flash} grunge={0.36} />

      {flash > 0 ? (
        <AbsoluteFill style={{ backgroundColor: COLORS.red, opacity: flash * 0.88, mixBlendMode: 'screen' }} />
      ) : null}

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: GUTTER,
          gap: 0,
        }}
      >
        {/* A estampa entra como marca — o mesmo grafismo que abriu o filme. */}
        {print ? (
          <Img
            src={print.url}
            style={{
              width: 300,
              marginBottom: 74,
              opacity: markOpacity,
              transform: `scale(${mark.toFixed(4)})`,
            }}
          />
        ) : null}

        {BRAND.words.map((word, i) => (
          <MaskedLine
            key={word}
            reveal={wordMask * 1.6 - i * 0.32}
            fontSize={226}
            lineHeight={0.98}
            textStyle={{
              fontFamily: FONTS.display,
              letterSpacing: TRACKING.tight,
              color: COLORS.white,
            }}
          >
            {word}
          </MaskedLine>
        ))}

        {/* Regra fina: separa a marca dos metadados do lancamento. */}
        <div
          style={{
            width: 470,
            height: 1,
            marginTop: 76,
            background: COLORS.ashDim,
            transform: `scaleX(${rule.toFixed(4)})`,
          }}
        />

        <div
          style={{
            marginTop: 56,
            fontFamily: FONTS.display,
            fontSize: 96,
            letterSpacing: TRACKING.wide,
            color: COLORS.red,
            transform: `scale(${range(drop, [0, 1], [0.2, 1]).toFixed(4)})`,
            opacity: drop,
          }}
        >
          {BRAND.drop}
        </div>

        <div
          style={{
            marginTop: 38,
            fontFamily: FONTS.grotesque,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: TRACKING.widest,
            color: COLORS.ash,
            opacity: coming,
            transform: `translateY(${((1 - coming) * 20).toFixed(2)}px)`,
          }}
        >
          {BRAND.status}
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.76} grain={0.042} />
    </AbsoluteFill>
  );
};
