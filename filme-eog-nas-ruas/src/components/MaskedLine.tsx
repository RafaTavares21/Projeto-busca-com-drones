import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** 0..1 — quanto da linha ja subiu para dentro do quadro. */
  reveal: number;
  fontSize: number;
  /** Multiplicador da altura da mascara. Precisa acomodar descidas de letra. */
  lineHeight?: number;
  /** Distancia percorrida pela linha, em % da propria altura. */
  travel?: number;
  style?: CSSProperties;
  textStyle?: CSSProperties;
};

/**
 * Linha de texto revelada por mascara.
 *
 * A altura da mascara e calculada em PIXELS a partir do `fontSize`, nunca em
 * `em`. Um `height: 1em` num elemento que nao declara `font-size` resolve
 * contra os 16px herdados do documento, e uma linha de 236px aparece cortada
 * numa faixa de 16 — um erro silencioso, porque nada quebra: o texto
 * simplesmente some. Centralizar o calculo aqui elimina a classe inteira.
 */
export const MaskedLine: React.FC<Props> = ({
  children,
  reveal,
  fontSize,
  lineHeight = 1.02,
  travel = 112,
  style,
  textStyle,
}) => (
  <div style={{ overflow: 'hidden', height: Math.round(fontSize * lineHeight), ...style }}>
    <div
      style={{
        fontSize,
        lineHeight,
        transform: `translateY(${((1 - Math.min(1, Math.max(0, reveal))) * travel).toFixed(2)}%)`,
        ...textStyle,
      }}
    >
      {children}
    </div>
  </div>
);
