import { useMemo } from 'react';
import { AbsoluteFill, random } from 'remotion';
import { COLORS } from '../styles/tokens';
import { HEIGHT, WIDTH } from '../timing';

type Props = {
  /** 0..1 — quanto da pincelada ja foi tracada. */
  progress: number;
  /** 0..1 — opacidade geral, para a saida. */
  opacity?: number;
  color?: string;
  seed?: string;
};

/**
 * Pincelada vermelha.
 *
 * O traco e um caminho SVG com largura variavel: a forma e desenhada como um
 * poligono fechado (borda de cima e borda de baixo com espessuras diferentes),
 * e nao como uma linha grossa. E o que produz o inicio seco, o meio cheio e a
 * ponta que se desfaz — anatomia de pincel, nao de `stroke-width` constante.
 *
 * O reveal usa `clip-path`, que corta o traco no eixo do movimento em vez de
 * aparecer por opacidade, dando a sensacao de violencia do gesto.
 */
export const RedBrushStroke: React.FC<Props> = ({ progress, opacity = 1, color = COLORS.red, seed = 'brush' }) => {
  const { path, splatters } = useMemo(() => {
    // Eixo da pincelada: atravessa a tela na diagonal, de baixo-esquerda para
    // cima-direita, saindo dos dois lados do quadro.
    const x0 = -180;
    const y0 = HEIGHT * 0.62;
    const x1 = WIDTH + 180;
    const y1 = HEIGHT * 0.40;

    const steps = 60;
    const top: string[] = [];
    const bottom: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      // Arco leve: um pincel real nao anda em linha reta.
      const arc = Math.sin(t * Math.PI) * 54;
      const y = y0 + (y1 - y0) * t - arc;

      // Envelope de espessura: fino na entrada, cheio no meio, esgarcado na saida.
      const envelope = Math.sin(Math.pow(t, 0.72) * Math.PI);
      const jitter = (random(`${seed}:w:${i}`) - 0.5) * 26;
      const halfWidth = Math.max(4, envelope * 96 + jitter);

      // As duas bordas recebem ruidos independentes — bordas simetricas
      // denunciariam a geracao procedural.
      const edgeTop = (random(`${seed}:t:${i}`) - 0.5) * 22;
      const edgeBottom = (random(`${seed}:b:${i}`) - 0.5) * 22;

      top.push(`${x.toFixed(1)},${(y - halfWidth + edgeTop).toFixed(1)}`);
      bottom.push(`${x.toFixed(1)},${(y + halfWidth + edgeBottom).toFixed(1)}`);
    }

    // Respingos: a tinta que escapa do traco. Poucos e pequenos.
    const splat = Array.from({ length: 22 }, (_, i) => {
      const t = random(`${seed}:s:${i}:t`);
      const x = x0 + (x1 - x0) * t;
      const arc = Math.sin(t * Math.PI) * 54;
      const y = y0 + (y1 - y0) * t - arc + (random(`${seed}:s:${i}:y`) - 0.5) * 300;
      return {
        x,
        y,
        r: 2 + random(`${seed}:s:${i}:r`) * 11,
        o: 0.25 + random(`${seed}:s:${i}:o`) * 0.55,
        at: t,
      };
    });

    return {
      path: `M ${top.join(' L ')} L ${bottom.reverse().join(' L ')} Z`,
      splatters: splat,
    };
  }, [seed]);

  // O corte avanca um pouco alem do traco para que a ponta nunca fique reta.
  const cut = Math.min(100, progress * 108);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute' }}>
        <defs>
          {/* Textura de cerda: o pincel arrasta pigmento irregular, nao chapado. */}
          <filter id="bristle" x="-10%" y="-40%" width="120%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022 0.9" numOctaves={3} seed={11} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={26} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g style={{ clipPath: `polygon(0 0, ${cut}% 0, ${cut}% 100%, 0 100%)` }}>
          <path d={path} fill={color} filter="url(#bristle)" />
          {splatters.map((s, i) =>
            // Cada respingo so existe depois que o traco passou por ele.
            progress > s.at ? (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={color} opacity={s.o} />
            ) : null,
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
