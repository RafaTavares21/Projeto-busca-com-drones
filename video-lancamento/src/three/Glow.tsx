import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../styles/tokens';

type Props = {
  position?: [number, number, number];
  /** Diametro do halo, em unidades de mundo. */
  size?: number;
  color?: string;
  intensity?: number;
  /** Achata o halo no eixo X — util para simular halacao numa linha de luz. */
  stretch?: number;
};

/**
 * Halo aditivo.
 *
 * Substitui o bloom da cadeia de pos-processamento: em vez de detectar altas
 * luzes na tela inteira, o brilho e colocado a mao onde a direcao de arte quer.
 * Custa um quad e da controle exato sobre onde a imagem "acende".
 */
export const Glow: React.FC<Props> = ({
  position = [0, 0, 0],
  size = 900,
  color = COLORS.redHot,
  intensity = 0.55,
  stretch = 1,
}) => {
  // O degrade e desenhado uma vez em canvas e vira textura: mais barato e mais
  // suave do que um shader radial avaliado por pixel.
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.14)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  if (!texture || intensity <= 0) return null;

  return (
    <mesh position={position} scale={[stretch, 1, 1]} renderOrder={-2}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={intensity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
};
