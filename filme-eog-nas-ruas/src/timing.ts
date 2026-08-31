/**
 * TIMELINE MESTRE — EOG NAS RUAS
 *
 * Unica fonte de verdade sobre ritmo. Nenhuma cena inventa frames proprios.
 *
 * Convencao: `BEATS` sao frames LOCAIS, relativos ao inicio da propria cena.
 * `SCENES` sao frames ABSOLUTOS.
 *
 * ESTRUTURA: a mesma do DROP 01 — a linguagem que o cliente aprovou.
 * IMPACTO -> A RUA -> ESPECIFICACAO -> A MARCA -> DROP
 *
 * O que muda e o conteudo: no lugar do estudio preto entra o centro de Sao
 * Paulo, e no lugar da peca fotografada em fundo neutro entra a campanha na
 * rua. A gramatica — silencio, gesto vermelho, tipografia editorial em bloco,
 * colisao da marca, assinatura limpa — e a mesma.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const seconds = (s: number): number => Math.round(s * FPS);

/** 15 segundos, como o DROP 01. */
export const DURATION_IN_FRAMES = seconds(15); // 450

type SceneSpan = { readonly from: number; readonly duration: number };

const span = (a: number, b: number): SceneSpan => ({
  from: seconds(a),
  duration: seconds(b) - seconds(a),
});

export const SCENES = {
  /** Preto, o gesto vermelho, e a marca chegando. */
  impacto: span(0, 2.5),      //   0 -  75
  /** A rua entra. A mao faz a troca acontecer atras dela. */
  rua: span(2.5, 6),          //  75 - 180
  /** A ficha da peca, em linguagem de editorial. */
  ficha: span(6, 9),          // 180 - 270
  /** A marca domina a composicao. */
  marca: span(9, 12),         // 270 - 360
  /** Assinatura. */
  drop: span(12, 15),         // 360 - 450
} as const;

export type SceneName = keyof typeof SCENES;

