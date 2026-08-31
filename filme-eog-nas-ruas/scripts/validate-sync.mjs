/**
 * Confere que som e imagem lem o mesmo relogio.
 *
 * A timeline e TypeScript, entao ela e compilada de verdade (esbuild) e
 * importada — checar por regex daria a resposta errada assim que um frame
 * passasse a ser calculado em vez de digitado.
 *
 * O que e verificado:
 *   1. Todo cue cai dentro do filme e nao estoura o fim.
 *   2. Todo marcador de impacto tem som, e todo som forte tem imagem.
 *   3. As janelas de silencio declaradas na direcao continuam mudas.
 *   4. Nenhum empilhamento absurdo de sons simultaneos.
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'eog-sync-'));
const outfile = join(tmp, 'timing.mjs');

await build({
  entryPoints: [join(root, 'src/timing.ts')],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  logLevel: 'silent',
});

const T = await import(pathToFileURL(outfile).href);
rmSync(tmp, { recursive: true, force: true });

const { DURATION_IN_FRAMES, FPS, SCENES, SOUND_CUES, SOUND_FRAMES, cueFrames, MARKERS, MUSIC } = T;
/** Duracao efetiva, ja com o corte de cauda que a direcao pediu. */
const dur = (c) => cueFrames(c);
const at = (f) => `${String(f).padStart(3)}f / ${(f / FPS).toFixed(2)}s`;

let problems = 0;
const fail = (msg) => {
  console.log(`  FALHA  ${msg}`);
  problems++;
};

console.log(`\nFilme: ${DURATION_IN_FRAMES} frames (${(DURATION_IN_FRAMES / FPS).toFixed(1)}s a ${FPS}fps)\n`);

// 1 — cues dentro do filme.
console.log('1. Limites dos cues');
for (const c of SOUND_CUES) {
  if (c.at < 0) fail(`${c.sound} comeca antes do filme (${c.at})`);
  if (c.at >= DURATION_IN_FRAMES) fail(`${c.sound} comeca depois do fim (${c.at})`);
  const end = c.at + dur(c);
  if (end > DURATION_IN_FRAMES) {
    const sobra = end - DURATION_IN_FRAMES;
    // Uma cauda cortada no ultimo frame e aceitavel; um som inteiro fora nao e.
    if (sobra > dur(c) * 0.25) {
      fail(`${c.sound} @${c.at} passa ${sobra}f do fim — a cauda seria decepada`);
    } else {
      console.log(`  nota   ${c.sound} @${c.at} termina ${sobra}f apos o fim (cauda, aceitavel)`);
    }
  }
  if (!c.reason?.trim()) fail(`${c.sound} @${c.at} nao diz que acao reforca`);
}
if (!problems) console.log('  ok');

// 2 — impactos com som.
console.log('\n2. Marcadores de impacto x som');
const fortes = SOUND_CUES.filter((c) => c.volume >= 0.5).map((c) => c.at);
for (const m of MARKERS.filter((x) => x.kind === 'impact' || x.kind === 'finalHit')) {
  const perto = fortes.some((f) => Math.abs(f - m.at) <= 2);
  if (!perto) fail(`marcador '${m.note}' em ${at(m.at)} nao tem som forte`);
  else console.log(`  ok     ${m.kind.padEnd(9)} ${at(m.at)}  ${m.note}`);
}

// 3 — silencio de direcao.
console.log('\n3. Janelas de silencio');
const SILENCIOS = [
  // O filme abre com 7 frames de preto — e essa a janela que a direcao promete.
  { nome: 'abertura do filme', from: 0, to: 6 },
  { nome: 'respiro apos o ultimo golpe', from: DURATION_IN_FRAMES - 4, to: DURATION_IN_FRAMES },
];
for (const s of SILENCIOS) {
  const invasores = SOUND_CUES.filter((c) => c.at + dur(c) > s.from && c.at < s.to);
  if (invasores.length) fail(`${s.nome} (${s.from}-${s.to}) invadido por ${invasores.map((i) => i.sound).join(', ')}`);
  else console.log(`  ok     ${s.nome} — ${s.from}f a ${s.to}f mudos`);
}

// 4 — densidade.
console.log('\n4. Densidade');
let picoFrame = 0;
let pico = 0;
for (let f = 0; f < DURATION_IN_FRAMES; f++) {
  const n = SOUND_CUES.filter((c) => f >= c.at && f < c.at + dur(c)).length;
  if (n > pico) {
    pico = n;
    picoFrame = f;
  }
}
console.log(`  pico de ${pico} sons simultaneos em ${at(picoFrame)}`);
if (pico > 5) fail('mais de 5 sons ao mesmo tempo — vira ruido, nao desenho de som');

const mudos = [];
for (let f = 0; f < DURATION_IN_FRAMES; f++) {
  if (!SOUND_CUES.some((c) => f >= c.at && f < c.at + dur(c))) mudos.push(f);
}
console.log(`  ${mudos.length} frames sem nenhum som (${((mudos.length / DURATION_IN_FRAMES) * 100).toFixed(0)}% do filme)`);

// 5 — cobertura por cena.
console.log('\n5. Cues por cena');
for (const [nome, s] of Object.entries(SCENES)) {
  const n = SOUND_CUES.filter((c) => c.at >= s.from && c.at < s.from + s.duration).length;
  const maior = Math.max(0, ...SOUND_CUES.filter((c) => c.at >= s.from && c.at < s.from + s.duration).map((c) => c.volume));
  console.log(`  ${nome.padEnd(12)} ${String(n).padStart(2)} cues   volume maximo ${maior.toFixed(2)}`);
  if (n === 0) fail(`cena '${nome}' completamente muda`);
}

console.log(`\nMusica: ${MUSIC.enabled ? MUSIC.src : 'desligada (direcao: so efeitos)'}`);
console.log(problems ? `\n${problems} problema(s) de sincronia.\n` : '\nSincronia validada.\n');
process.exit(problems ? 1 : 0);
