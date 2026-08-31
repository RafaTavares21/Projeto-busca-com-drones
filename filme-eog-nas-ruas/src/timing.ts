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
  /** O monumento, vazio e formal. A marca nasce gravada na pedra. */
  patrimonio: span(0, 4.5),   //   0 - 135
  /** A quebra: a pedra ganha a cor da marca e a rua entra. */
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
    /** O letreiro se materializa em pedra, entre os ornamentos. */
    relevoIn: [66, 104] as const,
    /** Giro curto que revela a espessura da extrusao. */
    relevoGiro: [66, 135] as const,
  },

  /** CENA 02 — A QUEBRA (90f). */
  quebra: {
    /** A pedra recebe a cor da marca. */
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
     *
     * Os intervalos ACELERAM (28, 24, 20, 16, 12) e param. Uma grade regular
     * vira metronomo: o olho aprende o compasso e para de assistir. Acelerar
     * e travar no ultimo quadro cria a unica coisa que o corte regular nao
     * produz — expectativa, e depois silencio. Os 50 frames parados no fim
     * nao sao sobra: sao o respiro onde a ficha da peca cabe.
     */
    trocas: [30, 58, 82, 102, 118, 130] as const,
    /** Etiquetas de local, entrando e saindo com as trocas. */
    legendas: [34, 46] as const,
    /** A ficha do produto entra no respiro, depois que os cortes travam. */
    ficha: [136, 150] as const,
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
    /**
     * As maos voltam, agora como PRIMEIRO PLANO da abertura: elas passam
     * rentes a lente e a arquitetura se revela atras. E o mesmo dispositivo da
     * cena 02 usado com outra funcao — la ele escondia um corte, aqui ele da
     * profundidade a um plano que seria chapado.
     */
    maos: [0, 20] as const,
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
export const TRANSITIONS = [
  // 02 -> 03: corte curto. A marca ja esta em cena, entao a troca e discreta.
  { kind: 'shutter', at: SCENES.marcaFixa.from - 4, duration: 8, direction: 'up' },
  // 03 -> 04: varredura, acompanhando a abertura de escala.
  { kind: 'wipe', at: SCENES.nasRuas.from - 5, duration: 11, direction: 'left' },
  // 04 -> 05: persiana entregando o preto do fecho.
  { kind: 'shutter', at: SCENES.drop.from - 6, duration: 10, direction: 'down' },
] as const satisfies readonly TransitionCue[];

export const GRAIN = {
  opacity: 0.05,
  tile: 256,
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
  { kind: 'sceneStart', at: S.patrimonio.from, note: '01 — o preto antes da imagem' },
  { kind: 'textReveal', at: abs('patrimonio', B.patrimonio.etiqueta[0]), note: 'etiqueta de museu' },
  { kind: 'beat', at: abs('patrimonio', B.patrimonio.relevoIn[0]), note: 'o relevo comeca a existir' },
  { kind: 'beat', at: abs('patrimonio', B.patrimonio.relevoIn[1]), note: 'o relevo assenta' },
  { kind: 'sceneEnd', at: S.patrimonio.from + S.patrimonio.duration, note: '01 termina' },

  { kind: 'sceneStart', at: S.quebra.from, note: '02 — a virada de material' },
  { kind: 'transition', at: abs('quebra', B.quebra.maos[0]), note: 'as maos entram no quadro' },
  { kind: 'impact', at: abs('quebra', B.quebra.rua), note: 'CORTE PARA A RUA — o maior impacto do filme' },
  { kind: 'impact', at: abs('quebra', B.quebra.rajada[0]), note: 'segundo golpe da rajada' },
  { kind: 'impact', at: abs('quebra', B.quebra.rajada[1]), note: 'terceiro golpe da rajada' },
  { kind: 'sceneEnd', at: S.quebra.from + S.quebra.duration, note: '02 termina' },

  { kind: 'transition', at: TRANSITIONS[0].at, note: 'persiana 02 -> 03' },
  { kind: 'sceneStart', at: S.marcaFixa.from, note: '03 — a marca trava no quadro' },
  { kind: 'productReveal', at: abs('marcaFixa', B.marcaFixa.ancora[1]), note: 'a ancora esta posta' },
  { kind: 'textReveal', at: abs('marcaFixa', B.marcaFixa.legendas[0]), note: 'etiquetas de local' },
  ...B.marcaFixa.trocas.map(
    (t, i): Marker => ({
      kind: 'beat',
      at: abs('marcaFixa', t),
      note: `troca ${i + 1}/${B.marcaFixa.trocas.length} — a cidade muda, a marca nao`,
    }),
  ),
  { kind: 'textReveal', at: abs('marcaFixa', B.marcaFixa.ficha[0]), note: 'ficha da peca, no respiro' },
  { kind: 'sceneEnd', at: S.marcaFixa.from + S.marcaFixa.duration, note: '03 termina' },

  { kind: 'transition', at: TRANSITIONS[1].at, note: 'varredura 03 -> 04' },
  { kind: 'transition', at: abs('nasRuas', B.nasRuas.maos[0]), note: 'as maos cruzam a lente na abertura' },
  { kind: 'sceneStart', at: S.nasRuas.from, note: '04 — abertura de escala' },
  { kind: 'textReveal', at: abs('nasRuas', B.nasRuas.frase[0]), note: 'EOG NAS RUAS' },
  { kind: 'sceneEnd', at: S.nasRuas.from + S.nasRuas.duration, note: '04 termina' },

  { kind: 'transition', at: TRANSITIONS[2].at, note: 'persiana 04 -> 05' },
  { kind: 'sceneStart', at: S.drop.from, note: '05 — apagao' },
  { kind: 'impact', at: abs('drop', B.drop.clarao[0]), note: 'CLARAO — o drop' },
  { kind: 'productReveal', at: abs('drop', B.drop.marca[0]), note: 'assinatura da marca' },
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
export const impactEnergy = (frame: number, decay = 14, kinds: readonly MarkerKind[] = ['impact', 'finalHit']): number => {
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
 *    um som sem acao correspondente e ruido — foi por isso que a lista tem
 *    trinta e poucas entradas e nao cem.
 * 2. O silencio e um instrumento. Os primeiros 14 frames, o respiro do fim da
 *    cena 03 e os ultimos frames do filme sao mudos de proposito: sem eles os
 *    impactos nao teriam contra o que bater.
 *
 * A dinamica tambem e desenhada: a cena 01 nunca passa de 0.35, o corte para a
 * rua chega a 0.9, e o filme fecha em um unico golpe seguido de silencio.
 */
export const SOUND_CUES: readonly SoundCue[] = [
  // --- 01 PATRIMONIO — camara baixa, quase muda.
  { sound: 'rumble', at: 14, volume: 0.26, reason: 'a sala do museu ganha ar quando a foto aparece' },
  { sound: 'textReveal', at: abs('patrimonio', B.patrimonio.etiqueta[0]), volume: 0.3, reason: 'a etiqueta e escrita' },
  { sound: 'click', at: abs('patrimonio', B.patrimonio.etiqueta[0]) + 8, volume: 0.22, reason: 'a segunda linha da etiqueta' },
  { sound: 'whoosh', at: abs('patrimonio', B.patrimonio.relevoIn[0]) - 8, volume: 0.2, reason: 'o relevo se materializa na fachada' },
  { sound: 'hit', at: abs('patrimonio', B.patrimonio.relevoIn[1]), volume: 0.28, reason: 'o relevo assenta na pedra' },

  // --- 02 A QUEBRA — o pico do filme.
  { sound: 'riser', at: landsOn('riser', abs('quebra', B.quebra.rua)), volume: 0.42, reason: 'tensao subindo ate o corte para a rua' },
  { sound: 'whoosh', at: abs('quebra', B.quebra.maos[0]), volume: 0.45, reason: 'as maos cruzam rentes a lente' },
  { sound: 'impact', at: abs('quebra', B.quebra.rua), volume: 0.9, reason: 'CORTE PARA A RUA' },
  { sound: 'subImpact', at: abs('quebra', B.quebra.rua), volume: 0.7, reason: 'peso grave sob o mesmo corte' },
  { sound: 'rumble', at: abs('quebra', B.quebra.rua), volume: 0.3, reason: 'a rua passa a ter fundo' },
  { sound: 'hit', at: abs('quebra', B.quebra.rajada[0]), volume: 0.55, reason: 'segundo golpe da rajada' },
  { sound: 'hit', at: abs('quebra', B.quebra.rajada[1]), volume: 0.55, reason: 'terceiro golpe da rajada' },

  // --- 03 MARCA FIXA — cortes acelerando, depois respiro.
  { sound: 'transitionHit', at: TRANSITIONS[0].at, volume: 0.34, reason: 'persiana 02 -> 03' },
  { sound: 'hit', at: abs('marcaFixa', B.marcaFixa.ancora[1]), volume: 0.38, reason: 'a marca trava na posicao de ancora' },
  { sound: 'textReveal', at: abs('marcaFixa', B.marcaFixa.legendas[0]), volume: 0.26, reason: 'etiqueta de local' },
  { sound: 'click', at: abs('marcaFixa', B.marcaFixa.trocas[0]), volume: 0.26, reason: 'troca 1' },
  { sound: 'click', at: abs('marcaFixa', B.marcaFixa.trocas[1]), volume: 0.28, reason: 'troca 2' },
  { sound: 'swipe', at: abs('marcaFixa', B.marcaFixa.trocas[2]), volume: 0.3, reason: 'troca 3 — o intervalo comeca a fechar' },
  { sound: 'swipe', at: abs('marcaFixa', B.marcaFixa.trocas[3]), volume: 0.34, reason: 'troca 4' },
  { sound: 'swipe', at: abs('marcaFixa', B.marcaFixa.trocas[4]), volume: 0.38, reason: 'troca 5' },
  { sound: 'hit', at: abs('marcaFixa', B.marcaFixa.trocas[5]), volume: 0.5, reason: 'troca 6 — a aceleracao trava aqui' },
  { sound: 'textReveal', at: abs('marcaFixa', B.marcaFixa.ficha[0]), volume: 0.26, reason: 'a ficha da peca entra no respiro' },

  // --- 04 NAS RUAS — abertura de escala.
  { sound: 'whoosh', at: abs('nasRuas', B.nasRuas.maos[0]) - 6, volume: 0.5, reason: 'as maos cruzam a lente e abrem a escala' },
  { sound: 'subImpact', at: S.nasRuas.from, volume: 0.45, reason: 'a arquitetura chega em tamanho monumental' },
  { sound: 'rumble', at: S.nasRuas.from, volume: 0.22, reason: 'fundo da rua' },
  { sound: 'textReveal', at: abs('nasRuas', B.nasRuas.frase[0]), volume: 0.4, reason: 'EOG NAS RUAS entra' },
  { sound: 'click', at: abs('nasRuas', B.nasRuas.frase[0]) + 9, volume: 0.24, reason: 'a segunda linha da frase' },
  { sound: 'riser', at: landsOn('riser', abs('drop', B.drop.clarao[0])), volume: 0.44, reason: 'tensao subindo ate o clarao' },

  // --- 05 DROP — um golpe, e o silencio.
  { sound: 'transitionHit', at: TRANSITIONS[2].at, volume: 0.42, reason: 'persiana entregando o apagao' },
  {
    sound: 'dropImpact',
    at: abs('drop', B.drop.clarao[0]),
    volume: 0.95,
    // A cauda natural tem 72 frames e cobriria justamente o silencio depois do
    // ultimo golpe. Cortada aqui, o filme fecha como foi escrito: golpe, e nada.
    duration: abs('drop', B.drop.fim[0]) - 10 - abs('drop', B.drop.clarao[0]) - 2,
    reason: 'CLARAO — o drop',
  },
  { sound: 'impact', at: abs('drop', B.drop.clarao[0]), volume: 0.68, reason: 'transiente do mesmo clarao' },
  { sound: 'click', at: abs('drop', B.drop.breve[0]), volume: 0.2, reason: 'EM BREVE' },
  { sound: 'textReveal', at: abs('drop', B.drop.contato[0]), volume: 0.2, reason: 'o contato' },
  // 0.90, e nao 0.55: medido no arquivo renderizado, o `hit` chegava a 0.21 de
  // pico contra os 0.69 do corte para a rua. Um fecho a um terco do volume do
  // meio do filme nao lê como golpe, lê como sobra. Ele cai no silencio, entao
  // pode ser alto sem competir com nada.
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
    { at: S.patrimonio.from, section: 'INTRO' },
    { at: abs('quebra', B.quebra.virada[0]), section: 'BUILD' },
    { at: abs('quebra', B.quebra.rua), section: 'IMPACTO' },
    { at: abs('drop', B.drop.clarao[0]), section: 'DROP' },
    { at: abs('drop', B.drop.fim[0]) - 10, section: 'FECHO' },
  ],
} as const;
