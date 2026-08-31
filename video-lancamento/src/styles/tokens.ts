/**
 * Direcao de arte — EOG DRIP / DROP 01.
 *
 * A paleta e deliberadamente curta: preto, branco e um unico vermelho — o
 * mesmo vermelho das maos da estampa. Qualquer cor fora daqui e um erro de
 * direcao de arte, nao uma escolha.
 */

export const BRAND = {
  name: 'EOG DRIP',
  words: ['EOG', 'DRIP'] as const,
  drop: 'DROP 01',
  status: 'EM BREVE',
  /** A assinatura da propria marca, tirada do poster de campanha. */
  tagline: 'EOG NAS RUAS',
} as const;

export const COLORS = {
  /** Fundo absoluto. O preto da campanha e preto real, nao cinza escuro. */
  black: '#000000',
  /** Preto de cena — quase imperceptivelmente elevado, da corpo as sombras. */
  ink: '#050505',

  /** Branco puro, reservado para tipografia de impacto. */
  white: '#FFFFFF',
  /** Branco levemente quente — textos longos e informacao secundaria. */
  bone: '#EFECE7',
  /** Cinza de suporte. */
  ash: '#8A8A8A',
  ashDim: '#3A3A3A',

  /** O vermelho das maos, amostrado da propria estampa. */
  red: '#C81208',
  /** Vermelho de brilho — luzes, flashes, emissivos. */
  redHot: '#FF2A17',
  /** Vermelho das laterais extrudadas. Forte e escuro, nunca apagado. */
  redDeep: '#8A0B04',
} as const;

/** Escala tipografica em px, pensada para o quadro de 1080x1920. */
export const TYPE = {
  hero: 330,
  display: 218,
  title: 128,
  subtitle: 76,
  body: 42,
  label: 28,
  micro: 21,
} as const;

export const TRACKING = {
  tight: '-0.045em',
  normal: '0em',
  wide: '0.12em',
  wider: '0.28em',
  widest: '0.46em',
} as const;

/** Margem de seguranca lateral — mantem a composicao editorial. */
export const GUTTER = 84;

export const FONTS = {
  display: '"Anton", "Arial Narrow", sans-serif',
  grotesque: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  editorial: '"Playfair Display", Georgia, serif',
} as const;
