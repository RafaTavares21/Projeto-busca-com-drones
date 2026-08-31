/**
 * TIMELINE MESTRE — NEVER BROKE AGAIN / DROP 01
 *
 * Este arquivo e a unica fonte de verdade sobre ritmo. Nenhuma cena inventa
 * frames proprios: todas leem daqui. Ajustar o ritmo do comercial e mudar
 * numeros neste arquivo, nao cacar `delay` espalhado por cinco componentes.
 *
 * Convencao: os campos dentro de `BEATS` sao SEMPRE frames LOCAIS, relativos
 * ao inicio da propria cena. Os campos em `SCENES` sao frames ABSOLUTOS.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const seconds = (s: number): number => Math.round(s * FPS);

/** 15 segundos exatos. */
export const DURATION_IN_FRAMES = seconds(15); // 450

type SceneSpan = { readonly from: number; readonly duration: number };

const span = (fromSeconds: number, toSeconds: number): SceneSpan => ({
  from: seconds(fromSeconds),
  duration: seconds(toSeconds) - seconds(fromSeconds),
});

/**
 * As cinco cenas nao se sobrepoem: cada uma monta e desmonta sozinha.
 * Isso mantem um unico contexto WebGL vivo por vez durante o render e deixa
 * as transicoes por conta da camada global `TransitionLayer`.
 */
export const SCENES = {
  impact: span(0, 2.5),          // frames   0 - 75
  productReveal: span(2.5, 6),   // frames  75 - 180
  information: span(6, 9),       // frames 180 - 270
  neverBroke: span(9, 12),       // frames 270 - 360
  finalDrop: span(12, 15),       // frames 360 - 450
} as const;

export type SceneName = keyof typeof SCENES;

// ---------------------------------------------------------------------------
// BEATS — frames locais de cada cena
// ---------------------------------------------------------------------------

export const BEATS = {
  /** CENA 01 — IMPACT (75 frames). Pincelada violenta e a chegada de NEVER. */
  impact: {
    /** A tela fica genuinamente preta antes de qualquer coisa acontecer. */
    holdBlack: [0, 4] as const,
    /** A pincelada atravessa a tela em 14 frames. Rapida o bastante para exigir motion blur. */
    brushSweep: [4, 18] as const,
    /** Fragmentos e poeira sao lancados atras da pincelada. */
    debrisBurst: [6, 44] as const,
    /** A camera e chicoteada na direcao contraria ao movimento. */
    cameraWhip: [4, 26] as const,
    /** NEVER vem de muito longe e passa rente a camera. */
    typeApproach: [16, 68] as const,
    /** O momento em que o texto cruza o plano da camera. */
    typePassBy: 62,
    /** A rim light vermelha atinge o pico junto com a passagem. */
    rimPeak: [30, 62] as const,
    exit: [66, 75] as const,
  },

  /** CENA 02 — PRODUCT REVEAL (105 frames). A peca cresce de 0.15 a 1. */
  productReveal: {
    spaceFadeIn: [0, 14] as const,
    /** Escala da peca: 0.15 -> 1, em mola pesada. */
    garmentScale: [2, 74] as const,
    /** Dolly continuo durante toda a cena. */
    cameraDolly: [0, 105] as const,
    /** Rotacao lenta e continua — nunca para, nunca acelera. */
    garmentSpin: [0, 105] as const,
    /** A luz vermelha percorre a peca de um lado ao outro. */
    lightSweep: [18, 92] as const,
    particles: [10, 105] as const,
    /** Metadados de HUD entram em stagger. */
    hudIn: [46, 62] as const,
    exit: [92, 105] as const,
  },

  /** CENA 03 — PRODUCT INFORMATION (90 frames). Dois containers, um sistema. */
  information: {
    /** Container A: PREMIUM / COTTON entra pela direita. */
    containerAIn: [0, 18] as const,
    /** Escuro/translucido -> vermelho solido. */
    containerAToRed: [22, 40] as const,
    /** Encolhe para ~25% e assume o canto superior. */
    containerAShrink: [42, 60] as const,
    /** Container B: OVERSIZED / FIT entra pela esquerda, direcao oposta. */
    containerBIn: [46, 64] as const,
    /** B se acomoda no sistema junto de A. */
    containerBSettle: [66, 80] as const,
    /** Linha de conexao que declara os dois como um sistema so. */
    systemLine: [62, 76] as const,
    exit: [80, 90] as const,
  },

  /** CENA 04 — NEVER BROKE (90 frames). Colisao controlada em profundidades opostas. */
  neverBroke: {
    /** NEVER vem de tras do espaco 3D. */
    neverIn: [0, 30] as const,
    /** BROKE vem da frente, em direcao oposta. */
    brokeIn: [8, 36] as const,
    /** O frame exato do encontro. Tudo reage a este numero. */
    collision: 36,
    /** Reacao da colisao: trepidacao, clarao e estilhacos. */
    collisionShock: [36, 54] as const,
    /** AGAIN e revelado por mascara, em tipografia editorial. */
    againReveal: [44, 72] as const,
    /** Deriva de perspectiva sutil sobre o bloco inteiro. */
    perspectiveDrift: [36, 90] as const,
    exit: [80, 90] as const,
  },

  /** CENA 05 — FINAL DROP (90 frames). Fecho limpo. */
  finalDrop: {
    /** Preto absoluto antes do flash. */
    blackout: [0, 5] as const,
    /** Flash vermelho de 3 frames. Extremamente rapido, uma vez so. */
    redFlash: [5, 8] as const,
    /** Lockup NEVER BROKE / AGAIN. */
    lockupIn: [8, 30] as const,
    /** Regra que separa o lockup dos metadados. */
    ruleIn: [26, 38] as const,
    dropIn: [36, 52] as const,
    comingSoonIn: [54, 72] as const,
    /** Fade final. O comercial nao corta seco no fim. */
    fadeOut: [82, 90] as const,
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
 * As transicoes vivem numa camada global em vez de dentro das cenas: assim um
 * corte pode cobrir a troca de contexto WebGL entre duas cenas 3D, que e
 * exatamente onde um corte seco denunciaria o remount.
 */
export const TRANSITIONS: readonly TransitionCue[] = [
  // 01 -> 02: persiana rapida para cima, escondendo a troca de cena 3D.
  { kind: 'shutter', at: SCENES.productReveal.from - 6, duration: 12, direction: 'up' },
  // 02 -> 03: varredura lateral, na mesma direcao de entrada do primeiro container.
  { kind: 'wipe', at: SCENES.information.from - 5, duration: 11, direction: 'left' },
  // 03 -> 04: clarao vermelho curto anunciando o bloco tipografico.
  { kind: 'flash', at: SCENES.neverBroke.from - 3, duration: 7, color: 'red' },
  // 04 -> 05: persiana para baixo, entregando a tela preta da cena final.
  { kind: 'shutter', at: SCENES.finalDrop.from - 6, duration: 10, direction: 'down' },
];

// ---------------------------------------------------------------------------
// GRANULACAO / TEXTURA — constantes globais de acabamento
// ---------------------------------------------------------------------------

export const GRAIN = {
  /** Opacidade do grao de filme. Acima de 0.1 vira ruido, nao textura. */
  opacity: 0.055,
  /** Tamanho do ladrilho gerado em canvas, em px. */
  tile: 256,
  /** Grao trocado a cada N frames — grao por frame treme demais a 30 fps. */
  holdFrames: 2,
} as const;
