import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/tokens';
import { EASE } from '../animations/easings';
import { progress, pulse } from '../animations/interpolate';
import { TRANSITIONS, type TransitionCue } from '../timing';

/**
 * Camada global de transicoes.
 *
 * As transicoes vivem acima de todas as cenas, em frames absolutos, em vez de
 * dentro delas. A razao e pratica: cada cena 3D monta e desmonta seu proprio
 * contexto WebGL, e um corte seco denunciaria esse remount. A persiana cobre
 * exatamente o quadro em que a troca acontece.
 */
export const TransitionLayer: React.FC<{ cues?: readonly TransitionCue[] }> = ({ cues = TRANSITIONS }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {cues.map((cue, i) => {
        const active = frame >= cue.at - 1 && frame <= cue.at + cue.duration + 1;
        if (!active) return null;
        return <Transition key={i} cue={cue} frame={frame} />;
      })}
    </>
  );
};

const Transition: React.FC<{ cue: TransitionCue; frame: number }> = ({ cue, frame }) => {
  const { kind, at, duration } = cue;

  if (kind === 'flash') {
    // Clarao curto e assimetrico: sobe em um frame, cai em tres.
    const intensity = pulse(frame, at, at + duration, 0.18);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: cue.color === 'red' ? COLORS.red : COLORS.white,
          opacity: intensity * 0.92,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (kind === 'shutter') {
    // Uma folha preta fecha o quadro e reabre do outro lado. O meio da janela e
    // preto pleno — e ali que a cena troca.
    const half = duration / 2;
    const closing = progress(frame, at, at + half, EASE.power4In);
    const opening = progress(frame, at + half, at + duration, EASE.power4Out);
    const cover = closing - opening;

    const up = cue.direction === 'up';
    const enterFrom = up ? 100 : -100;
    const exitTo = up ? -100 : 100;
    const y = frame < at + half ? enterFrom * (1 - closing) : exitTo * opening;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.black,
          transform: `translateY(${y.toFixed(2)}%)`,
          opacity: cover > 0 ? 1 : 0,
          pointerEvents: 'none',
        }}
      />
    );
  }

  // wipe — uma barra vermelha atravessa o quadro e leva a cena com ela.
  const t = progress(frame, at, at + duration, EASE.power4InOut);
  const left = cue.direction === 'left';
  const barPosition = left ? 100 - t * 200 : -100 + t * 200;

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.black,
          transform: `translateX(${(left ? 1 : -1) * (100 - t * 100) * (t < 0.5 ? 1 : 0)}%)`,
          opacity: t < 0.5 ? t * 2 : 2 - t * 2,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.red,
          // Barra estreita: e um gesto, nao uma cortina.
          clipPath: `inset(0 ${(100 - Math.abs(barPosition) * 0).toFixed(0)}% 0 0)`,
          transform: `translateX(${barPosition.toFixed(2)}%) skewX(-8deg)`,
          width: '26%',
          left: '37%',
          right: 'auto',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
