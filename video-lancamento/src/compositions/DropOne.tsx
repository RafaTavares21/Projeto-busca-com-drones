import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionLayer } from '../components/Transition';
import { Scene01Impact } from '../scenes/Scene01Impact';
import { Scene02ProductReveal } from '../scenes/Scene02ProductReveal';
import { Scene03Details } from '../scenes/Scene03Details';
import { Scene04Brand } from '../scenes/Scene04Brand';
import { Scene05FinalDrop } from '../scenes/Scene05FinalDrop';
import { loadBrandFonts } from '../styles/fonts';
import { AssetProvider } from '../assets';
import { TypefaceProvider } from '../three/typeface';
import { COLORS } from '../styles/tokens';
import { SCENES } from '../timing';

// As fontes comecam a carregar quando o modulo e avaliado, antes de qualquer
// componente montar. O `delayRender` interno segura o primeiro frame.
loadBrandFonts();

/**
 * EOG DRIP — DROP 01
 * Filme vertical 1080x1920, 30 fps, 15 segundos.
 *
 * IMPACTO -> IDENTIDADE -> PRODUTO -> DETALHES -> MARCA -> DROP
 *
 * As cinco cenas nao se sobrepoem: cada uma monta e desmonta seu proprio
 * contexto WebGL, e a `TransitionLayer` cobre o quadro exatamente onde a troca
 * acontece. Os provedores ficam acima de tudo porque o Remotion desenha cada
 * frame uma unica vez — um asset que chega depois do draw nunca aparece.
 */
export const DropOne: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
    <TypefaceProvider>
      <AssetProvider>
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

        <Sequence from={SCENES.details.from} durationInFrames={SCENES.details.duration} name="03 — Details">
          <Scene03Details />
        </Sequence>

        <Sequence from={SCENES.brand.from} durationInFrames={SCENES.brand.duration} name="04 — EOG DRIP">
          <Scene04Brand />
        </Sequence>

        <Sequence from={SCENES.finalDrop.from} durationInFrames={SCENES.finalDrop.duration} name="05 — Final Drop">
          <Scene05FinalDrop />
        </Sequence>

        <TransitionLayer />
      </AssetProvider>
    </TypefaceProvider>
  </AbsoluteFill>
);
