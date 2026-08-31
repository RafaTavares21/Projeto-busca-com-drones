/**
 * TIMELINE MESTRE — EOG DRIP / DROP 01
 *
 * Unica fonte de verdade sobre ritmo. Nenhuma cena inventa frames proprios.
 * Ajustar a edicao e mudar numeros aqui, nao cacar `delay` espalhado por
 * cinco componentes.
 *
 * Convencao: `BEATS` sao SEMPRE frames LOCAIS, relativos ao inicio da propria
 * cena. `SCENES` sao frames ABSOLUTOS.
 *
 * Narrativa: IMPACTO -> IDENTIDADE -> PRODUTO -> DETALHES -> MARCA -> DROP
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const seconds = (s: number): number => Math.round(s * FPS);

export const DURATION_IN_FRAMES = seconds(15); // 450

type SceneSpan = { readonly from: number; readonly duration: number };

const span = (fromSeconds: number, toSeconds: number): SceneSpan => ({
  from: seconds(fromSeconds),
  duration: seconds(toSeconds) - seconds(fromSeconds),
});

export const SCENES = {
  impact: span(0, 2.5),          //   0 -  75
  productReveal: span(2.5, 6),   //  75 - 180
  details: span(6, 9),           // 180 - 270
  brand: span(9, 12),            // 270 - 360
  finalDrop: span(12, 15),       // 360 - 450
} as const;

export type SceneName = keyof typeof SCENES;

// ---------------------------------------------------------------------------
// BEATS — frames locais
// ---------------------------------------------------------------------------

export const BEATS = {
  /** CENA 01 — IMPACT (75f). Silencio, gesto vermelho, e a marca chegando. */
  impact: {
    /** Preto de verdade. Sem isso o impacto nao tem de onde vir. */
    silence: [0, 7] as const,
    /** A mao rasga o quadro em 15 frames. Rapida o bastante para exigir borrao. */
    handSlash: [7, 22] as const,
    /** A camera e arrancada na direcao contraria ao gesto, e volta ao eixo. */
    cameraWhip: [7, 30] as const,
    /** Fragmentos apenas na esteira do gesto, e apenas enquanto ele acontece. */
    debris: [9, 40] as const,
    /** EOG chega logo atras da mao. */
    eogIn: [21, 44] as const,
    /** DRIP avanca em outra escala e outra profundidade. */
    dripIn: [40, 66] as const,
    /** O frame em que DRIP cruza o plano da lente. */
    dripPass: 62,
    exit: [66, 75] as const,
  },

  /** CENA 02 — PRODUCT REVEAL (105f). Identidade grafica -> produto real. */
  productReveal: {
    /** A estampa entra pequena e distante; a camera avanca. */
    frontIn: [0, 42] as const,
    /** Luz vermelha percorre a arte. */
    frontLight: [6, 46] as const,
    /** A mao atravessa o quadro e faz a troca acontecer atras dela. */
    handWipe: [40, 60] as const,
    /** O frame exato da troca — no ponto de maior cobertura da mao. */
    swap: 50,
    /** A fotografia da peca vestida, revelada e aproximada. */
    backIn: [50, 100] as const,
    /** Parallax entre a peca e o fundo da fotografia. */
    backParallax: [50, 105] as const,
    exit: [96, 105] as const,
  },

  /** CENA 03 — PRODUCT DETAILS (90f). Percepcao de qualidade. */
  details: {
    /** A fotografia recompoe: sobe e abre espaco para o texto. */
    plateSettle: [0, 20] as const,
    /** PREMIUM COTTON. */
    specA: [8, 30] as const,
    /** A mao pequena que liga uma informacao a outra. */
    connector: [28, 44] as const,
    /** OVERSIZED FIT. */
    specB: [34, 56] as const,
    /** Os elementos se reduzem e preparam a entrada da marca. */
    reduce: [64, 82] as const,
    exit: [80, 90] as const,
  },

  /** CENA 04 — EOG DRIP (90f). A marca domina a composicao. */
  brand: {
    /** EOG emerge do fundo do espaco. */
    eogIn: [0, 32] as const,
    /** DRIP vem de tras da lente, em direcao oposta. */
    dripIn: [10, 40] as const,
    /** O encontro. Tudo reage a este numero. */
    collision: 40,
    /** Reacao: trepidacao curta, clarao, estilhacos. */
    shock: [40, 58] as const,
    /** A assinatura da marca, ja assentada. */
    signature: [50, 76] as const,
    /** Deriva lenta de perspectiva depois do impacto. */
    drift: [40, 90] as const,
    exit: [80, 90] as const,
  },

  /** CENA 05 — FINAL DROP (90f). Assinatura limpa. */
  finalDrop: {
    blackout: [0, 6] as const,
    /** Clarao unico, tres frames. */
    redFlash: [6, 9] as const,
    /** Silencio visual antes da assinatura. E ele que da peso ao ultimo frame. */
    hold: [9, 15] as const,
    /** A estampa entra como marca. */
    markIn: [15, 32] as const,
    /** EOG DRIP. */
    wordmark: [24, 44] as const,
    ruleIn: [40, 52] as const,
    dropIn: [50, 64] as const,
    comingSoon: [64, 78] as const,
    fadeOut: [83, 90] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// TRANSICOES — frames absolutos, desenhadas por cima de todas as cenas
// ---------------------------------------------------------------------------

export type TransitionKind = 'shutter' | 'flash' | 'wipe';

export type TransitionCue = {
  readonly kind: TransitionKind;
  readonly at: number;
  readonly duration: number;
  readonly direction?: 'up' | 'down' | 'left' | 'right';
  readonly color?: string;
};

/**
 * As transicoes vivem numa camada global: cada cena monta e desmonta seu
 * proprio contexto WebGL, e um corte seco denunciaria esse remount. A persiana
 * cobre exatamente o quadro em que a troca acontece.
 */
export const TRANSITIONS: readonly TransitionCue[] = [
  // 01 -> 02: persiana rapida para cima, escondendo a troca de cena 3D.
  { kind: 'shutter', at: SCENES.productReveal.from - 6, duration: 12, direction: 'up' },
  // 02 -> 03: corte curto, para a fotografia parecer continuar de uma cena a outra.
  { kind: 'shutter', at: SCENES.details.from - 4, duration: 8, direction: 'down' },
  // 03 -> 04: clarao vermelho anunciando o bloco da marca.
  { kind: 'flash', at: SCENES.brand.from - 3, duration: 7, color: 'red' },
  // 04 -> 05: persiana para baixo, entregando a tela preta do fecho.
  { kind: 'shutter', at: SCENES.finalDrop.from - 6, duration: 10, direction: 'down' },
];

// ---------------------------------------------------------------------------
// ACABAMENTO
// ---------------------------------------------------------------------------

export const GRAIN = {
  /** Acima de 0.1 vira ruido, nao textura. */
  opacity: 0.05,
  tile: 256,
  /** Grao trocado a cada N frames — grao por frame treme demais a 30 fps. */
  holdFrames: 2,
} as const;
