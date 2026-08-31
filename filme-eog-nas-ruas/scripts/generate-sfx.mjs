/**
 * Sintetiza a biblioteca de efeitos sonoros do filme.
 *
 * Nao ha arquivos de audio licenciados no projeto, e inventar dependencia de
 * arquivo inexistente quebraria o render. Entao os efeitos sao GERADOS: ruido,
 * senoides e envelopes escritos em WAV, com um gerador pseudoaleatorio semeado
 * para que o mesmo comando produza sempre os mesmos bytes.
 *
 * Isso mantem o projeto inteiro deterministico — o audio, como a imagem, e
 * funcao pura da semente. E deixa a substituicao trivial: gravar por cima de
 * `public/audio/<nome>.wav` com um som real nao exige mudar uma linha de codigo.
 *
 * Rodar com: npm run sfx
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/audio');
const RATE = 44100;

// --- base ------------------------------------------------------------------

/** PRNG semeado. O ruido precisa ser identico a cada geracao. */
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seconds = (s) => Math.round(s * RATE);

/** Envelope exponencial: ataque curto, queda com curva. */
const env = (t, dur, { attack = 0.004, curve = 3 } = {}) => {
  if (t < attack) return t / attack;
  const p = (t - attack) / (dur - attack);
  return p >= 1 ? 0 : Math.pow(1 - p, curve);
};

/** Filtro passa-baixa de um polo. Simples, mas suficiente para dar corpo. */
const lowpass = (buf, cutoff) => {
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = (1 / RATE) / (rc + 1 / RATE);
  let prev = 0;
  for (let i = 0; i < buf.length; i++) {
    prev += alpha * (buf[i] - prev);
    buf[i] = prev;
  }
  return buf;
};

/** Passa-alta complementar, para tirar peso de sons que devem soar leves. */
const highpass = (buf, cutoff) => {
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = rc / (rc + 1 / RATE);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    prevOut = alpha * (prevOut + x - prevIn);
    prevIn = x;
    buf[i] = prevOut;
  }
  return buf;
};

/** Cauda por atraso realimentado — da tamanho ao som sem soar como reverb. */
const tail = (buf, delayMs, feedback, mix) => {
  const d = Math.round((delayMs / 1000) * RATE);
  const wet = new Float64Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const back = i - d;
    wet[i] = buf[i] + (back >= 0 ? wet[back] * feedback : 0);
  }
  for (let i = 0; i < buf.length; i++) {
    buf[i] = buf[i] * (1 - mix) + wet[i] * mix;
  }
  return buf;
};

/** Normaliza e aplica um limite suave, evitando estouro no mux. */
const finish = (buf, peak = 0.86) => {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) {
    // tanh como limitador: o pico e contido sem o corte duro do clipping.
    buf[i] = Math.tanh(buf[i] * g * 1.1) * 0.92;
  }
  return buf;
};

const writeWav = (name, buf) => {
  const n = buf.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 2, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(RATE, 24);
  out.writeUInt32LE(RATE * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  // O tamanho do chunk `data`. Sem ele o arquivo abre, o cabecalho parece
  // valido e o decodificador simplesmente le zero amostra — falha muda.
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf[i] * 32767))), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, `${name}.wav`), out);
  console.log(`  ${name}.wav`.padEnd(24) + `${(n / RATE).toFixed(2)}s   ${(out.length / 1024).toFixed(0)} KB`);
};

// --- vozes -----------------------------------------------------------------

const noise = (n, seed) => {
  const rnd = mulberry32(seed);
  const buf = new Float64Array(n);
  for (let i = 0; i < n; i++) buf[i] = rnd() * 2 - 1;
  return buf;
};

/** Senoide com queda de altura — a base de todo impacto grave. */
const sweepSine = (n, f0, f1, curve = 2.4) => {
  const buf = new Float64Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const f = f1 + (f0 - f1) * Math.pow(1 - p, curve);
    phase += (2 * Math.PI * f) / RATE;
    buf[i] = Math.sin(phase);
  }
  return buf;
};

const mix = (...layers) => {
  const n = Math.max(...layers.map((l) => l.length));
  const out = new Float64Array(n);
  for (const l of layers) for (let i = 0; i < l.length; i++) out[i] += l[i];
  return out;
};

const shape = (buf, dur, opts) => {
  for (let i = 0; i < buf.length; i++) buf[i] *= env(i / RATE, dur, opts);
  return buf;
};

// --- a biblioteca ----------------------------------------------------------

