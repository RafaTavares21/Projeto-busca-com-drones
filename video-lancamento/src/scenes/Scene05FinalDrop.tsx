import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { MaskedLine } from '../components/MaskedLine';
import { EASE } from '../animations/easings';
import { progress, pulse, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { COLORS, FONTS, GUTTER, TRACKING } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.finalDrop;

/**
 * CENA 05 — FINAL DROP (12s a 15s)
 *
 * Preto. Um clarao vermelho de tres frames. E entao o lockup, montado em
 * tipografia plana — depois de quinze segundos de profundidade, o fecho ganha
 * forca justamente por abandona-la. Nada se move alem do necessario.
 */
export const Scene05FinalDrop: React.FC = () => {
  const frame = useCurrentFrame();

  // Clarao unico e curtissimo. Repeti-lo o transformaria em glitch.
  const flash = pulse(frame, B.redFlash[0], B.redFlash[1], 0.3);

  const lockup = springAt(frame, 'solid', {
    delay: B.lockupIn[0],
    durationInFrames: B.lockupIn[1] - B.lockupIn[0],
  });
  const lockupMask = progress(frame, B.lockupIn[0], B.lockupIn[0] + 16, EASE.expoOut);
  const againMask = progress(frame, B.lockupIn[0] + 8, B.lockupIn[1] + 4, EASE.expoOut);

  const rule = progress(frame, B.ruleIn[0], B.ruleIn[1], EASE.power4Out);
  const drop = springAt(frame, 'snap', { delay: B.dropIn[0], durationInFrames: B.dropIn[1] - B.dropIn[0] });
  const coming = progress(frame, B.comingSoonIn[0], B.comingSoonIn[1], EASE.power3Out);

  const fade = 1 - progress(frame, B.fadeOut[0], B.fadeOut[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: fade }}>
      <Background pool={0.2 + flash * 0.6} redWash={flash} grunge={0.4} />

      {flash > 0 ? (
        <AbsoluteFill style={{ backgroundColor: COLORS.red, opacity: flash * 0.85, mixBlendMode: 'screen' }} />
      ) : null}

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: GUTTER }}>
        {/* NEVER BROKE — duas linhas em Anton, reveladas por mascara. */}
        {['NEVER', 'BROKE'].map((word, i) => (
          <MaskedLine
            key={word}
            reveal={lockupMask * 1.6 - i * 0.3}
            fontSize={236}
            lineHeight={0.99}
            textStyle={{
              fontFamily: FONTS.display,
              letterSpacing: TRACKING.tight,
              color: COLORS.white,
              scale: `${(0.97 + lockup * 0.03).toFixed(4)}`,
            }}
          >
            {word}
          </MaskedLine>
        ))}

        {/* AGAIN. — a assinatura editorial, com o ponto final. */}
        <MaskedLine
          reveal={againMask}
          fontSize={150}
          lineHeight={1.32}
          travel={120}
          style={{ marginTop: 14 }}
          textStyle={{
            fontFamily: FONTS.editorial,
            fontStyle: 'italic',
            fontWeight: 500,
            color: COLORS.red,
          }}
        >
          again.
        </MaskedLine>

        {/* Regra fina: separa a marca dos metadados do lancamento. */}
        <div
          style={{
            width: 520,
            height: 1,
            marginTop: 78,
            background: COLORS.ashDim,
            transform: `scaleX(${rule.toFixed(4)})`,
          }}
        />

        <div
          style={{
            marginTop: 60,
            fontFamily: FONTS.display,
            fontSize: 104,
            letterSpacing: TRACKING.wide,
            color: COLORS.white,
            transform: `scale(${range(drop, [0, 1], [0.15, 1]).toFixed(4)})`,
            opacity: drop,
          }}
        >
          DROP 01
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: FONTS.grotesque,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: TRACKING.widest,
            color: COLORS.ash,
            opacity: coming,
            transform: `translateY(${((1 - coming) * 22).toFixed(2)}px)`,
          }}
        >
          COMING SOON
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.8} grain={0.045} />
    </AbsoluteFill>
  );
};
