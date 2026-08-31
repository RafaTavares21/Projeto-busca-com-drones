import { Composition } from 'remotion';
import { DropOne } from './compositions/DropOne';
import { Scene01Impact } from './scenes/Scene01Impact';
import { Scene02ProductReveal } from './scenes/Scene02ProductReveal';
import { Scene03Information } from './scenes/Scene03Information';
import { Scene04NeverBroke } from './scenes/Scene04NeverBroke';
import { Scene05FinalDrop } from './scenes/Scene05FinalDrop';
import { ProductAssetProvider } from './three/productAsset';
import { TypefaceProvider } from './three/typeface';
import { loadBrandFonts } from './styles/fonts';
import { DURATION_IN_FRAMES, FPS, HEIGHT, SCENES, WIDTH } from './timing';

loadBrandFonts();

const FORMAT = { fps: FPS, width: WIDTH, height: HEIGHT } as const;

/**
 * Cada cena tambem e registrada isoladamente. Trabalhar uma cena de 90 frames
 * no Studio, sem arrastar o resto da timeline junto, e a diferenca entre
 * iterar em segundos e iterar em minutos.
 */
const solo = (Scene: React.FC): React.FC => () => (
  <TypefaceProvider>
    <ProductAssetProvider>
      <Scene />
    </ProductAssetProvider>
  </TypefaceProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DropOne" component={DropOne} durationInFrames={DURATION_IN_FRAMES} {...FORMAT} />

    <Composition
      id="Scene01-Impact"
      component={solo(Scene01Impact)}
      durationInFrames={SCENES.impact.duration}
      {...FORMAT}
    />
    <Composition
      id="Scene02-ProductReveal"
      component={solo(Scene02ProductReveal)}
      durationInFrames={SCENES.productReveal.duration}
      {...FORMAT}
    />
    <Composition
      id="Scene03-Information"
      component={solo(Scene03Information)}
      durationInFrames={SCENES.information.duration}
      {...FORMAT}
    />
    <Composition
      id="Scene04-NeverBroke"
      component={solo(Scene04NeverBroke)}
      durationInFrames={SCENES.neverBroke.duration}
      {...FORMAT}
    />
    <Composition
      id="Scene05-FinalDrop"
      component={solo(Scene05FinalDrop)}
      durationInFrames={SCENES.finalDrop.duration}
      {...FORMAT}
    />
  </>
);
