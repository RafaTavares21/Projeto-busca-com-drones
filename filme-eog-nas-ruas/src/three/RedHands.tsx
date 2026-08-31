import { useMemo } from 'react';
import * as THREE from 'three';
import { useAsset } from '../assets';
import { EASE } from '../animations/easings';
import { progress, rad } from '../animations/interpolate';
import { fillHeightAt, fillWidthAt } from './stageConfig';


type Props = {
  /** Frame LOCAL da cena. */
  frame: number;
  /** Janela em que a mao atravessa o quadro. */
  window: readonly [number, number];
  /** De onde ela entra. */
  from?: 'left' | 'right';
  /**
   * Altura da mao como multiplo da altura do QUADRO — nao em unidades de mundo.
   * Acima de 1.6 ela cobre o quadro inteiro no pico e a troca pode acontecer
   * atras dela.
   */
  coverage?: number;
  /** Inclinacao do gesto, em graus. */
  tilt?: number;
  /** Distancia da camera. Perto = primeiro plano, com desfoque de escala. */
  z?: number;
  /** Copias fantasma para o borrao do movimento. */
  ghosts?: number;
  opacity?: number;
  /**
   * `wipe` cruza o centro exatamente no meio da janela — obrigatorio quando a
   * cena troca alguma coisa atras da mao. `slash` sai rapido e desacelera,
   * que lê como gesto violento mas nao garante onde o pico acontece.
   */
  motion?: 'wipe' | 'slash';
};



/**
 * AS MAOS VERMELHAS — gesto, mascara e transicao.
 *
 * As maos sao parte da identidade da peca, entao aqui elas nao decoram: elas
 * cortam. A mao atravessa o quadro em primeiro plano e, no frame de maior
 * cobertura, a cena troca ATRAS dela. E o mesmo recurso de um corte de camera
 * escondido atras de um objeto que passa — a troca acontece sem que exista um
 * corte visivel, e a marca assina a propria transicao.
 *
 * Nao ha mascara por stencil nem shader: cobertura fisica e mais simples,
 * mais barata e — porque a mao tem a silhueta irregular de uma mao real —
 * mais bonita do que um wipe geometrico.
 */
export const RedHands: React.FC<Props> = ({
  frame,
  window: [start, end],
  from = 'right',
  coverage = 1.55,
  tilt = -14,
  z = 900,
  ghosts = 5,
  opacity = 1,
  motion = 'wipe',
}) => {
  const hands = useAsset('maos');

  const geometry = useMemo(() => {
    if (!hands) return null;
    const h = fillHeightAt(z, coverage);
    return new THREE.PlaneGeometry(h * hands.aspect, h);
  }, [hands, coverage, z]);

  const material = useMemo(() => {
    if (!hands) return null;
    return new THREE.MeshBasicMaterial({
      map: hands.texture,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    });
  }, [hands, opacity]);

  const ghostMaterial = useMemo(() => {
    if (!hands || ghosts <= 0) return null;
    return new THREE.MeshBasicMaterial({
      map: hands.texture,
      transparent: true,
      opacity: opacity * 0.16,
      depthWrite: false,
      toneMapped: false,
    });
  }, [hands, ghosts, opacity]);

  if (!hands || !geometry || !material || frame < start - 1 || frame > end + 1) {
    return null;
  }

  // A curva do `wipe` e simetrica de proposito: o pico de cobertura cai no
  // meio exato da janela, que e onde a cena troca o que esta atras.
  const t = progress(frame, start, end, motion === 'wipe' ? EASE.sineInOut : EASE.power2Out);

  // O percurso tambem vive na escala da profundidade da mao.
  const travel = fillWidthAt(z, 1.35);
  const sign = from === 'right' ? 1 : -1;
  const x = sign * travel * (1 - t * 2);

  // O borrao segue a direcao do movimento e some quando a mao desacelera.
  const speed = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);

  return (
    <group position={[x, fillHeightAt(z) * 0.03, z]} rotation={[0, 0, rad(tilt)]}>
      {ghostMaterial
        ? Array.from({ length: ghosts }, (_, i) => {
            const k = (i + 1) / ghosts;
            return (
              <mesh
                key={`ghost-${i}`}
                geometry={geometry}
                material={ghostMaterial}
                renderOrder={9}
                position={[sign * travel * 0.09 * k * speed, 0, -k]}
              />
            );
          })
        : null}

      <mesh geometry={geometry} material={material} renderOrder={10} />
    </group>
  );
};

/**
 * Cobertura da mao neste frame, em 0..1.
 *
 * A cena usa isto para decidir QUANDO trocar o que esta atras — a troca tem
 * que acontecer no pico, e o pico e propriedade do gesto, nao da cena.
 */
export const handCoverage = (
  frame: number,
  [start, end]: readonly [number, number],
  motion: 'wipe' | 'slash' = 'wipe',
): number => {
  const t = progress(frame, start, end, motion === 'wipe' ? EASE.sineInOut : EASE.power2Out);
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
};
