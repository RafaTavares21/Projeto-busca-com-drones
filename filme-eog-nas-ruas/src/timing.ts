/**
 * TIMELINE MESTRE — EOG NAS RUAS
 *
 * Unica fonte de verdade sobre ritmo. Nenhuma cena inventa frames proprios.
 *
 * Convencao: `BEATS` sao frames LOCAIS, relativos ao inicio da propria cena.
 * `SCENES` sao frames ABSOLUTOS.
 *
 * A ideia: o centro monumental de Sao Paulo tratado como museu, e a marca
 * entrando nele. O filme comeca com a linguagem da arquitetura — camera parada,
 * reverente — e quebra para a linguagem da rua no momento em que a crew aparece.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const seconds = (s: number): number => Math.round(s * FPS);

/** 20 segundos. Quinze eram curtos demais para o arco monumento -> rua. */
export const DURATION_IN_FRAMES = seconds(20); // 600

type SceneSpan = { readonly from: number; readonly duration: number };

const span = (a: number, b: number): SceneSpan => ({
  from: seconds(a),
  duration: seconds(b) - seconds(a),
});

export const SCENES = {
  /** O monumento, vazio e formal. A marca nasce como bronze. */
  patrimonio: span(0, 4.5),   //   0 - 135
  /** A quebra: o bronze vira spray e a rua entra. */
  quebra: span(4.5, 7.5),     // 135 - 225
  /** A marca fixa enquanto a cidade muda atras dela. */
  marcaFixa: span(7.5, 14),   // 225 - 420
  /** A crew no espaco monumental, em escala. */
  nasRuas: span(14, 17.5),    // 420 - 525
  /** Assinatura. */
  drop: span(17.5, 20),       // 525 - 600
} as const;

export type SceneName = keyof typeof SCENES;

export const BEATS = {
  /** CENA 01 — PATRIMONIO (135f). */
  patrimonio: {
    /** Preto de verdade. O silencio e o que da peso ao que vem depois. */
    silencio: [0, 16] as const,
    /** Aproximacao lenta na fachada. Camera de documentario de arquitetura. */
    aproximacao: [14, 135] as const,
    /** Etiqueta de museu: pequena, tracada, precisa. */
    etiqueta: [34, 52] as const,
    /** O letreiro se materializa em bronze, entre os ornamentos. */
    bronzeIn: [66, 104] as const,
    /** Giro curto que revela a espessura da extrusao. */
    bronzeGiro: [66, 135] as const,
  },

  /** CENA 02 — A QUEBRA (90f). */
  quebra: {
    /** O bronze perde o metal e assume a cor da marca. */
    virada: [0, 24] as const,
    /** O corte para a rua. A partir daqui a camera e de mao. */
    rua: 26,
    /** As maos atravessam o quadro e entregam a rua atras delas. */
    maos: [20, 44] as const,
    /** Rajada de cortes na cidade. A rua chega em tres golpes, nao num fade. */
    rajada: [48, 66] as const,
    /** Trepidacao curta do corte — reacao, nao efeito. */
    impacto: [26, 44] as const,
    saida: [80, 90] as const,
  },

  /** CENA 03 — MARCA FIXA (195f). */
  marcaFixa: {
    /** O letreiro assume a posicao de ancora e nao sai mais dela. */
    ancora: [0, 18] as const,
    /**
     * Trocas da cidade atras da ancora. Cada numero e um corte.
     * O logo nao se move em nenhum deles — e isso que faz o corte sumir.
     */
    trocas: [30, 58, 86, 114, 142, 170] as const,
    /** Etiquetas de local, entrando e saindo com as trocas. */
    legendas: [34, 46] as const,
    saida: [180, 195] as const,
  },

  /** CENA 04 — NAS RUAS (105f). */
  nasRuas: {
    /** A fotografia abre em escala monumental. */
    abertura: [0, 30] as const,
    /** A frase da marca, em tipografia de monumento. */
    frase: [16, 48] as const,
    /** Parallax entre a arquitetura e a tipografia. */
    parallax: [0, 105] as const,
    saida: [92, 105] as const,
  },

  /** CENA 05 — DROP (75f). */
  drop: {
    apagao: [0, 5] as const,
    /** Clarao unico e curtissimo. */
    clarao: [5, 8] as const,
    /** Silencio antes da assinatura. */
    respiro: [8, 14] as const,
    marca: [14, 34] as const,
    regua: [32, 44] as const,
    breve: [42, 56] as const,
    contato: [54, 68] as const,
    fim: [68, 75] as const,
  },
} as const;

export type TransitionKind = 'shutter' | 'flash' | 'wipe';

export type TransitionCue = {
  readonly kind: TransitionKind;
  readonly at: number;
  readonly duration: number;
  readonly direction?: 'up' | 'down' | 'left' | 'right';
  readonly color?: string;
};

/**
 * As transicoes vivem numa camada global. Cada cena monta e desmonta seu
 * proprio contexto WebGL, e um corte seco denunciaria esse remount.
 */
export const TRANSITIONS: readonly TransitionCue[] = [
  // 02 -> 03: corte curto. A marca ja esta em cena, entao a troca e discreta.
  { kind: 'shutter', at: SCENES.marcaFixa.from - 4, duration: 8, direction: 'up' },
  // 03 -> 04: varredura, acompanhando a abertura de escala.
  { kind: 'wipe', at: SCENES.nasRuas.from - 5, duration: 11, direction: 'left' },
  // 04 -> 05: persiana entregando o preto do fecho.
  { kind: 'shutter', at: SCENES.drop.from - 6, duration: 10, direction: 'down' },
];

export const GRAIN = {
  opacity: 0.05,
  tile: 256,
  holdFrames: 2,
} as const;
