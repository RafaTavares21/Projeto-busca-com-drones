/**
 * Direcao de arte — NEVER BROKE AGAIN / DROP 01.
 *
 * A paleta e deliberadamente curta: preto, branco e um unico vermelho.
 * Qualquer cor fora daqui e um erro de direcao de arte, nao uma escolha.
 */

export const COLORS = {
  /** Fundo absoluto. O preto do comercial e preto real, nao cinza escuro. */
  black: '#000000',
  /** Preto de cena — quase imperceptivelmente elevado, da corpo as sombras. */
  ink: '#050505',
  /** Preto de material, para superficies que precisam receber luz. */
  charcoal: '#0C0C0C',

  /** Branco puro, reservado para tipografia de impacto. */
  white: '#FFFFFF',
  /** Branco editorial levemente quente — usado em textos longos e HUD. */
  bone: '#EDE9E3',
  /** Cinza de suporte para metadados e HUD secundario. */
  ash: '#6E6E6E',
  ashDim: '#3A3A3A',

  /** O vermelho da marca. Saturado, sem rosa, sem laranja. */
  red: '#E10600',
  /** Vermelho de brilho — luzes, flashes, emissivos. */
  redHot: '#FF2A17',
  /** Vermelho de sombra — laterais extrudadas, degrades. */
  redDeep: '#7A0400',
} as const;

/** Escala tipografica em px, pensada para o canvas de 1080x1920. */
export const TYPE = {
  hero: 340,
  display: 210,
  title: 132,
  subtitle: 84,
  body: 46,
  label: 30,
  micro: 22,
} as const;

export const TRACKING = {
  tight: '-0.04em',
  normal: '0em',
  wide: '0.14em',
  wider: '0.32em',
  widest: '0.52em',
} as const;

/** Margem de seguranca lateral — mantem a composicao editorial, nao centralizada por acaso. */
export const GUTTER = 88;

export const FONTS = {
  display: '"Anton", "Arial Narrow", sans-serif',
  grotesque: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  editorial: '"Playfair Display", Georgia, serif',
} as const;
