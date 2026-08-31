import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionLayer } from '../components/Transition';
import { Scene01Impact } from '../scenes/Scene01Impact';
import { Scene02ProductReveal } from '../scenes/Scene02ProductReveal';
import { Scene03Information } from '../scenes/Scene03Information';
import { Scene04NeverBroke } from '../scenes/Scene04NeverBroke';
import { Scene05FinalDrop } from '../scenes/Scene05FinalDrop';
import { loadBrandFonts } from '../styles/fonts';
import { ProductAssetProvider } from '../three/productAsset';
import { TypefaceProvider } from '../three/typeface';
import { COLORS } from '../styles/tokens';
import { SCENES } from '../timing';

// As fontes comecam a carregar no momento em que o modulo e avaliado, antes de
// qualquer componente montar. O `delayRender` interno segura o primeiro frame.
loadBrandFonts();

/**
 * NEVER BROKE AGAIN — DROP 01
 * Comercial vertical 1080x1920, 30 fps, 15 segundos.
 *
 * As cinco cenas nao se sobrepoem: cada uma monta e desmonta seu proprio
 * contexto WebGL, e a `TransitionLayer` cobre o quadro exatamente onde a troca
 * acontece. Os dois provedores ficam acima de tudo porque o Remotion desenha
 * cada frame uma unica vez — um asset que chega depois do draw nunca aparece.
 */
export const DropOne: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
    <TypefaceProvider>
      <ProductAssetProvider>
        <Sequence from={SCENES.impact.from} durationInFrames={SCENES.impact.duration} name="01 — Impact">
          <Scene01Impact />
        </Sequence>

        <Sequence
          from={SCENES.productReveal.from}
          durationInFrames={SCENES.productReveal.duration}
          name="02 — Product Reveal"
        >
          <Scene02ProductReveal />
        </Sequence>

        <Sequence
          from={SCENES.information.from}
          durationInFrames={SCENES.information.duration}
          name="03 — Product Information"
        >
          <Scene03Information />
        </Sequence>

        <Sequence
          from={SCENES.neverBroke.from}
          durationInFrames={SCENES.neverBroke.duration}
          name="04 — Never Broke"
        >
          <Scene04NeverBroke />
        </Sequence>

        <Sequence from={SCENES.finalDrop.from} durationInFrames={SCENES.finalDrop.duration} name="05 — Final Drop">
          <Scene05FinalDrop />
        </Sequence>

        <TransitionLayer />
      </ProductAssetProvider>
    </TypefaceProvider>
  </AbsoluteFill>
);
