import { AbsoluteFill } from 'remotion';
import { MaskedLine } from './MaskedLine';
import { COLORS, FONTS, GUTTER, TRACKING } from '../styles/tokens';

export type OverlayLine = {
  text: string;
  /** 0..1 — resolvido pela cena. */
  reveal: number;
};

type Props = {
  topLeft?: OverlayLine;
  topRight?: OverlayLine;
  bottomLeft?: OverlayLine;
  bottomRight?: OverlayLine;
  color?: string;
};

/**
 * Metadados de canto.
 *
 * A funcao e dar escala ao quadro e ancorar a composicao nas margens — o
 * mesmo papel dos creditos numa pagina de editorial. Por isso e tipografia
 * pequena e discreta, e nunca mais de duas informacoes por vez: o momento em
 * que isso comeca a competir com o produto e o momento em que passou a ser
 * decoracao.
 */
export const TextOverlay: React.FC<Props> = ({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  color = COLORS.ash,
}) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {topLeft || topRight ? (
      <Row top>
        <Slot line={topLeft} color={color} align="left" />
        <Slot line={topRight} color={color} align="right" />
      </Row>
    ) : null}

    {bottomLeft || bottomRight ? (
      <Row>
        <Slot line={bottomLeft} color={color} align="left" />
        <Slot line={bottomRight} color={color} align="right" />
      </Row>
    ) : null}
  </AbsoluteFill>
);

const Row: React.FC<{ children: React.ReactNode; top?: boolean }> = ({ children, top }) => (
  <div
    style={{
      position: 'absolute',
      left: GUTTER,
      right: GUTTER,
      ...(top ? { top: GUTTER } : { bottom: GUTTER }),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 24,
    }}
  >
    {children}
  </div>
);

const Slot: React.FC<{ line?: OverlayLine; color: string; align: 'left' | 'right' }> = ({
  line,
  color,
  align,
}) =>
  line ? (
    <MaskedLine
      reveal={line.reveal}
      fontSize={22}
      lineHeight={1.5}
      travel={150}
      textStyle={{
        fontFamily: FONTS.grotesque,
        fontWeight: 500,
        letterSpacing: TRACKING.wider,
        textTransform: 'uppercase',
        color,
        textAlign: align,
        opacity: line.reveal,
      }}
    >
      {line.text}
    </MaskedLine>
  ) : (
    <span />
  );
