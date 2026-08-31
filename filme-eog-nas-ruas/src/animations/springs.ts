import { spring } from 'remotion';
import { FPS } from '../timing';

/**
 * Presets de fisica de mola.
 *
 * O `spring` do Remotion e resolvido analiticamente a partir do numero do frame,
 * entao e deterministico — ao contrario de qualquer simulacao integrada por
 * tempo real. Toda inercia do comercial vem daqui.
 */
export const SPRING = {
  /** Chega e para. Sem oscilacao visivel. Para tipografia pesada. */
  solid: { damping: 200, mass: 1, stiffness: 120 },
  /** Assentamento firme com um respiro. O padrao dos containers. */
  settle: { damping: 26, mass: 0.9, stiffness: 140 },
  /** Entrada seca e rapida — HUD, marcas, microinteracoes. */
  snap: { damping: 20, mass: 0.55, stiffness: 220 },
  /** Massa alta, movimento longo. Camera e objetos grandes. */
  heavy: { damping: 40, mass: 2.4, stiffness: 90 },
  /** Um unico rebote controlado. Usar com parcimonia. */
  rebound: { damping: 12, mass: 0.8, stiffness: 180 },
} as const;

export type SpringPreset = keyof typeof SPRING;

type SpringOptions = {
  /** Frame em que a mola comeca. Antes disso o valor fica em `from`. */
  delay?: number;
  from?: number;
  to?: number;
  /** Comprime ou estica a duracao da mola sem mudar seu caracter. */
  durationInFrames?: number;
};

export const springAt = (
  frame: number,
  preset: SpringPreset,
  { delay = 0, from = 0, to = 1, durationInFrames }: SpringOptions = {},
): number =>
  spring({
    frame: frame - delay,
    fps: FPS,
    config: SPRING[preset],
    from,
    to,
    durationInFrames,
  });
