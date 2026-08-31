import type { ReactNode } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { ProceduralEnvironment } from './Environment';
import { CAMERA } from './stageConfig';

type Props = {
  children: ReactNode;
  /** Sombras custam caro; ligar apenas nas cenas em que a sombra e visivel. */
  shadows?: boolean;
  /** Exposicao do tonemapping. O ajuste fino de brilho da cena passa por aqui. */
  exposure?: number;
  environmentIntensity?: number;
  redBounce?: number;
};

/**
 * Palco 3D.
 *
 * O `ThreeCanvas` do @remotion/three trava o relogio do react-three-fiber no
 * numero do frame do Remotion: nada avança por `requestAnimationFrame`, entao o
 * WebGL fica tao deterministico quanto o DOM. O canvas tem fundo transparente
 * de proposito — grao, vinheta e HUD sao camadas DOM compostas por cima.
 */
export const Stage: React.FC<Props> = ({
  children,
  shadows = false,
  exposure = 1,
  environmentIntensity = 0.55,
  redBounce = 0.85,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows={shadows}
      camera={CAMERA}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = exposure;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ProceduralEnvironment intensity={environmentIntensity} redBounce={redBounce} />
      {children}
    </ThreeCanvas>
  );
};
