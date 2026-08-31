import type { CSSProperties } from 'react';
import { MaskedLine } from './MaskedLine';
import { COLORS, FONTS, TRACKING } from '../styles/tokens';

export type ContainerState = {
  /** 0..1 */
  opacity: number;
  scale: number;
  /** Deslocamento em px a partir da posicao final. */
  x: number;
  y: number;
  /** 0..1 — quanto o container ja virou vermelho. */
  red: number;
  /** Rotacao em Y, em graus. Da o volume de CSS 3D. */
  rotateY: number;
  /** 0..1 — reveal por mascara do conteudo. */
  reveal: number;
};

type Props = {
  lines: readonly string[];
  state: ContainerState;
  /** Indice ordinal exibido no canto. Declara os containers como um sistema. */
  index?: string;
  /** Etiqueta discreta no topo. */
  kicker?: string;
  style?: CSSProperties;
};

/**
 * Container de informacao de produto.
 *
 * Um unico componente serve aos dois blocos da cena 03: eles precisam parecer
 * o mesmo sistema visual, e a unica forma confiavel de garantir isso e nao
 * terem duas implementacoes. Todo o estado vem de fora, ja resolvido em
 * numeros — o container nao conhece frames nem easing.
 */
export const InformationContainer: React.FC<Props> = ({ lines, state, index, kicker, style }) => {
  const { opacity, scale, x, y, red, rotateY, reveal } = state;

  // Escuro/translucido -> vermelho solido. A transicao passa pela saturacao e
  // pela opacidade do fundo ao mesmo tempo, senao lê como troca de cor chapada.
  const background = `rgba(${Math.round(12 + red * 213)}, ${Math.round(12 - red * 6)}, ${Math.round(
    13 - red * 13,
  )}, ${(0.46 + red * 0.54).toFixed(3)})`;

  const borderColor = red > 0.5 ? `rgba(255,255,255,${(0.10 + red * 0.16).toFixed(3)})` : 'rgba(255,255,255,0.14)';

  return (
    <div
      style={{
        position: 'absolute',
        // A perspectiva vive no proprio container: cada bloco tem seu ponto de
        // fuga, o que evita que os dois girem como se estivessem colados.
        transform:
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
          `perspective(1600px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: 'center center',
        opacity,
        background,
        border: `1px solid ${borderColor}`,
        backdropFilter: red < 0.6 ? 'blur(18px) saturate(0.6)' : 'none',
        padding: '54px 62px 58px',
        minWidth: 620,
        boxShadow: red > 0.2 ? `0 30px 80px rgba(140,4,0,${(red * 0.16).toFixed(3)})` : '0 40px 90px rgba(0,0,0,0.6)',
        ...style,
      }}
    >
      {kicker || index ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 34,
            fontFamily: FONTS.grotesque,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: TRACKING.widest,
            color: red > 0.5 ? 'rgba(255,255,255,0.72)' : COLORS.ash,
          }}
        >
          <span>{kicker}</span>
          <span>{index}</span>
        </div>
      ) : null}

      {/* Reveal por mascara, escalonado linha a linha: o texto sobe de dentro
          do proprio container em vez de simplesmente aparecer. */}
      {lines.map((line, i) => (
        <MaskedLine
          key={line}
          reveal={maskFor(reveal, i, lines.length)}
          fontSize={108}
          style={{ marginBottom: i === lines.length - 1 ? 0 : 6 }}
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

/** Stagger do reveal: cada linha ocupa uma fatia da janela, com sobreposicao. */
const maskFor = (reveal: number, index: number, total: number): number => {
  const slice = 1 / (total + 0.8);
  const start = index * slice * 0.8;
  const t = (reveal - start) / slice;
  return Math.min(1, Math.max(0, t));
};
