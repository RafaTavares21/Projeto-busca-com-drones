import { HEIGHT, WIDTH } from '../timing';

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

/**
 * Altura, em unidades de mundo, que preenche o quadro na profundidade `z`.
 *
 * Um plano colocado atras do plano zero aparece MENOR do que seu tamanho
 * nominal, porque esta mais longe da lente. Dimensionar uma fotografia de fundo
 * pela altura do quadro, sem essa correcao, deixa tarja preta em cima e embaixo
 * — e o erro nao aparece no codigo, so no frame renderizado.
 *
 * Usar sempre isto para qualquer plano que precise sangrar no quadro.
 */
export const fillHeightAt = (z: number, coverage = 1): number =>
  HEIGHT * ((BASE_Z - z) / BASE_Z) * coverage;

/** Largura visivel do quadro na profundidade `z`. */
export const fillWidthAt = (z: number, coverage = 1): number =>
  WIDTH * ((BASE_Z - z) / BASE_Z) * coverage;

export const CAMERA = {
  fov: FOV,
  near: 1,
  far: 20000,
  position: [0, 0, BASE_Z] as [number, number, number],
} as const;
