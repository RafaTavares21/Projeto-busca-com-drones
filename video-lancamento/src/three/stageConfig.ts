import { HEIGHT } from '../timing';

/**
 * Convencao de unidades do espaco 3D.
 *
 * A distancia base da camera e escolhida para que, no plano z=0, uma unidade
 * de mundo valha exatamente um pixel da composicao. Isso deixa a direcao de
 * arte pensar em "300px de altura" tanto no DOM quanto no three.js, sem duas
 * escalas mentais concorrentes.
 */
export const FOV = 38;

/** Distancia da camera para enquadrar `height` unidades no plano z=0. */
export const distanceForHeight = (height: number, fov = FOV): number =>
  height / 2 / Math.tan((fov * Math.PI) / 360);

/** ~2788 — a camera "neutra" do comercial. */
export const BASE_Z = distanceForHeight(HEIGHT);

export const CAMERA = {
  fov: FOV,
  near: 1,
  far: 20000,
  position: [0, 0, BASE_Z] as [number, number, number],
} as const;
