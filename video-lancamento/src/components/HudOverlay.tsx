import { AbsoluteFill } from 'remotion';
import { MaskedLine } from './MaskedLine';
import { COLORS, FONTS, GUTTER, TRACKING } from '../styles/tokens';

export type HudItem = {
  text: string;
  /** 0..1 — resolvido pela cena, com stagger. */
  reveal: number;
  align?: 'left' | 'right';
};

type Props = {
  top?: readonly HudItem[];
  bottom?: readonly HudItem[];
  /** Marcas de registro nos cantos. Referencia de contato de fotografia. */
  marks?: number;
  color?: string;
};

/**
 * Camada de metadados.
 *
 * Tipografia pequena, caixa alta, tracking largo — a linguagem de ficha tecnica
 * de editorial de moda. Existe para dar escala ao quadro e ancorar a composicao
 * nas margens; se comecar a competir com o produto, esta errada.
 */
export const HudOverlay: React.FC<Props> = ({ top = [], bottom = [], marks = 0, color = COLORS.ash }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {marks > 0 ? <RegistrationMarks opacity={marks} /> : null}

    <div
      style={{
        position: 'absolute',
        top: GUTTER,
        left: GUTTER,
        right: GUTTER,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {top.map((item, i) => (
        <HudLine key={`${item.text}-${i}`} item={item} color={color} />
      ))}
    </div>

    <div
      style={{
        position: 'absolute',
        bottom: GUTTER,
        left: GUTTER,
        right: GUTTER,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      {bottom.map((item, i) => (
        <HudLine key={`${item.text}-${i}`} item={item} color={color} />
      ))}
    </div>
  </AbsoluteFill>
);

const HudLine: React.FC<{ item: HudItem; color: string }> = ({ item, color }) => (
  <MaskedLine
    reveal={item.reveal}
    fontSize={24}
    lineHeight={1.45}
    travel={140}
    textStyle={{
      fontFamily: FONTS.grotesque,
      fontWeight: 500,
      letterSpacing: TRACKING.wider,
      textTransform: 'uppercase',
      color,
      textAlign: item.align ?? 'left',
      opacity: item.reveal,
    }}
  >
    {item.text}
  </MaskedLine>
);

/** Cruzes de registro nos quatro cantos, como numa prova de impressao. */
const RegistrationMarks: React.FC<{ opacity: number }> = ({ opacity }) => {
  const size = 26;
  const inset = GUTTER - 10;
  const corners = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ];

  return (
    <>
      {corners.map((pos, i) => (
        <div key={i} style={{ position: 'absolute', width: size, height: size, opacity: opacity * 0.5, ...pos }}>
          <div style={{ position: 'absolute', top: size / 2, left: 0, width: size, height: 1, background: COLORS.ashDim }} />
          <div style={{ position: 'absolute', left: size / 2, top: 0, height: size, width: 1, background: COLORS.ashDim }} />
        </div>
      ))}
    </>
  );
};
