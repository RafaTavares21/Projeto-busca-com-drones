/**
 * Direcao de arte — EOG DRIP / EOG NAS RUAS.
 *
 * O filme vive na tensao entre o centro monumental de Sao Paulo e a rua. A
 * paleta serve a essa tensao: o preto e o branco vem da arquitetura, o vermelho
 * vem exclusivamente da marca. Nenhuma cor entra por decoracao — o que colore
 * o quadro e a propria fotografia.
 */

export const BRAND = {
  name: 'EOG DRIP',
  tagline: 'EOG NAS RUAS',
  status: 'EM BREVE',
  handle: '@eogdrip',
  site: 'eogdrip.com.br',
  place: 'São Paulo · Centro',
} as const;

/** Ficha da peca, como a marca a descreve. */
export const PRODUTO = {
  tecido: 'Moletinho',
  caimento: 'Caimento boxy',
} as const;

export const COLORS = {
  black: '#000000',
  ink: '#060606',

  white: '#FFFFFF',
  /** Branco de etiqueta de museu — levemente quente, nunca puro em texto pequeno. */
  bone: '#EDE9E2',
  ash: '#8C8C8C',
  ashDim: '#3C3C3C',

  /** O vermelho da marca, amostrado da propria estampa. */
  red: '#C81208',
  redHot: '#FF3A24',
  redDeep: '#8A0B04',

  /**
   * Pedra do centro: o logo nasce gravado na fachada, no cinza do proprio
   * predio, e so depois recebe a cor da marca. Nada aqui sai de PRETO /
   * BRANCO / VERMELHO — nenhum tom quente entra na paleta.
   */
  stone: '#CFCAC2',
  stoneDark: '#2A2A2A',
} as const;

/**
 * Tipografia editorial de apoio. Curta de proposito: cada uma destas linhas
 * tem que ganhar seu lugar no quadro, e uma lista maior viraria enfeite.
 * A hierarquia e explicita — a marca fala mais alto, o drop vem em seguida,
 * e a ficha e a nota de rodape.
 */
export const LABELS = {
  drop: 'DROP 01',
  limitado: 'PEÇA LIMITADA',
  numero: '01/01',
} as const;

export const TYPE = {
  monument: 250,
  display: 168,
  title: 96,
  body: 40,
  label: 26,
  micro: 20,
} as const;

export const TRACKING = {
  tight: '-0.045em',
  normal: '0em',
  wide: '0.14em',
  wider: '0.30em',
  widest: '0.52em',
} as const;

export const GUTTER = 84;

export const FONTS = {
  display: '"Anton", "Arial Narrow", sans-serif',
  grotesque: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  editorial: '"Playfair Display", Georgia, serif',
} as const;
