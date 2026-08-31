import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../styles/tokens';
import { useLogoGeometry } from './logoGeometry';

/**
 * Como o letreiro se apresenta neste frame.
 *
 * `bronze` e o material dos ornamentos do Theatro: metal escuro, polido pelo
 * tempo. `marca` e a cor real da EOG. A cena interpola entre os dois, e essa
 * transformacao E o argumento do filme — o letreiro nasce como patrimonio e
 * vira rua.
 */
export type LogoFinish = 'bronze' | 'marca';

type Props = {
  /** Altura do letreiro em unidades de mundo. */
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** 0 = bronze, 1 = cores da marca. Valores intermediarios sao a virada. */
  finish?: number;
  opacity?: number;
  /** Brilho geral, para acompanhar a luz da cena. */
  exposure?: number;
  castShadow?: boolean;
};

/** Nomes de camada que o vetorizador grava no SVG. */
const LETTERING = 'letreiro';

export const LogoExtruded: React.FC<Props> = ({
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  finish = 1,
  opacity = 1,
  exposure = 1,
  castShadow = false,
}) => {
  const logo = useLogoGeometry();

  // A geometria nasce na escala do SVG (milhares de unidades). Um unico fator
  // reescala o conjunto inteiro, preservando a composicao entre as camadas.
  const scale = height / logo.size.height;

  const materials = useMemo(
    () =>
      logo.layers.map((layer) => {
        const isLettering = layer.id === LETTERING;

        // A cor de destino de cada camada vem do proprio SVG — o vetorizador ja
        // separou letreiro e maos pela cor original da arte.
        const brand = isLettering ? new THREE.Color(COLORS.white) : layer.color.clone();
        const bronze = new THREE.Color(isLettering ? COLORS.bronze : COLORS.bronzeDark);

        const color = bronze.clone().lerp(brand, finish).multiplyScalar(exposure);

        return new THREE.MeshStandardMaterial({
          color,
          // O bronze e metal polido; a marca e tinta fosca. Interpolar as duas
          // propriedades junto com a cor e o que faz a virada parecer uma
          // mudanca de MATERIAL, e nao um simples ajuste de matiz.
          metalness: 0.85 * (1 - finish) + 0.05 * finish,
          roughness: 0.32 * (1 - finish) + 0.62 * finish,
          envMapIntensity: 2.2 * (1 - finish) + 0.6 * finish,
          transparent: opacity < 1,
          opacity,
        });
      }),
    [logo, finish, opacity, exposure],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {logo.layers.map((layer, i) => (
        <mesh
          key={layer.id}
          geometry={layer.geometry}
          material={materials[i]}
          castShadow={castShadow}
          // A ordem de empilhamento do desenho original: letreiro atras, mao
          // escura sobre ele, mao clara por cima. Um deslocamento minimo em Z
          // evita que as tres paredes briguem no buffer de profundidade.
          position={[0, 0, i * (logo.size.height * 0.0016)]}
        />
      ))}
    </group>
  );
};
