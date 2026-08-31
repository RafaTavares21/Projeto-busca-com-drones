import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../styles/tokens';
import { useLogoGeometry } from './logoGeometry';

/**
 * Como o letreiro se apresenta neste frame.
 *
 * `pedra` e o material da fachada: cinza claro, fosco, sem cor propria — o
 * letreiro comeca gravado no predio. `marca` e a cor real da EOG. A cena
 * interpola entre os dois, e essa transformacao E o argumento do filme: a
 * marca nao aparece, ela ganha cor dentro do patrimonio.
 *
 * A paleta nao sai de PRETO / BRANCO / VERMELHO em nenhum ponto da virada.
 */
export type LogoFinish = 'pedra' | 'marca';

type Props = {
  /** Altura do letreiro em unidades de mundo. */
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** 0 = pedra, 1 = cores da marca. Valores intermediarios sao a virada. */
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
        // Estado de origem: o letreiro e a pedra clara da fachada, as maos sao
        // a sombra dentro do relevo. Cinzas neutros — nenhum tom quente.
        const pedra = new THREE.Color(isLettering ? COLORS.stone : COLORS.stoneDark);

        const color = pedra.clone().lerp(brand, finish).multiplyScalar(exposure);

        return new THREE.MeshStandardMaterial({
          color,
          // A pedra e mineral e absolutamente fosca; a marca e tinta densa.
          // Interpolar as tres propriedades junto com a cor e o que faz a
          // virada parecer mudanca de MATERIAL, e nao ajuste de matiz. Nenhum
          // dos dois estados brilha: especular alto viraria neon.
          metalness: 0.0,
          roughness: 0.92 * (1 - finish) + 0.62 * finish,
          envMapIntensity: 0.55 * (1 - finish) + 0.35 * finish,
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
