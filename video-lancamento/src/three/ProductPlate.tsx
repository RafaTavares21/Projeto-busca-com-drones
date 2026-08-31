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
  /**
   * Multiplicador de exposicao. Em fotografia serve para abrir ou fechar a
   * imagem sem re-iluminar nada; em arte chapada, para tirar peso do branco.
   */
  exposure?: number;
  /**
   * Dominante de cor aplicada sobre a imagem.
   *
   * E assim que a luz da cena alcanca uma fotografia. Um `MeshBasicMaterial`
   * ignora luzes de proposito — a luz de uma foto ja esta gravada nela, e
   * somar um rig em cima produziria duas iluminacoes. Modular exposicao e
   * dominante imita a luz PASSANDO pela peca sem reacender a fotografia.
   */
  tint?: string;
  /** Copias fantasma para simular borrao nos movimentos rapidos. */
  ghosts?: number;
  ghostOffset?: [number, number, number];
  ghostOpacity?: number;
  renderOrder?: number;
};

/**
 * Uma imagem do produto colocada no espaco 3D.
 *
 * Existir como plano dentro da cena — e nao como camada DOM por cima — e o que
 * faz a imagem compartilhar a MESMA camera da tipografia: quando a camera
 * avanca, produto e texto ganham perspectiva juntos, e o filme lê como um
 * sistema unico em vez de camadas empilhadas.
 *
 * O material depende do que a imagem e. Fotografia usa `MeshBasicMaterial`:
 * a luz ja esta gravada na foto, e ilumina-la de novo somaria duas
 * iluminacoes e destruiria a fotografia. Arte chapada usa
 * `MeshStandardMaterial`, porque e justamente a luz da cena que lhe da volume.
 */
export const ProductPlate: React.FC<Props> = ({
  asset,
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  exposure = 1,
  tint,
  ghosts = 0,
  ghostOffset = [0, 0, 0],
  ghostOpacity = 0.14,
  renderOrder = 0,
}) => {
  const width = height * asset.aspect;

  const material = useMemo(() => {
    const shade = new THREE.Color(tint ?? '#FFFFFF').multiplyScalar(exposure);

    if (asset.kind === 'photo') {
      return new THREE.MeshBasicMaterial({
        map: asset.texture,
        color: shade,
        // Sempre transparente, mesmo com opacidade cheia: as placas trazem uma
        // queda de alfa nas bordas para se dissolverem no preto, e um material
        // opaco descarta o canal alfa da textura — a placa apareceria como um
        // retangulo fotografico recortado a faca.
        transparent: true,
        opacity,
        depthWrite: opacity > 0.99,
        toneMapped: true,
      });
    }

    return new THREE.MeshStandardMaterial({
      map: asset.texture,
      color: shade,
      transparent: true,
      opacity,
      roughness: 0.62,
      metalness: 0,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide,
    });
  }, [asset, opacity, exposure, tint]);

  const ghostMaterial = useMemo(() => {
    if (ghosts <= 0) return null;
    return new THREE.MeshBasicMaterial({
      map: asset.texture,
      transparent: true,
      opacity: ghostOpacity,
      depthWrite: false,
      toneMapped: true,
    });
  }, [asset, ghosts, ghostOpacity]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {ghostMaterial
        ? Array.from({ length: ghosts }, (_, i) => {
            const k = (i + 1) / ghosts;
            return (
              <mesh
                key={`ghost-${i}`}
                geometry={geometry}
                material={ghostMaterial}
                renderOrder={renderOrder - 1}
                position={[ghostOffset[0] * k, ghostOffset[1] * k, ghostOffset[2] * k]}
              />
            );
          })
        : null}

      <mesh geometry={geometry} material={material} renderOrder={renderOrder} />
    </group>
  );
};
