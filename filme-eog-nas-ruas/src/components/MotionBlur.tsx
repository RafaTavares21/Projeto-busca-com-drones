import type { ReactNode } from 'react';
import { Trail } from '@remotion/motion-blur';

type Props = {
  children: ReactNode;
  /** 0..1 — quanto do borrao esta ativo neste frame. */
  amount: number;
  /** Numero de copias no rastro. Cada uma custa um render da subarvore. */
  layers?: number;
  /** Distancia em frames entre as copias. */
  lagInFrames?: number;
};

/**
 * Motion blur seletivo, para elementos DOM/SVG.
 *
 * O `<Trail>` renderiza a subarvore varias vezes em frames anteriores, entao o
 * custo e real. Por isso ele so e montado quando `amount` passa de zero: o
 * borrao existe nos poucos frames de movimento violento e desaparece do resto
 * do comercial, que e exatamente como o motion blur se comporta numa camera.
 */
export const MotionBlur: React.FC<Props> = ({ children, amount, layers = 6, lagInFrames = 1 }) => {
  if (amount <= 0.01) {
    return <>{children}</>;
  }

  return (
    <Trail layers={Math.round(layers * amount)} lagInFrames={lagInFrames} trailOpacity={0.55 * amount}>
      {children}
    </Trail>
  );
};
