import { interpolate } from 'remotion';
import { EASE } from './easings';

type Ease = (t: number) => number;

/**
 * `interpolate` do Remotion com clamp nas duas pontas por padrao.
 *
 * Extrapolacao acidental e a causa mais comum de elementos que "vazam" para
 * fora da sua janela de tempo, entao o padrao aqui e sempre travado.
 */
export const range = (
  frame: number,
  [inStart, inEnd]: readonly [number, number],
  [outStart, outEnd]: readonly [number, number],
  easing: Ease = EASE.linear,
): number =>
  interpolate(frame, [inStart, inEnd], [outStart, outEnd], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Progresso normalizado 0..1 dentro de uma janela de frames. */
export const progress = (frame: number, from: number, to: number, easing: Ease = EASE.linear): number =>
  easing(range(frame, [from, to], [0, 1]));

/**
 * Entra e sai: sobe entre `inA`..`inB` e desce entre `outA`..`outB`.
 * Evita empilhar dois `interpolate` toda vez que um elemento precisa aparecer e sumir.
 */
export const inOut = (
  frame: number,
  [inA, inB, outA, outB]: readonly [number, number, number, number],
  easeIn: Ease = EASE.power3Out,
  easeOut: Ease = EASE.power3Out,
): number => progress(frame, inA, inB, easeIn) * (1 - progress(frame, outA, outB, easeOut));

/** Atraso escalonado por indice — a base de todo stagger do projeto. */
export const stagger = (index: number, step: number, offset = 0): number => offset + index * step;

/**
 * Pulso curto de 0 -> 1 -> 0, usado em flashes e impactos.
 * `peak` e a fracao (0..1) da janela onde o pulso atinge o topo.
 */
export const pulse = (frame: number, from: number, to: number, peak = 0.25): number => {
  const t = range(frame, [from, to], [0, 1]);
  if (t <= 0 || t >= 1) return 0;
  return t < peak ? EASE.power2Out(t / peak) : EASE.power3Out(1 - (t - peak) / (1 - peak));
};

/** Converte graus em radianos — three.js trabalha em radianos, a direcao de arte pensa em graus. */
export const rad = (degrees: number): number => (degrees * Math.PI) / 180;
