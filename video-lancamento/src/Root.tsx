import { Composition } from 'remotion';
import { DropOne } from './compositions/DropOne';
import { Scene01Impact } from './scenes/Scene01Impact';
import { Scene02ProductReveal } from './scenes/Scene02ProductReveal';
import { Scene03Details } from './scenes/Scene03Details';
import { Scene04Brand } from './scenes/Scene04Brand';
import { Scene05FinalDrop } from './scenes/Scene05FinalDrop';
import { AssetProvider } from './assets';
import { TypefaceProvider } from './three/typeface';
import { loadBrandFonts } from './styles/fonts';
import { DURATION_IN_FRAMES, FPS, HEIGHT, SCENES, WIDTH } from './timing';

loadBrandFonts();

const FORMAT = { fps: FPS, width: WIDTH, height: HEIGHT } as const;

/**
 * Cada cena tambem e registrada isoladamente. Trabalhar uma cena de 90 frames
 * no Studio, sem arrastar a timeline inteira junto, e a diferenca entre
 * iterar em segundos e iterar em minutos.
 */
const solo = (Scene: React.FC): React.FC => () => (
  <TypefaceProvider>
    <AssetProvider>
      <Scene />
    </AssetProvider>
  </TypefaceProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DropOne" component={DropOne} durationInFrames={DURATION_IN_FRAMES} {...FORMAT} />

    <Composition id="Scene01-Impact" component={solo(Scene01Impact)} durationInFrames={SCENES.impact.duration} {...FORMAT} />
    <Composition
      id="Scene02-ProductReveal"
      component={solo(Scene02ProductReveal)}
      durationInFrames={SCENES.productReveal.duration}
      {...FORMAT}
    />
    <Composition id="Scene03-Details" component={solo(Scene03Details)} durationInFrames={SCENES.details.duration} {...FORMAT} />
    <Composition id="Scene04-Brand" component={solo(Scene04Brand)} durationInFrames={SCENES.brand.duration} {...FORMAT} />
    <Composition
      id="Scene05-FinalDrop"
      component={solo(Scene05FinalDrop)}
      durationInFrames={SCENES.finalDrop.duration}
      {...FORMAT}
    />
  </>
);