export const BEATS = {
  /** CENA 01 — IMPACTO (75f). */
  impacto: {
    /** Preto de verdade. Sem isso o impacto nao tem de onde vir. */
    silencio: [0, 7] as const,
    /** A mao rasga o quadro em 15 frames. Rapida o bastante para exigir borrao. */
    rasgo: [7, 22] as const,
    /** A camera e arrancada na direcao contraria ao gesto, e volta ao eixo. */
    whip: [7, 30] as const,
    /** Estilhacos apenas na esteira do gesto, e apenas enquanto ele acontece. */
    estilhaco: [9, 40] as const,
    /** EOG chega logo atras da mao. */
    eogIn: [21, 44] as const,
    /** NAS RUAS avanca em outra escala e outra profundidade. */
    ruasIn: [40, 66] as const,
    /** O frame em que NAS RUAS cruza o plano da lente. */
    ruasPass: 62,
    saida: [66, 75] as const,
  },

  /** CENA 02 — A RUA (105f). */
  rua: {
    /** O Theatro entra pequeno e distante; a camera avanca. */
    theatroIn: [0, 42] as const,
    /** Luz vermelha percorre a fachada. */
    luz: [6, 46] as const,
    /** A mao atravessa o quadro e faz a troca acontecer atras dela. */
    wipe: [40, 60] as const,
    /** O frame exato da troca — no ponto de maior cobertura da mao. */
    troca: 50,
    /** O trio contra a torre, revelado e aproximado. */
    trioIn: [50, 100] as const,
    /** Parallax entre a fotografia e o fundo. */
    parallax: [50, 105] as const,
    saida: [96, 105] as const,
  },

  /** CENA 03 — ESPECIFICACAO (90f). */
  ficha: {
    /** A fotografia recompoe: sobe e abre espaco para o texto. */
    sobe: [0, 20] as const,
    /** MOLETINHO. */
    specA: [8, 30] as const,
    /** A mao pequena que liga uma informacao a outra. */
    conector: [28, 44] as const,
    /** CAIMENTO BOXY. */
    specB: [34, 56] as const,
    /** Os elementos se reduzem e preparam a entrada da marca. */
    reduz: [64, 82] as const,
    saida: [80, 90] as const,
  },

  /** CENA 04 — A MARCA (90f). */
  marca: {
    /** O letreiro emerge do fundo do espaco. */
    logoIn: [0, 32] as const,
    /** A frase vem de tras da lente, em direcao oposta. */
    fraseIn: [10, 40] as const,
    /** O encontro. Tudo reage a este numero. */
    colisao: 40,
    /** Reacao: trepidacao curta, clarao, estilhacos. */
    choque: [40, 58] as const,
    /** A assinatura da marca, ja assentada. */
    assinatura: [50, 76] as const,
    /** Deriva lenta de perspectiva depois do impacto. */
    deriva: [40, 90] as const,
    saida: [80, 90] as const,
  },

  /** CENA 05 — DROP (90f). */
  drop: {
    apagao: [0, 6] as const,
    /** Clarao unico, tres frames. */
    clarao: [6, 9] as const,
    /** Silencio visual antes da assinatura. E ele que da peso ao ultimo frame. */
    respiro: [9, 15] as const,
    /** O letreiro entra como marca. */
    marcaIn: [15, 32] as const,
    /** EOG NAS RUAS. */
    frase: [24, 44] as const,
    regua: [40, 52] as const,
    dropIn: [50, 64] as const,
    breve: [64, 78] as const,
    fim: [83, 90] as const,
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
export const TRANSITIONS = [
  // 01 -> 02: persiana rapida para cima, escondendo a troca de cena 3D.
  { kind: 'shutter', at: SCENES.rua.from - 6, duration: 12, direction: 'up' },
  // 02 -> 03: corte curto, para a fotografia parecer continuar de uma cena a outra.
  { kind: 'shutter', at: SCENES.ficha.from - 4, duration: 8, direction: 'down' },
  // 03 -> 04: clarao vermelho anunciando o bloco da marca.
  { kind: 'flash', at: SCENES.marca.from - 3, duration: 7, color: 'red' },
  // 04 -> 05: persiana para baixo, entregando a tela preta do fecho.
  { kind: 'shutter', at: SCENES.drop.from - 6, duration: 10, direction: 'down' },
] as const satisfies readonly TransitionCue[];

export const GRAIN = {
  /** Acima de 0.1 vira ruido, nao textura. */
  opacity: 0.05,
  tile: 256,
  /** Grao trocado a cada N frames — grao por frame treme demais a 30 fps. */
  holdFrames: 2,
} as const;

// ---------------------------------------------------------------------------
// MARCADORES
// ---------------------------------------------------------------------------

export type MarkerKind =
  | 'sceneStart'
  | 'sceneEnd'
  | 'impact'
  | 'transition'
  | 'beat'
  | 'textReveal'
  | 'productReveal'
  | 'finalHit';

export type Marker = {
  readonly kind: MarkerKind;
  /** Frame ABSOLUTO. */
  readonly at: number;
  /** O que acontece na imagem neste frame. */
  readonly note: string;
};

/** Converte um frame local de uma cena para o frame absoluto do filme. */
export const abs = (scene: SceneName, local: number): number => SCENES[scene].from + local;

const S = SCENES;
const B = BEATS;

/**
 * A lista de marcadores nao e documentacao: e o que o audio e as
 * micro-animacoes consultam. Todo marcador e derivado de `SCENES`/`BEATS`,
 * nunca digitado a mao — mexer no ritmo em um lugar move som e imagem juntos.
 */
export const MARKERS: readonly Marker[] = [
  { kind: 'sceneStart', at: S.impacto.from, note: '01 — o preto antes do gesto' },
  { kind: 'impact', at: abs('impacto', B.impacto.rasgo[0]), note: 'A MAO RASGA O QUADRO' },
  { kind: 'beat', at: abs('impacto', B.impacto.eogIn[0]), note: 'EOG entra atras da mao' },
  { kind: 'impact', at: abs('impacto', B.impacto.ruasPass), note: 'NAS RUAS cruza o plano da lente' },
  { kind: 'sceneEnd', at: S.impacto.from + S.impacto.duration, note: '01 termina' },

  { kind: 'transition', at: TRANSITIONS[0].at, note: 'persiana 01 -> 02' },
  { kind: 'sceneStart', at: S.rua.from, note: '02 — a rua' },
  { kind: 'transition', at: abs('rua', B.rua.wipe[0]), note: 'a mao entra para o wipe' },
  { kind: 'impact', at: abs('rua', B.rua.troca), note: 'TROCA atras da mao' },
  { kind: 'sceneEnd', at: S.rua.from + S.rua.duration, note: '02 termina' },

  { kind: 'transition', at: TRANSITIONS[1].at, note: 'persiana 02 -> 03' },
  { kind: 'sceneStart', at: S.ficha.from, note: '03 — especificacao' },
  { kind: 'textReveal', at: abs('ficha', B.ficha.specA[0]), note: 'MOLETINHO' },
  { kind: 'beat', at: abs('ficha', B.ficha.conector[0]), note: 'o conector liga os dois blocos' },
  { kind: 'textReveal', at: abs('ficha', B.ficha.specB[0]), note: 'CAIMENTO BOXY' },
  { kind: 'sceneEnd', at: S.ficha.from + S.ficha.duration, note: '03 termina' },

  { kind: 'transition', at: TRANSITIONS[2].at, note: 'clarao vermelho 03 -> 04' },
  { kind: 'sceneStart', at: S.marca.from, note: '04 — a marca' },
  { kind: 'impact', at: abs('marca', B.marca.colisao), note: 'A COLISAO — o pico do filme' },
  { kind: 'productReveal', at: abs('marca', B.marca.assinatura[0]), note: 'a assinatura assenta' },
  { kind: 'sceneEnd', at: S.marca.from + S.marca.duration, note: '04 termina' },

  { kind: 'transition', at: TRANSITIONS[3].at, note: 'persiana 04 -> 05' },
  { kind: 'sceneStart', at: S.drop.from, note: '05 — apagao' },
  { kind: 'impact', at: abs('drop', B.drop.clarao[0]), note: 'CLARAO — o drop' },
  { kind: 'productReveal', at: abs('drop', B.drop.marcaIn[0]), note: 'assinatura da marca' },
  { kind: 'textReveal', at: abs('drop', B.drop.dropIn[0]), note: 'DROP 01' },
  { kind: 'textReveal', at: abs('drop', B.drop.breve[0]), note: 'EM BREVE' },
  { kind: 'finalHit', at: abs('drop', B.drop.fim[0]) - 10, note: 'ultimo golpe, e o silencio' },
  { kind: 'sceneEnd', at: S.drop.from + S.drop.duration, note: 'fim' },
];

export const markersOf = (kind: MarkerKind): readonly number[] =>
  MARKERS.filter((m) => m.kind === kind).map((m) => m.at);

/**
 * Energia residual do impacto mais recente, em [0,1].
 *
 * E o que permite a um componente qualquer reagir a um golpe sem conhecer a
 * cena em que esta. A queda e exponencial porque impacto real decai rapido e
 * some devagar — linear soaria mecanico.
 */
export const impactEnergy = (
  frame: number,
  decay = 14,
  kinds: readonly MarkerKind[] = ['impact', 'finalHit'],
): number => {
  let energy = 0;
  for (const m of MARKERS) {
    if (!kinds.includes(m.kind)) continue;
    const dt = frame - m.at;
    if (dt < 0 || dt > decay * 3) continue;
    energy = Math.max(energy, Math.exp(-dt / decay));
  }
  return energy;
};

// ---------------------------------------------------------------------------
// SOM
// ---------------------------------------------------------------------------

export type SoundName =
  | 'impact'
  | 'subImpact'
  | 'whoosh'
  | 'swipe'
  | 'hit'
  | 'textReveal'
  | 'click'
  | 'rumble'
  | 'riser'
  | 'transitionHit'
  | 'dropImpact';

/** Duracao real de cada arquivo em `public/audio`, em frames. */
export const SOUND_FRAMES: Readonly<Record<SoundName, number>> = {
  impact: seconds(0.9),
  subImpact: seconds(1.5),
  whoosh: seconds(0.62),
  swipe: seconds(0.3),
  hit: seconds(0.42),
  textReveal: seconds(0.2),
  click: seconds(0.06),
  rumble: seconds(3.2),
  riser: seconds(1.3),
  transitionHit: seconds(0.7),
  dropImpact: seconds(2.4),
};

export type SoundCue = {
  readonly sound: SoundName;
  /** Frame ABSOLUTO em que o som comeca. */
  readonly at: number;
  readonly volume: number;
  /**
   * Encurta o som, com esvaecimento no fim. Usado quando a cauda natural do
   * arquivo atropelaria um silencio que a direcao quer preservar.
   */
  readonly duration?: number;
  /** A acao visual que este som existe para reforcar. Se estiver vazio, corte o som. */
  readonly reason: string;
};

/** Quantos frames de esvaecimento um som encurtado recebe no fim. */
export const SOUND_FADE = 10;

/** Duracao efetiva de um cue, ja considerando o corte de cauda. */
export const cueFrames = (cue: SoundCue): number =>
  Math.min(cue.duration ?? SOUND_FRAMES[cue.sound], SOUND_FRAMES[cue.sound]);

/** Ancora um som pelo seu FIM: o transiente cai exatamente em `at`. */
const landsOn = (sound: SoundName, at: number): number => at - SOUND_FRAMES[sound];

/**
 * DESENHO DE SOM — sem musica, so efeitos.
 *
 * Duas regras governam esta lista:
 *
 * 1. Nenhum som existe sozinho. Cada linha nomeia a acao visual que reforca, e
 *    um som sem acao correspondente e ruido.
 * 2. O silencio e um instrumento. Os primeiros frames e os ultimos frames do
 *    filme sao mudos de proposito: sem eles os impactos nao teriam contra o
 *    que bater.
 */
export const SOUND_CUES: readonly SoundCue[] = [
  // --- 01 IMPACTO
  // Comeca EXATAMENTE no frame da mao, e nao antes: os 7 frames de preto sao
  // a unica coisa que da escala ao golpe, e um som de antecipacao os gastaria.
  { sound: 'whoosh', at: abs('impacto', B.impacto.rasgo[0]), volume: 0.5, reason: 'a mao rasga o quadro' },
  { sound: 'impact', at: abs('impacto', B.impacto.rasgo[0]), volume: 0.88, reason: 'A MAO RASGA O QUADRO' },
  { sound: 'subImpact', at: abs('impacto', B.impacto.rasgo[0]), volume: 0.66, reason: 'peso grave sob o mesmo gesto' },
  { sound: 'rumble', at: abs('impacto', B.impacto.rasgo[0]), volume: 0.26, reason: 'o espaco passa a ter fundo' },
  { sound: 'hit', at: abs('impacto', B.impacto.eogIn[0]), volume: 0.42, reason: 'EOG entra atras da mao' },
  { sound: 'swipe', at: abs('impacto', B.impacto.ruasIn[0]), volume: 0.38, reason: 'NAS RUAS avanca' },
  { sound: 'transitionHit', at: abs('impacto', B.impacto.ruasPass), volume: 0.6, reason: 'NAS RUAS cruza a lente' },

  // --- 02 A RUA
  { sound: 'transitionHit', at: TRANSITIONS[0].at, volume: 0.34, reason: 'persiana 01 -> 02' },
  { sound: 'subImpact', at: S.rua.from, volume: 0.4, reason: 'o Theatro entra' },
  { sound: 'rumble', at: S.rua.from, volume: 0.24, reason: 'fundo da rua' },
  { sound: 'whoosh', at: abs('rua', B.rua.wipe[0]), volume: 0.48, reason: 'a mao cruza rentes a lente' },
  { sound: 'impact', at: abs('rua', B.rua.troca), volume: 0.72, reason: 'TROCA atras da mao' },
  { sound: 'click', at: abs('rua', B.rua.trioIn[0]) + 14, volume: 0.2, reason: 'metadado de canto' },

  // --- 03 ESPECIFICACAO — a cena mais quieta do filme.
  { sound: 'transitionHit', at: TRANSITIONS[1].at, volume: 0.3, reason: 'persiana 02 -> 03' },
  { sound: 'textReveal', at: abs('ficha', B.ficha.specA[0]), volume: 0.34, reason: 'MOLETINHO e escrito' },
  { sound: 'click', at: abs('ficha', B.ficha.conector[0]), volume: 0.22, reason: 'o conector liga os blocos' },
  { sound: 'textReveal', at: abs('ficha', B.ficha.specB[0]), volume: 0.34, reason: 'CAIMENTO BOXY e escrito' },
  { sound: 'riser', at: landsOn('riser', abs('marca', B.marca.colisao)), volume: 0.44, reason: 'tensao subindo ate a colisao' },

  // --- 04 A MARCA
  { sound: 'swipe', at: S.marca.from, volume: 0.34, reason: 'clarao vermelho abrindo o bloco da marca' },
  { sound: 'whoosh', at: abs('marca', B.marca.fraseIn[0]), volume: 0.4, reason: 'a frase vem de tras da lente' },
  { sound: 'impact', at: abs('marca', B.marca.colisao), volume: 0.95, reason: 'A COLISAO' },
  { sound: 'subImpact', at: abs('marca', B.marca.colisao), volume: 0.75, reason: 'peso grave da colisao' },
  { sound: 'hit', at: abs('marca', B.marca.assinatura[0]), volume: 0.4, reason: 'a assinatura assenta' },

  // --- 05 DROP — um golpe, e o silencio.
  { sound: 'transitionHit', at: TRANSITIONS[3].at, volume: 0.42, reason: 'persiana entregando o apagao' },
  {
    sound: 'dropImpact',
    at: abs('drop', B.drop.clarao[0]),
    volume: 0.92,
    // A cauda natural tem 72 frames e cobriria justamente o silencio depois do
    // ultimo golpe. Cortada aqui, o filme fecha como foi escrito: golpe, e nada.
    duration: abs('drop', B.drop.fim[0]) - 10 - abs('drop', B.drop.clarao[0]) - 2,
    reason: 'CLARAO — o drop',
  },
  { sound: 'impact', at: abs('drop', B.drop.clarao[0]), volume: 0.66, reason: 'transiente do mesmo clarao' },
  { sound: 'textReveal', at: abs('drop', B.drop.dropIn[0]), volume: 0.26, reason: 'DROP 01' },
  { sound: 'click', at: abs('drop', B.drop.breve[0]), volume: 0.2, reason: 'EM BREVE' },
  // Alto de proposito: ele cai no silencio, entao nao compete com nada. Medido
  // no render anterior, 0.55 chegava a um terco do pico do filme e lia como
  // sobra, nao como fecho.
  { sound: 'hit', at: abs('drop', B.drop.fim[0]) - 10, volume: 0.9, reason: 'ultimo golpe — depois dele so ha silencio' },
];

/**
 * Trilha musical.
 *
 * A direcao escolhida foi SEM MUSICA: so desenho de som. O caminho fica
 * preparado assim mesmo — colocar `public/audio/music.mp3` (ou .wav), ligar
 * `enabled` e apontar `src` basta. Enquanto `enabled` for `false` nenhum
 * arquivo e requisitado, e por isso o render nao depende de um arquivo que
 * nao existe.
 */
export const MUSIC = {
  enabled: false,
  src: 'audio/music.mp3',
  volume: 0.5,
  /** Curva pretendida quando houver trilha: INTRO -> BUILD -> IMPACTO -> DROP -> FECHO. */
  structure: [
    { at: S.impacto.from, section: 'INTRO' },
    { at: S.rua.from, section: 'BUILD' },
    { at: abs('marca', B.marca.colisao), section: 'IMPACTO' },
    { at: abs('drop', B.drop.clarao[0]), section: 'DROP' },
    { at: abs('drop', B.drop.fim[0]) - 10, section: 'FECHO' },
  ],
} as const;
