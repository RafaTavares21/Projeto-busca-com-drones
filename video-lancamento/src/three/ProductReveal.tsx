import { EASE } from '../animations/easings';
import { progress, rad } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { Garment, GARMENT_BOUNDS } from './Garment';
import { PRODUCT, useProductAsset } from './productAsset';

type Props = {
  /** Frame LOCAL da cena. Toda a animacao deriva deste numero. */
  frame: number;
  /** Janela [inicio, fim] em que a peca cresce de `scaleFrom` ate `scaleTo`. */
  growth: readonly [number, number];
  /** Janela da rotacao lenta e continua. */
  spin: readonly [number, number];
  scaleFrom?: number;
  scaleTo?: number;
  /** Amplitude da rotacao em Y, em graus, ao longo de `spin`. */
  spinDegrees?: number;
};

/**
 * Apresentacao do produto.
 *
 * O componente nao conhece a cena: recebe um frame local e janelas de tempo e
 * devolve a peca posicionada. Trocar o arquivo do produto ou a duracao da cena
 * nao exige mexer aqui, e a mesma apresentacao serve para o proximo DROP.
 *
 * Em `cutout` o proprio arquivo e o produto — um plano recortado que recebe a
 * luz da cena. Em `print-on-garment` o arquivo e a arte da estampa, aplicada
 * sobre a peca construida em 3D. Sem asset, a peca aparece lisa.
 */
export const ProductReveal: React.FC<Props> = ({
  frame,
  growth,
  spin,
  scaleFrom = 0.15,
  scaleTo = 1,
  spinDegrees = 46,
}) => {
  const asset = useProductAsset();

  // Mola pesada: a peca tem massa, chega e assenta sem quicar.
  const grow = springAt(frame, 'heavy', {
    delay: growth[0],
    from: scaleFrom,
    to: scaleTo,
    durationInFrames: growth[1] - growth[0],
  });

  // Rotacao continua e lenta, partindo de tres-quartos e assentando quase de
  // frente: o produto termina legivel, que e o que uma campanha precisa.
  const spinT = progress(frame, spin[0], spin[1], EASE.sineInOut);
  const rotationY = rad(spinDegrees * (1 - spinT) - spinDegrees * 0.12);

  // Inclinacao sutil que acompanha a rotacao, para a peca nao parecer presa a
  // um eixo unico.
  const rotationX = rad(-5 * (1 - spinT));

  const cutout = PRODUCT.mode === 'cutout' && asset;

  return (
    <group scale={grow} rotation={[rotationX, rotationY, 0]}>
      {cutout ? (
        <mesh>
          <planeGeometry args={[GARMENT_BOUNDS.height * asset.aspect, GARMENT_BOUNDS.height]} />
          <meshStandardMaterial
            map={asset.texture}
            transparent
            roughness={0.78}
            metalness={0}
            envMapIntensity={0.6}
          />
        </mesh>
      ) : (
        <Garment />
      )}
    </group>
  );
};
