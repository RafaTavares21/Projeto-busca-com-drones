import { useLayoutEffect } from 'react';
import type { PerspectiveCamera } from 'three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame } from 'remotion';
import { fbm } from '../animations/noise';
import { BASE_Z, FOV } from './stageConfig';

type Props = {
  /** Posicao alvo da camera. O eixo Z e o dolly. */
  position?: [number, number, number];
  /** Ponto para onde a camera olha. */
  lookAt?: [number, number, number];
  fov?: number;
  /**
   * Amplitude da deriva de mao livre, em unidades de mundo.
   * Zero = camera em tripe. Acima de ~12 comeca a parecer amador.
   */
  handheld?: number;
  /** Trepidacao de impacto, somada por cima da deriva. */
  shake?: number;
  /** Rotacao no eixo da lente (dutch angle), em radianos. */
  roll?: number;
  seed?: string;
};

/**
 * Camera 3D dirigida por frame.
 *
 * Todo movimento e derivado de `useCurrentFrame()` — inclusive a deriva de mao
 * livre, que vem de ruido fractal semeado e nao de `Math.random`. O mesmo frame
 * produz sempre a mesma camera, o que e o que permite renderizar em paralelo.
 */
export const CameraRig: React.FC<Props> = ({
  position = [0, 0, BASE_Z],
  lookAt = [0, 0, 0],
  fov = FOV,
  handheld = 0,
  shake = 0,
  roll = 0,
  seed = 'camera',
}) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);

  // useLayoutEffect e nao useFrame: o rig precisa estar aplicado ANTES do
  // primeiro draw do frame, senao o Remotion captura a camera do frame anterior.
  useLayoutEffect(() => {
    const t = frame / 30;

    // Deriva organica de baixa frequencia.
    const driftX = fbm(`${seed}:dx`, t * 0.9) * handheld;
    const driftY = fbm(`${seed}:dy`, t * 0.75) * handheld;
    const driftZ = fbm(`${seed}:dz`, t * 0.6) * handheld * 0.5;

    // Trepidacao de alta frequencia, usada apenas em impactos.
    const shakeX = fbm(`${seed}:sx`, t * 7.5, 2) * shake;
    const shakeY = fbm(`${seed}:sy`, t * 8.2, 2) * shake;

    camera.position.set(
      position[0] + driftX + shakeX,
      position[1] + driftY + shakeY,
      position[2] + driftZ,
    );
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    camera.rotation.z += roll + fbm(`${seed}:roll`, t * 0.5) * handheld * 0.0004;

    if ('fov' in camera) {
      const perspective = camera as PerspectiveCamera;
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });

  return null;
};
