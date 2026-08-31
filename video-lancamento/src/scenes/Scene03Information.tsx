import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { HudOverlay } from '../components/HudOverlay';
import { InformationContainer, type ContainerState } from '../components/InformationContainer';
import { MotionBlur } from '../components/MotionBlur';
import { EASE } from '../animations/easings';
import { inOut, progress, range } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { COLORS, FONTS, TRACKING } from '../styles/tokens';
import { BEATS, HEIGHT, WIDTH } from '../timing';

const B = BEATS.information;

/** Posicoes finais, relativas ao centro do quadro. */
const LAYOUT = {
  aParked: { x: -232, y: -742, scale: 0.25 },
  bFinal: { x: 46, y: 128, scale: 0.94 },
} as const;

/**
 * CENA 03 — PRODUCT INFORMATION (6s a 9s)
 *
 * Dois blocos de ficha tecnica entram por lados opostos. O primeiro chega
 * grande, vira vermelho, encolhe e assume o canto; o segundo ocupa o lugar que
 * ele deixou. Nao sao dois cartoes: sao dois estados do mesmo sistema, e por
 * isso compartilham componente, tipografia e regra de entrada — o que muda e a
 * direcao, a escala e a cor.
 */
export const Scene03Information: React.FC = () => {
  const frame = useCurrentFrame();

  // --- Container A: PREMIUM / COTTON ---------------------------------------
  // Entra pela direita, fora do quadro, em mola com assentamento firme.
  const aEnter = springAt(frame, 'settle', {
    delay: B.containerAIn[0],
    durationInFrames: B.containerAIn[1] - B.containerAIn[0],
  });
  const aRed = progress(frame, B.containerAToRed[0], B.containerAToRed[1], EASE.power2Out);
  const aPark = springAt(frame, 'solid', {
    delay: B.containerAShrink[0],
    durationInFrames: B.containerAShrink[1] - B.containerAShrink[0],
  });

  const aState: ContainerState = {
    opacity: aEnter * (1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In)),
    // 0.15 -> 1 na entrada, depois 1 -> 0.25 ao estacionar.
    scale: range(aEnter, [0, 1], [0.15, 1]) * range(aPark, [0, 1], [1, LAYOUT.aParked.scale]),
    x: range(aEnter, [0, 1], [WIDTH * 1.05, 0]) + aPark * LAYOUT.aParked.x,
    y: aPark * LAYOUT.aParked.y,
    red: aRed,
    // A rotacao acompanha a direcao de entrada e zera ao assentar.
    rotateY: range(aEnter, [0, 1], [-26, 0]) + aPark * 6,
    reveal: progress(frame, B.containerAIn[0] + 6, B.containerAIn[1] + 8, EASE.power3Out),
  };

  // --- Container B: OVERSIZED / FIT ----------------------------------------
  // Entra pela esquerda — direcao oposta, mesma gramatica.
  const bEnter = springAt(frame, 'settle', {
    delay: B.containerBIn[0],
    durationInFrames: B.containerBIn[1] - B.containerBIn[0],
  });
  const bSettle = progress(frame, B.containerBSettle[0], B.containerBSettle[1], EASE.power3Out);

  const bState: ContainerState = {
    opacity: bEnter * (1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In)),
    scale: range(bEnter, [0, 1], [0.15, 1]) * range(bSettle, [0, 1], [1, LAYOUT.bFinal.scale]),
    x: range(bEnter, [0, 1], [-WIDTH * 1.05, 0]) + bSettle * LAYOUT.bFinal.x,
    y: bSettle * LAYOUT.bFinal.y,
    red: 0,
    rotateY: range(bEnter, [0, 1], [26, 0]) - bSettle * 6,
    reveal: progress(frame, B.containerBIn[0] + 6, B.containerBIn[1] + 8, EASE.power3Out),
  };

  // Borrao apenas nos frames em que os blocos cruzam o quadro.
  const aBlur = 1 - progress(frame, B.containerAIn[0], B.containerAIn[0] + 10, EASE.power2Out);
  const bBlur = 1 - progress(frame, B.containerBIn[0], B.containerBIn[0] + 10, EASE.power2Out);

  const line = progress(frame, B.systemLine[0], B.systemLine[1], EASE.power3Out);
  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);
  const hudReveal = inOut(frame, [8, 20, B.exit[0], B.exit[1]]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      <Background pool={0.5} redWash={aRed * 0.3} grunge={0.45} parallax={18} />

      {/* A linha declara os dois blocos como um sistema: sem ela, sao apenas
          dois cartoes que apareceram um depois do outro. */}
      <SystemLine progress={line} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <MotionBlur amount={bBlur} layers={5}>
          <InformationContainer lines={['OVERSIZED', 'FIT']} state={bState} kicker="Modelagem" index="02" />
        </MotionBlur>

        <MotionBlur amount={aBlur} layers={5}>
          <InformationContainer lines={['PREMIUM', 'COTTON']} state={aState} kicker="Material" index="01" />
        </MotionBlur>
      </AbsoluteFill>

      <HudOverlay
        top={[{ text: 'Ficha Tecnica', reveal: hudReveal }, { text: 'Drop 01', reveal: hudReveal, align: 'right' }]}
        marks={hudReveal * 0.6}
      />

      <FilmTreatment vignette={0.88} />
    </AbsoluteFill>
  );
};

/** Traco vertical fino ligando o bloco estacionado ao bloco ativo. */
const SystemLine: React.FC<{ progress: number }> = ({ progress: p }) => {
  const x = WIDTH / 2 + LAYOUT.aParked.x;
  const y0 = HEIGHT / 2 + LAYOUT.aParked.y + 90;
  const y1 = HEIGHT / 2 + LAYOUT.bFinal.y - 190;
  const length = y1 - y0;

  if (p <= 0) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute' }}>
        <line
          x1={x}
          y1={y0}
          x2={x}
          y2={y1}
          stroke={COLORS.red}
          strokeWidth={2}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - p)}
        />
        <circle cx={x} cy={y1} r={4} fill={COLORS.red} opacity={p} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x + 22,
          top: y0 + length * 0.42,
          fontFamily: FONTS.grotesque,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: TRACKING.widest,
          color: COLORS.ash,
          opacity: p,
        }}
      >
        SPEC
      </div>
    </AbsoluteFill>
  );
};
