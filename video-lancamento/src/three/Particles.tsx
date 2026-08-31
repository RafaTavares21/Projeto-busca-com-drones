import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { randInDisc, randRange } from '../animations/noise';
import { COLORS } from '../styles/tokens';

type Props = {
  count?: number;
  /** Raio da nuvem, em unidades de mundo. */
  radius?: number;
  /** Profundidade ocupada pela nuvem. E o que gera o parallax entre camadas. */
  depth?: number;
  /** Tamanho de cada fragmento. */
  size?: number;
  color?: string;
  /** Deriva por segundo, em unidades de mundo. */
  drift?: [number, number, number];
  opacity?: number;
  /** Frame em que a nuvem comeca a se mover. */
  startFrame?: number;
  seed?: string;
  /** Fragmentos alongados (estilhaco) em vez de pontos de poeira. */
  shard?: boolean;
};

/**
 * Nuvem de fragmentos em `InstancedMesh`.
 *
 * Uma unica geometria instanciada na GPU: mil fragmentos custam praticamente o
 * mesmo que um. Cada instancia tem posicao, escala e rotacao derivadas de uma
 * seed estavel, entao a nuvem e identica em qualquer render — nada de
 * `Math.random` por frame.
 */
export const Particles: React.FC<Props> = ({
  count = 160,
  radius = 900,
  depth = 1600,
  size = 5,
  color = COLORS.bone,
  drift = [0, 14, 0],
  opacity = 0.5,
  startFrame = 0,
  seed = 'dust',
  shard = false,
}) => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);

  // As propriedades imutaveis de cada fragmento sao calculadas uma unica vez.
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const [x, y] = randInDisc(`${seed}:${i}:pos`, radius);
        return {
          x,
          y,
          z: randRange(`${seed}:${i}:z`, -depth / 2, depth / 2),
          scale: randRange(`${seed}:${i}:s`, 0.45, 1.7),
          rotation: randRange(`${seed}:${i}:r`, 0, Math.PI * 2),
          // Cada fragmento anda num ritmo proprio: velocidade uniforme leria
          // como campo de estrelas, nao como poeira em suspensao.
          rate: randRange(`${seed}:${i}:rate`, 0.55, 1.5),
          wobble: randRange(`${seed}:${i}:w`, 0, Math.PI * 2),
        };
      }),
    [count, radius, depth, seed],
  );

  const geometry = useMemo(
    () => (shard ? new THREE.PlaneGeometry(size * 3.4, size * 0.5) : new THREE.PlaneGeometry(size, size)),
    [shard, size],
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [color, opacity],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const t = Math.max(0, frame - startFrame) / 30;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      if (!s) continue;

      // Deriva linear + oscilacao lateral lenta. Deterministico: so depende de t.
      const wobble = Math.sin(t * 0.9 + s.wobble) * 18;
      dummy.position.set(
        s.x + drift[0] * t * s.rate + wobble,
        s.y + drift[1] * t * s.rate,
        s.z + drift[2] * t * s.rate,
      );
      dummy.rotation.set(0, 0, s.rotation + t * 0.25 * s.rate);
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
};
