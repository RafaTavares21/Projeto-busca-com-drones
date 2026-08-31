import { Composition } from 'remotion';
import { EogNasRuas } from './compositions/EogNasRuas';
import { Scene01Patrimonio } from './scenes/Scene01Patrimonio';
import { Scene02Quebra } from './scenes/Scene02Quebra';
import { Scene03MarcaFixa } from './scenes/Scene03MarcaFixa';
import { Scene04NasRuas } from './scenes/Scene04NasRuas';
import { Scene05Drop } from './scenes/Scene05Drop';
import { AssetProvider } from './assets';
import { LogoProvider } from './three/logoGeometry';
import { loadBrandFonts } from './styles/fonts';
import { DURATION_IN_FRAMES, FPS, HEIGHT, SCENES, WIDTH } from './timing';

loadBrandFonts();

const FORMAT = { fps: FPS, width: WIDTH, height: HEIGHT } as const;

/**
 * Cada cena tambem e registrada isoladamente. Trabalhar uma cena de 100 frames
 * no Studio, sem arrastar a timeline inteira junto, e a diferenca entre iterar
 * em segundos e iterar em minutos.
 */
const solo = (Scene: React.FC): React.FC => () => (
  <LogoProvider>
    <AssetProvider>
      <Scene />
    </AssetProvider>
  </LogoProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EogNasRuas" component={EogNasRuas} durationInFrames={DURATION_IN_FRAMES} {...FORMAT} />

    <Composition id="Cena01-Patrimonio" component={solo(Scene01Patrimonio)} durationInFrames={SCENES.patrimonio.duration} {...FORMAT} />
    <Composition id="Cena02-Quebra" component={solo(Scene02Quebra)} durationInFrames={SCENES.quebra.duration} {...FORMAT} />
    <Composition id="Cena03-MarcaFixa" component={solo(Scene03MarcaFixa)} durationInFrames={SCENES.marcaFixa.duration} {...FORMAT} />
    <Composition id="Cena04-NasRuas" component={solo(Scene04NasRuas)} durationInFrames={SCENES.nasRuas.duration} {...FORMAT} />
    <Composition id="Cena05-Drop" component={solo(Scene05Drop)} durationInFrames={SCENES.drop.duration} {...FORMAT} />
  </>
);
