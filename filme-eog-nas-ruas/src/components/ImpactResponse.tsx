import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { impactEnergy } from '../timing';

/**
 * MICRO-ANIMACAO — a reacao do filme aos proprios golpes.
 *
 * Vive ACIMA das cenas, e nao dentro delas, por um motivo tecnico: dentro de
 * uma `<Sequence>` o `useCurrentFrame()` devolve o frame LOCAL, e os
 * marcadores sao absolutos. Aqui em cima os dois relogios sao o mesmo.
 *
 * A regra de dosagem: nenhum destes efeitos deve ser percebido isoladamente. O
 * clarao maximo e 6% de opacidade e dura menos de meio segundo. O que se
 * percebe e a soma — a impressao de que a imagem inteira sentiu o impacto — e
 * e isso que separa um corte de um golpe. Passar disso vira efeito, e efeito
 * aparente e o oposto do que esta sendo procurado aqui.
 */
export const ImpactResponse: React.FC = () => {
  const frame = useCurrentFrame();

  // Golpes: decaimento curto e seco.
  const golpe = impactEnergy(frame, 5);
  // Cortes e transicoes: resposta mais fraca e mais longa, quase so no preto.
  const corte = impactEnergy(frame, 9, ['transition', 'beat']);

  if (golpe < 0.01 && corte < 0.01) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Ganho de luz no centro do quadro — a lente reagindo, nao um flash. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(255,255,255,${(golpe * 0.06).toFixed(4)}) 0%, rgba(255,255,255,0) 62%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* O vermelho da marca aparece nas bordas quando o golpe e forte. E o
          unico lugar do filme em que a cor entra sem vir da fotografia — e ela
          entra como consequencia de um impacto, nunca como decoracao. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 46%, rgba(200,18,8,${(golpe * 0.11).toFixed(4)}) 100%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* Respiro do contraste nos cortes: some antes de o olho nomear. */}
      <AbsoluteFill
        style={{
          backgroundColor: '#000000',
          opacity: corte * 0.045,
        }}
      />
    </AbsoluteFill>
  );
};
