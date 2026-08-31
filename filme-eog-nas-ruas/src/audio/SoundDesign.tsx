import { Audio, Sequence, staticFile } from 'remotion';
import { cueFrames, MUSIC, SOUND_CUES, SOUND_FADE, type SoundCue } from '../timing';

/**
 * DESENHO DE SOM
 *
 * Uma unica camada, montada acima das cenas, que le `SOUND_CUES` do
 * `timing.ts`. Nenhuma cena dispara som por conta propria: se o audio morasse
 * dentro das cenas, mudar o ritmo em um arquivo e o som em outro seria a
 * maneira mais facil de dessincronizar o filme. Aqui imagem e som leem a mesma
 * lista de frames.
 *
 * Os arquivos em `public/audio` sao sinteticos e determinsticos
 * (`npm run sfx`). Trocar qualquer um por uma gravacao real e sobrescrever o
 * .wav de mesmo nome — nenhuma linha de codigo muda.
 */

const Cue: React.FC<{ cue: SoundCue }> = ({ cue }) => {
  const frames = cueFrames(cue);
  const cortado = cue.duration !== undefined;

  return (
    <Sequence from={cue.at} durationInFrames={frames} name={`♪ ${cue.sound} — ${cue.reason}`} layout="none">
      <Audio
        src={staticFile(`audio/${cue.sound}.wav`)}
        // Um som cortado no meio da cauda estala. O esvaecimento nos ultimos
        // frames e o que torna o corte inaudivel — `f` e relativo a Sequence,
        // entao continua determinstico.
        volume={
          cortado
            ? (f: number) => cue.volume * Math.min(1, Math.max(0, (frames - f) / SOUND_FADE))
            : cue.volume
        }
      />
    </Sequence>
  );
};

/**
 * Trilha musical, quando existir.
 *
 * A direcao deste filme e sem musica. O componente existe para que ligar uma
 * trilha depois seja uma mudanca de flag, e nao uma reescrita — e enquanto a
 * flag estiver desligada nenhum arquivo e pedido, entao o render nao depende
 * de um `music.mp3` inexistente.
 */
export const MusicBed: React.FC = () => {
  if (!MUSIC.enabled) return null;
  return <Audio src={staticFile(MUSIC.src)} volume={MUSIC.volume} />;
};

export const SoundDesign: React.FC = () => (
  <>
    <MusicBed />
    {SOUND_CUES.map((cue, i) => (
      <Cue key={`${cue.sound}-${cue.at}-${i}`} cue={cue} />
    ))}
  </>
);
