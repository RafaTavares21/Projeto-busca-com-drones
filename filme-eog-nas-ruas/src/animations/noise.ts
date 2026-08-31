import { random } from 'remotion';

/**
 * Ruido deterministico.
 *
 * Tudo que parece "organico" no comercial — trepidacao de camera, deriva de
 * mao livre, dispersao de particulas — sai daqui. O `random` do Remotion e uma
 * funcao hash pura da seed, entao o mesmo frame produz sempre o mesmo valor,
 * em qualquer worker de render.
 */

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Ruido de valor 1D suavizado, no intervalo -1..1. */
export const noise1D = (seed: string, t: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  return a + (b - a) * smooth(f);
};

/**
 * Ruido fractal (varias oitavas somadas). Da a trepidacao um detalhe fino
 * sobre um movimento amplo, em vez do balanco de senoide unica.
 */
export const fbm = (seed: string, t: number, octaves = 3): number => {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    value += noise1D(`${seed}:o${o}`, t * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value / total;
};

/** Valor aleatorio estavel em um intervalo, indexado por seed. */
export const randRange = (seed: string, min: number, max: number): number =>
  min + random(seed) * (max - min);

/** Ponto distribuido em um disco, sem o acumulo no centro do sorteio ingenuo. */
export const randInDisc = (seed: string, radius: number): [number, number] => {
  const angle = random(`${seed}:a`) * Math.PI * 2;
  const r = Math.sqrt(random(`${seed}:r`)) * radius;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
};
