import { AbsoluteFill, Sequence } from 'remotion';
import { SoundDesign } from '../audio/SoundDesign';
import { ImpactResponse } from '../components/ImpactResponse';
import { TransitionLayer } from '../components/Transition';
import { Scene01Impacto } from '../scenes/Scene01Impacto';
import { Scene02Rua } from '../scenes/Scene02Rua';
import { Scene03Ficha } from '../scenes/Scene03Ficha';
import { Scene04Marca } from '../scenes/Scene04Marca';
import { Scene05Drop } from '../scenes/Scene05Drop';
import { AssetProvider } from '../assets';
import { LogoProvider } from '../three/logoGeometry';
import { TypefaceProvider } from '../three/typeface';
import { loadBrandFonts } from '../styles/fonts';
import { COLORS } from '../styles/tokens';
import { SCENES } from '../timing';

// As fontes comecam a carregar quando o modulo e avaliado, antes de qualquer
// componente montar. O `delayRender` interno segura o primeiro frame.
loadBrandFonts();

/**
 * EOG DRIP — EOG NAS RUAS
 * Filme de campanha, 1080x1920, 30 fps, 15 segundos.
 *
 * IMPACTO -> A RUA -> ESPECIFICACAO -> A MARCA -> DROP
 *
 * A mesma gramatica do DROP 01, com o conteudo da campanha de rua: silencio,
 * gesto vermelho rasgando o quadro, a marca cruzando a lente, a fotografia de
 * Sao Paulo com a troca escondida atras da mao, a ficha da peca em linguagem
 * de editorial, a colisao da marca, e a assinatura limpa.
 *
 * Os tres provedores ficam acima de tudo porque o Remotion desenha cada frame
 * uma unica vez: geometria, fonte ou textura que chegue depois do draw nunca
 * aparece.
 * A extrusao do letreiro custa mais de um milhao de vertices e e construida
 * uma vez so, para o filme inteiro.
 */
export const EogNasRuas: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
    <LogoProvider>
      <TypefaceProvider>
        <AssetProvider>
          <Sequence from={SCENES.impacto.from} durationInFrames={SCENES.impacto.duration} name="01 — Impacto">
            <Scene01Impacto />
          </Sequence>

          <Sequence from={SCENES.rua.from} durationInFrames={SCENES.rua.duration} name="02 — A Rua">
            <Scene02Rua />
          </Sequence>

          <Sequence from={SCENES.ficha.from} durationInFrames={SCENES.ficha.duration} name="03 — Especificação">
            <Scene03Ficha />
          </Sequence>

          <Sequence from={SCENES.marca.from} durationInFrames={SCENES.marca.duration} name="04 — A Marca">
            <Scene04Marca />
          </Sequence>

          <Sequence from={SCENES.drop.from} durationInFrames={SCENES.drop.duration} name="05 — Drop">
            <Scene05Drop />
          </Sequence>

          {/* Reacao da imagem aos marcadores de impacto, acima das cenas para
              ler o frame absoluto do filme. */}
          <ImpactResponse />

          <TransitionLayer />

          {/* O som le a mesma lista de frames que a imagem. */}
          <SoundDesign />
        </AssetProvider>
      </TypefaceProvider>
    </LogoProvider>
  </AbsoluteFill>
);
