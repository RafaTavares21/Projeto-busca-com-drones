import type { CSSProperties } from 'react';
import { MaskedLine } from './MaskedLine';
import { COLORS, FONTS, TRACKING } from '../styles/tokens';

export type InfoState = {
  /** 0..1 — reveal das linhas, ja escalonado pela cena. */
  reveal: number;
  opacity: number;
  /** Deslocamento em px a partir da posicao final. */
  x: number;
  y: number;
  scale: number;
};

type Props = {
  /** Etiqueta pequena acima do bloco. Nomeia o que a informacao e. */
  eyebrow: string;
  /** Uma linha por palavra. Quebrar a mao, nao deixar o navegador quebrar. */
  lines: readonly string[];
  state: InfoState;
  align?: 'left' | 'right';
  /** Tamanho da tipografia principal do bloco. */
  size?: number;
  style?: CSSProperties;
};

/**
 * Bloco de informacao de produto, em linguagem editorial.
 *
 * Deliberadamente sem caixa, borda, fundo ou sombra: uma ficha tecnica dentro
 * de um retangulo lê como interface de sistema, e interface e o oposto de
 * campanha de moda. O que organiza a informacao aqui e o mesmo que organiza
 * uma pagina de editorial — hierarquia de escala, tracking, alinhamento e
 * espaco negativo — e o unico ornamento e uma regra de um pixel.
 */
export const InformationContainer: React.FC<Props> = ({
  eyebrow,
  lines,
  state,
  align = 'left',
  size = 116,
  style,
}) => {
  const { reveal, opacity, x, y, scale } = state;

  return (
    <div
      style={{
        transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
        transformOrigin: align === 'right' ? 'right center' : 'left center',
        opacity,
        textAlign: align,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        ...style,
      }}
    >
      <MaskedLine
        reveal={reveal}
        fontSize={22}
        lineHeight={1.5}
        travel={150}
        style={{ marginBottom: 18 }}
        textStyle={{
          fontFamily: FONTS.grotesque,
          fontWeight: 600,
          letterSpacing: TRACKING.widest,
          textTransform: 'uppercase',
          color: COLORS.red,
        }}
      >
        {eyebrow}
      </MaskedLine>

      {/* Regra fina que ancora o bloco. Cresce a partir da margem do texto. */}
      <div
        style={{
          width: 118,
          height: 1,
          marginBottom: 22,
          background: COLORS.ashDim,
          transform: `scaleX(${Math.min(1, reveal * 1.4).toFixed(4)})`,
          transformOrigin: align === 'right' ? 'right' : 'left',
        }}
      />

      {lines.map((line, i) => (
        <MaskedLine
          key={line}
          // Stagger linha a linha: o bloco se constroi, nao aparece pronto.
          reveal={reveal * 1.5 - i * 0.34}
          fontSize={size}
          lineHeight={0.99}
          textStyle={{
            fontFamily: FONTS.display,
            letterSpacing: TRACKING.tight,
            color: COLORS.white,
          }}
        >
          {line}
        </MaskedLine>
      ))}
    </div>
  );
};
