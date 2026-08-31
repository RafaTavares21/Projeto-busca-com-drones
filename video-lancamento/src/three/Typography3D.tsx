import { useMemo } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { COLORS } from '../styles/tokens';
import { useTypeface } from './typeface';

export type Typography3DProps = {
  text: string;
  /** Altura da caixa alta, em unidades de mundo (≈ pixels no plano z=0). */
  size?: number;
  /** Profundidade da extrusao. E ela que da a sensacao de massa. */
  depth?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Cor das faces frontal e traseira. */
  faceColor?: string;
  /** Cor das paredes da extrusao. Escura por padrao — o vermelho vem da rim light. */
  sideColor?: string;
  /** Emissivo das paredes. Usar so quando a tipografia precisar "acender". */
  sideEmissive?: string;
  sideEmissiveIntensity?: number;
  opacity?: number;
  /** Espacamento entre letras, como fracao do `size`. */
  tracking?: number;
  /**
   * Copias fantasma deslocadas, para simular motion blur nos movimentos rapidos.
   * Muito mais barato que renderizar subframes, e controlavel por beat.
   */
  ghosts?: number;
  ghostOffset?: [number, number, number];
  ghostOpacity?: number;
  castShadow?: boolean;
  /** Onde fica a origem no eixo de profundidade. */
  anchorZ?: 'center' | 'front' | 'back';
};

const BEVEL_RATIO = 0.014;

/**
 * Tipografia 3D real: geometria extrudada a partir dos contornos da fonte,
 * nao um plano com textura. E o que permite que a luz corra pelas paredes da
 * extrusao e que a rim light vermelha desenhe a aresta — o efeito central da
 * direcao de arte.
 */
export const Typography3D: React.FC<Typography3DProps> = ({
  text,
  size = 300,
  depth = 90,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceColor = COLORS.white,
  sideColor = '#141414',
  sideEmissive,
  sideEmissiveIntensity = 1,
  opacity = 1,
  tracking = 0,
  ghosts = 0,
  ghostOffset = [0, 0, -60],
  ghostOpacity = 0.16,
  castShadow = false,
  anchorZ = 'center',
}) => {
  const font = useTypeface();

  const geometry = useMemo(() => {
    const bevel = size * BEVEL_RATIO;
    const geo = new TextGeometry(text, {
      font,
      size,
      depth,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelOffset: 0,
      bevelSegments: 4,
    });

    // O TextGeometry nasce com a origem no canto inferior esquerdo da linha de
    // base. Centralizamos em X/Y para que posicao, escala e rotacao girem em
    // torno do centro optico do bloco, que e como a direcao de arte pensa.
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    if (box) {
      const dz = anchorZ === 'center' ? -(box.max.z + box.min.z) / 2 : anchorZ === 'front' ? -box.max.z : -box.min.z;
      geo.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, dz);
    }
    geo.computeVertexNormals();
    return geo;
  }, [font, text, size, depth, anchorZ]);

  // O TextGeometry nao expoe tracking, entao ele e aplicado como uma escala em
  // X sobre o bloco inteiro. Suficiente para o ajuste optico que precisamos.
  const trackingScale = 1 + tracking;

  const materials = useMemo(() => {
    const transparent = opacity < 1;

    const face = new THREE.MeshStandardMaterial({
      color: faceColor,
      roughness: 0.34,
      metalness: 0.04,
      envMapIntensity: 1.15,
      transparent,
      opacity,
    });

    const side = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.42,
      metalness: 0.62,
      // Reflete mais o ambiente que a face: e assim que o rebatedor vermelho
      // do ambiente procedural aparece nas paredes da extrusao.
      envMapIntensity: 2.1,
      emissive: sideEmissive ? new THREE.Color(sideEmissive) : new THREE.Color('#000000'),
      emissiveIntensity: sideEmissive ? sideEmissiveIntensity : 0,
      transparent,
      opacity,
    });

    // ExtrudeGeometry expoe dois grupos: 0 = faces, 1 = paredes da extrusao.
    return [face, side];
  }, [faceColor, sideColor, sideEmissive, sideEmissiveIntensity, opacity]);

  const ghostMaterials = useMemo(() => {
    if (ghosts <= 0) return null;
    const make = (color: string) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: ghostOpacity,
        // Fantasmas nunca escrevem profundidade: eles sao um borrao, nao um solido.
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    return [make(faceColor), make(sideColor)];
  }, [ghosts, ghostOpacity, faceColor, sideColor]);

  return (
    <group position={position} rotation={rotation} scale={[scale * trackingScale, scale, scale]}>
      {ghostMaterials
        ? Array.from({ length: ghosts }, (_, i) => {
            const k = (i + 1) / ghosts;
            return (
              <mesh
                key={`ghost-${i}`}
                geometry={geometry}
                material={ghostMaterials}
                renderOrder={-1}
                position={[ghostOffset[0] * k, ghostOffset[1] * k, ghostOffset[2] * k]}
                scale={1 - k * 0.012}
              />
            );
          })
        : null}

      <mesh geometry={geometry} material={materials} castShadow={castShadow} receiveShadow={false} />
    </group>
  );
};
