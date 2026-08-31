/**
 * Confere que todo som citado na timeline existe em disco, que o arquivo e um
 * WAV legivel, e que a duracao declarada em `SOUND_FRAMES` bate com a real.
 *
 * Uma duracao errada nao quebra o render — ela apenas corta o som antes do
 * fim, silenciosamente. E exatamente por ser silencioso que precisa de teste.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;

const src = readFileSync(join(root, 'src/timing.ts'), 'utf8');

const framesBlock = src.match(/SOUND_FRAMES[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!framesBlock) throw new Error('SOUND_FRAMES nao encontrado em src/timing.ts');
const declared = new Map();
for (const [, name, secs] of framesBlock[1].matchAll(/(\w+):\s*seconds\(([\d.]+)\)/g)) {
  declared.set(name, Math.round(Number(secs) * FPS));
}

// `at:` pode conter chamadas com virgula — abs('drop', 12) — entao a expressao
// nao pode parar na primeira virgula. Ancora em `volume:` e volta dali.
const cues = [...src.matchAll(/\{\s*sound:\s*'(\w+)',\s*at:\s*([\s\S]*?),\s*volume:\s*([\d.]+)/g)].map(
  ([, sound, at, volume]) => ({ sound, at: at.trim(), volume: Number(volume) }),
);

/** Duracao real, lida do cabecalho RIFF. */
const wavFrames = (file) => {
  const buf = readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${file} nao e um WAV valido`);
  }
  let offset = 12;
  let rate = 0;
  let bytesPerFrame = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      const channels = buf.readUInt16LE(offset + 10);
      rate = buf.readUInt32LE(offset + 12);
      bytesPerFrame = (buf.readUInt16LE(offset + 22) / 8) * channels;
    }
    if (id === 'data') {
      if (!rate || !bytesPerFrame) throw new Error(`${file}: data antes de fmt`);
      return { seconds: size / bytesPerFrame / rate, rate, bytes: buf.length };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`${file}: chunk data ausente`);
};

let problems = 0;
console.log('SOM                 ARQUIVO      REAL     DECLARADO   USOS');
for (const [name, frames] of declared) {
  const file = join(root, 'public/audio', `${name}.wav`);
  if (!existsSync(file)) {
    console.log(`${name.padEnd(18)} AUSENTE — rode 'npm run sfx'`);
    problems++;
    continue;
  }
  const { seconds, rate, bytes } = wavFrames(file);
  const real = Math.round(seconds * FPS);
  const uses = cues.filter((c) => c.sound === name).length;
  // Um frame de folga: 0.9s a 44.1kHz nao cai em fronteira exata de frame.
  const ok = Math.abs(real - frames) <= 1;
  if (!ok) problems++;
  if (rate !== 44100) problems++;
  console.log(
    `${name.padEnd(18)} ${String(Math.round(bytes / 1024) + 'KB').padEnd(12)} ` +
      `${(real + 'f').padEnd(8)} ${(frames + 'f').padEnd(11)} ${uses}` +
      `${ok ? '' : '   <-- DIVERGENCIA'}${uses === 0 ? '   <-- nunca usado' : ''}`,
  );
}

const orfaos = cues.filter((c) => !declared.has(c.sound));
if (orfaos.length) {
  console.log(`\nCues apontando para sons nao declarados: ${orfaos.map((o) => o.sound).join(', ')}`);
  problems += orfaos.length;
}

const alto = cues.filter((c) => c.volume > 1);
if (alto.length) {
  console.log(`\n${alto.length} cue(s) com volume acima de 1.0 — vai clipar.`);
  problems += alto.length;
}

console.log(`\n${cues.length} cues no total.`);
console.log(problems ? `\n${problems} problema(s).` : '\nAudio validado.');
process.exit(problems ? 1 : 0);
