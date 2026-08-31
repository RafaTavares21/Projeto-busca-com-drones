import { useMemo } from 'react';
import * as THREE from 'three';
import { useAsset } from '../assets';
import { COLORS } from '../styles/tokens';

type Props = {
  /** Altura do logo em unidades de mundo. A largura vem da proporcao do arquivo. */
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  opacity?: number;
  /** Profundidade da extrusao, em unidades de mundo. */
  depth?: number;
  /** Numero de camadas. Poucas demais e a extrusao vira degrau. */
  layers?: number;
  /** Cor das paredes da extrusao. */
  sideColor?: string;
  /** Exposicao da face frontal. */
  exposure?: number;
  /** Copias fantasma atras, para o borrao dos movimentos rapidos. */
  ghosts?: number;
  ghostOffset?: [number, number, number];
  ghostOpacity?: number;
};

/**
 * O LOGO DA MARCA, EXTRUDADO EM 3D.
 *
 * A tipografia da assinatura nao e mais escrita numa fonte: e o proprio
 * grafismo da EOG DRIP, o mesmo que esta estampado na peca. Uma marca com
 * letreiro proprio nao deve aparecer redesenhada numa fonte generica — o
 * letreiro E a marca.
 *
 * A extrusao e feita empilhando copias da arte ao longo de Z. Como o arquivo
 * tem canal alfa, cada copia recorta exatamente a silhueta do letreiro, e o
 * empilhamento produz uma parede solida com o formato das letras. As copias de
 * tras sao tingidas de vermelho escuro; so a da frente mostra a arte original.
 *
 * O `alphaTest` no lugar de mistura alfa e o detalhe que faz funcionar: com
 * mistura, trinta camadas transparentes brigariam na ordenacao de profundidade
 * e a extrusao apareceria com falhas. Com corte de alfa cada camada escreve
 * profundidade normalmente e a pilha se comporta como geometria solida.
 */
export const Logo3D: React.FC<Props> = ({
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  depth = 90,
  layers = 30,
  sideColor = COLORS.redDeep,
  exposure = 1,
  ghosts = 0,
  ghostOffset = [0, 0, -200],
  ghostOpacity = 0.1,
}) => {
  const logo = useAsset('printMark');

  const geometry = useMemo(() => {
    if (!logo) return null;
    return new THREE.PlaneGeometry(height * logo.aspect, height);
  }, [logo, height]);

  const faceMaterial = useMemo(() => {
    if (!logo) return null;
    return new THREE.MeshStandardMaterial({
      map: logo.texture,
      color: new THREE.Color(exposure, exposure, exposure),
      transparent: opacity < 1,
      opacity,
      alphaTest: opacity < 1 ? 0 : 0.5,
      roughness: 0.52,
      metalness: 0.04,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    });
  }, [logo, opacity, exposure]);

  const sideMaterial = useMemo(() => {
    if (!logo) return null;
    return new THREE.MeshBasicMaterial({
      map: logo.texture,
      // Multiplicar a arte pelo vermelho escuro deixa a parede densa e fosca.
      // Um emissivo aqui lavaria a cor — que e exatamente o brilho fraco que a
      // direcao de arte nao quer.
      color: new THREE.Color(sideColor),
      transparent: opacity < 1,
      opacity,
      alphaTest: opacity < 1 ? 0 : 0.5,
      side: THREE.DoubleSide,
      toneMapped: true,
    });
  }, [logo, sideColor, opacity]);

  const ghostMaterial = useMemo(() => {
    if (!logo || ghosts <= 0) return null;
    return new THREE.MeshBasicMaterial({
      map: logo.texture,
      transparent: true,
      opacity: ghostOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, [logo, ghosts, ghostOpacity]);

  if (!logo || !geometry || !faceMaterial || !sideMaterial) {
    return null;
  }

  const step = depth / Math.max(1, layers - 1);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {ghostMaterial
        ? Array.from({ length: ghosts }, (_, i) => {
            const k = (i + 1) / ghosts;
            return (
              <mesh
                key={`g${i}`}
                geometry={geometry}
                material={ghostMaterial}
                renderOrder={-1}
                position={[ghostOffset[0] * k, ghostOffset[1] * k, ghostOffset[2] * k]}
              />
            );
          })
        : null}

      {/* Paredes: da mais funda ate rente a face. */}
      {Array.from({ length: layers - 1 }, (_, i) => (
        <mesh key={`s${i}`} geometry={geometry} material={sideMaterial} position={[0, 0, -depth + i * step]} />
      ))}

      {/* Face frontal: a unica que mostra a arte como ela e. */}
      <mesh geometry={geometry} material={faceMaterial} position={[0, 0, 0]} />
    </group>
  );
};
