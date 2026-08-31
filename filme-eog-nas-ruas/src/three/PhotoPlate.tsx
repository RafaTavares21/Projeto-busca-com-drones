import { useMemo } from 'react';
import * as THREE from 'three';
import type { LoadedAsset } from '../assets';

type Props = {
  asset: LoadedAsset;
  /** Altura em unidades de mundo. A largura sai da proporcao real do arquivo. */
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  opacity?: number;
  /** Exposicao. A luz ja esta gravada na foto; isto so abre ou fecha a imagem. */
  exposure?: number;
  /** Dominante de cor, para a luz da cena alcancar a fotografia. */
  tint?: string;
  renderOrder?: number;
};

/**
 * Uma fotografia colocada no espaco 3D.
 *
 * Existir como plano dentro da cena — e nao como camada DOM por cima — e o que
 * faz a imagem compartilhar a MESMA camera do letreiro extrudado: quando a
 * camera avanca, arquitetura e marca ganham perspectiva juntas.
 *
 * O material e `MeshBasicMaterial` de proposito. A luz de uma fotografia ja
 * esta gravada nela; somar um rig por cima produziria duas iluminacoes e
 * destruiria a fotografia. A luz da cena alcanca a imagem por `exposure` e
 * `tint`, que imitam a luz passando sem reacender nada.
 */
export const PhotoPlate: React.FC<Props> = ({
  asset,
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  exposure = 1,
  tint,
  renderOrder = 0,
}) => {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(height * asset.aspect, height),
    [height, asset.aspect],
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: asset.texture,
        color: new THREE.Color(tint ?? '#FFFFFF').multiplyScalar(exposure),
        // Sempre transparente: os recortes trazem alfa, e um material opaco
        // descarta o canal alfa da textura.
        transparent: true,
        opacity,
        depthWrite: opacity > 0.99,
        toneMapped: true,
      }),
    [asset, opacity, exposure, tint],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={renderOrder}
    />
  );
};
