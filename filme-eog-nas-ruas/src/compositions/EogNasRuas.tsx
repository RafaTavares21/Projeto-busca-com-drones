import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionLayer } from '../components/Transition';
import { Scene01Patrimonio } from '../scenes/Scene01Patrimonio';
import { Scene02Quebra } from '../scenes/Scene02Quebra';
import { Scene03MarcaFixa } from '../scenes/Scene03MarcaFixa';
import { Scene04NasRuas } from '../scenes/Scene04NasRuas';
import { Scene05Drop } from '../scenes/Scene05Drop';
import { AssetProvider } from '../assets';
import { LogoProvider } from '../three/logoGeometry';
import { loadBrandFonts } from '../styles/fonts';
import { COLORS } from '../styles/tokens';
import { SCENES } from '../timing';

// As fontes comecam a carregar quando o modulo e avaliado, antes de qualquer
// componente montar. O `delayRender` interno segura o primeiro frame.
loadBrandFonts();

/**
 * EOG DRIP — EOG NAS RUAS
 * Filme de campanha, 1080x1920, 30 fps, 20 segundos.
 *
 * PATRIMONIO -> QUEBRA -> MARCA FIXA -> NAS RUAS -> DROP
 *
 * A tese: o centro monumental de Sao Paulo tratado como museu, e a marca
 * entrando nele. O filme abre com a linguagem da arquitetura — camera de tripe,
 * tipografia de etiqueta, o letreiro em bronze entre os ornamentos — e quebra
 * para a linguagem da rua no frame em que o metal vira tinta.
 *
 * Os dois provedores ficam acima de tudo porque o Remotion desenha cada frame
 * uma unica vez: geometria ou textura que chegue depois do draw nunca aparece.
 * A extrusao do letreiro custa mais de um milhao de vertices e e construida
 * uma vez so, para o filme inteiro.
 */
export const EogNasRuas: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
    <LogoProvider>
      <AssetProvider>
        <Sequence from={SCENES.patrimonio.from} durationInFrames={SCENES.patrimonio.duration} name="01 — Patrimônio">
          <Scene01Patrimonio />
        </Sequence>

        <Sequence from={SCENES.quebra.from} durationInFrames={SCENES.quebra.duration} name="02 — A Quebra">
          <Scene02Quebra />
        </Sequence>

        <Sequence from={SCENES.marcaFixa.from} durationInFrames={SCENES.marcaFixa.duration} name="03 — Marca Fixa">
          <Scene03MarcaFixa />
        </Sequence>

        <Sequence from={SCENES.nasRuas.from} durationInFrames={SCENES.nasRuas.duration} name="04 — Nas Ruas">
          <Scene04NasRuas />
        </Sequence>

        <Sequence from={SCENES.drop.from} durationInFrames={SCENES.drop.duration} name="05 — Drop">
          <Scene05Drop />
        </Sequence>

        <TransitionLayer />
      </AssetProvider>
    </LogoProvider>
  </AbsoluteFill>
);
