import { Composition } from 'remotion';
import { EogNasRuas } from './compositions/EogNasRuas';
import { Scene01Impacto } from './scenes/Scene01Impacto';
import { Scene02Rua } from './scenes/Scene02Rua';
import { Scene03Ficha } from './scenes/Scene03Ficha';
import { Scene04Marca } from './scenes/Scene04Marca';
import { Scene05Drop } from './scenes/Scene05Drop';
import { AssetProvider } from './assets';
import { LogoProvider } from './three/logoGeometry';
import { TypefaceProvider } from './three/typeface';
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
    <TypefaceProvider>
      <AssetProvider>
        <Scene />
      </AssetProvider>
    </TypefaceProvider>
  </LogoProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EogNasRuas" component={EogNasRuas} durationInFrames={DURATION_IN_FRAMES} {...FORMAT} />

    <Composition id="Cena01-Impacto" component={solo(Scene01Impacto)} durationInFrames={SCENES.impacto.duration} {...FORMAT} />
    <Composition id="Cena02-Rua" component={solo(Scene02Rua)} durationInFrames={SCENES.rua.duration} {...FORMAT} />
    <Composition id="Cena03-Ficha" component={solo(Scene03Ficha)} durationInFrames={SCENES.ficha.duration} {...FORMAT} />
    <Composition id="Cena04-Marca" component={solo(Scene04Marca)} durationInFrames={SCENES.marca.duration} {...FORMAT} />
    <Composition id="Cena05-Drop" component={solo(Scene05Drop)} durationInFrames={SCENES.drop.duration} {...FORMAT} />
  </>
);