const SFX = {
  /** Golpe seco com corpo grave. O som padrao de chegada. */
  impact: () => {
    const d = 0.9;
    const n = seconds(d);
    const sub = shape(sweepSine(n, 120, 44), d, { curve: 3.4 });
    const body = shape(lowpass(noise(n, 11), 420), d, { curve: 5 });
    const crack = shape(highpass(noise(seconds(0.06), 12), 1800), 0.06, { curve: 2 });
    return finish(tail(mix(sub, body.map((v) => v * 0.5), crack), 42, 0.28, 0.22));
  },

  /** Grave puro, sem transiente. Para o que chega por baixo. */
  subImpact: () => {
    const d = 1.5;
    const n = seconds(d);
    return finish(shape(sweepSine(n, 78, 29, 3.8), d, { attack: 0.012, curve: 2.6 }), 0.92);
  },

  /** Passagem de ar. Sobe, cruza, some. */
  whoosh: () => {
    const d = 0.62;
    const n = seconds(d);
    const buf = highpass(lowpass(noise(n, 21), 2600), 260);
    // Envelope em sino: o pico no meio e o que faz o som CRUZAR, e nao bater.
    for (let i = 0; i < n; i++) buf[i] *= Math.pow(Math.sin((i / n) * Math.PI), 1.7);
    return finish(tail(buf, 26, 0.2, 0.16), 0.72);
  },

  /** Whoosh curto e mais claro, para gestos rapidos. */
  swipe: () => {
    const d = 0.3;
    const n = seconds(d);
    const buf = highpass(lowpass(noise(n, 31), 5200), 700);
    for (let i = 0; i < n; i++) buf[i] *= Math.pow(Math.sin((i / n) * Math.PI), 2.1);
    return finish(buf, 0.66);
  },

  /** Batida media e curta. Marca corte sem pesar. */
  hit: () => {
    const d = 0.42;
    const n = seconds(d);
    const body = shape(sweepSine(n, 260, 90, 2), d, { curve: 4.5 });
    const air = shape(highpass(noise(n, 41), 1200), d, { curve: 6 });
    return finish(mix(body, air.map((v) => v * 0.42)), 0.8);
  },

  /** Tique de revelacao de texto. Curto, claro, quase falado. */
  textReveal: () => {
    const d = 0.2;
    const n = seconds(d);
    const air = shape(highpass(noise(n, 51), 2400), d, { curve: 5 });
    const ping = shape(sweepSine(n, 2100, 1500, 1.4), d, { curve: 6 });
    return finish(mix(air.map((v) => v * 0.7), ping.map((v) => v * 0.35)), 0.5);
  },

  /** Clique digital. O menor evento da biblioteca. */
  click: () => {
    const d = 0.06;
    const n = seconds(d);
    return finish(shape(highpass(noise(n, 61), 3200), d, { attack: 0.0008, curve: 3 }), 0.42);
  },

  /** Base grave continua. Sustenta a tensao sem chamar atencao. */
  rumble: () => {
    const d = 3.2;
    const n = seconds(d);
    const buf = lowpass(lowpass(noise(n, 71), 120), 70);
    for (let i = 0; i < n; i++) {
      const p = i / n;
      buf[i] *= Math.pow(Math.sin(p * Math.PI), 0.7);
    }
    return finish(buf, 0.55);
  },

  /** Subida de tensao. Prepara o impacto — nunca aparece sozinha. */
  riser: () => {
    const d = 1.3;
    const n = seconds(d);
    const buf = noise(n, 81);
    // O corte do filtro sobe junto com o volume: e a abertura do timbre, e nao
    // so o ganho, que produz a sensacao de subida.
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      const cutoff = 300 + Math.pow(p, 2.2) * 7000;
      const rc = 1 / (2 * Math.PI * cutoff);
      const alpha = (1 / RATE) / (rc + 1 / RATE);
      prev += alpha * (buf[i] - prev);
      buf[i] = prev * Math.pow(p, 1.9);
    }
    return finish(buf, 0.62);
  },

  /** Batida de transicao: transiente medio com cauda curta. */
  transitionHit: () => {
    const d = 0.7;
    const n = seconds(d);
    const body = shape(sweepSine(n, 420, 120, 2.2), d, { curve: 4 });
    const air = shape(highpass(noise(n, 91), 900), d, { curve: 5.5 });
    return finish(tail(mix(body, air.map((v) => v * 0.55)), 58, 0.34, 0.3), 0.84);
  },

  /** O maior evento do filme. Reservado para o fecho. */
  dropImpact: () => {
    const d = 2.4;
    const n = seconds(d);
    const sub = shape(sweepSine(n, 96, 27, 4.2), d, { attack: 0.006, curve: 2.2 });
    const body = shape(lowpass(noise(n, 101), 700), d, { curve: 3.6 });
    const crack = shape(highpass(noise(seconds(0.09), 102), 1500), 0.09, { curve: 2 });
    return finish(tail(mix(sub, body.map((v) => v * 0.45), crack.map((v) => v * 0.8)), 74, 0.4, 0.3), 0.95);
  },
};

fs.mkdirSync(OUT, { recursive: true });
console.log('\nSintetizando efeitos sonoros...');
for (const [name, make] of Object.entries(SFX)) {
  writeWav(name, make());
}
console.log('');
