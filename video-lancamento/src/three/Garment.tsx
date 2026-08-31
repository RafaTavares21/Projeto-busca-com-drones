import { useMemo } from 'react';
import * as THREE from 'three';
import { random } from 'remotion';
import { PRODUCT, useProductAsset } from './productAsset';

/** Silhueta da peca, em unidades de mundo. Corte oversized: ombro caido e corpo largo. */
const CUT = {
  neckHalfW: 116,
  shoulderY: 300,
  shoulderHalfW: 336,
  sleeveHalfW: 528,
  sleeveTopY: 256,
  sleeveBottomY: 58,
  armpitHalfW: 322,
  armpitY: 98,
  hipHalfW: 338,
  hemY: -434,
  collarDepth: 78,
  collarBand: 30,
} as const;

const buildSilhouette = (): THREE.Shape => {
  const s = new THREE.Shape();
  const c = CUT;

  s.moveTo(-c.neckHalfW, c.shoulderY);
  // Ombro caido — a assinatura do corte oversized.
  s.lineTo(-c.shoulderHalfW, c.shoulderY + 6);
  s.lineTo(-c.sleeveHalfW, c.sleeveTopY);
  // Barra da manga.
  s.lineTo(-c.sleeveHalfW + 24, c.sleeveBottomY);
  s.lineTo(-c.armpitHalfW, c.armpitY);
  // Costura lateral, com uma leve abertura em direcao a barra.
  s.lineTo(-c.hipHalfW, c.hemY);
  // Barra levemente curva: uma reta denunciaria o desenho vetorial.
  s.quadraticCurveTo(0, c.hemY - 30, c.hipHalfW, c.hemY);
  s.lineTo(c.armpitHalfW, c.armpitY);
  s.lineTo(c.sleeveHalfW - 24, c.sleeveBottomY);
  s.lineTo(c.sleeveHalfW, c.sleeveTopY);
  s.lineTo(c.shoulderHalfW, c.shoulderY + 6);
  s.lineTo(c.neckHalfW, c.shoulderY);
  // Decote.
  s.quadraticCurveTo(0, c.shoulderY - c.collarDepth, -c.neckHalfW, c.shoulderY);

  return s;
};

/** Faixa da gola: o vao entre o decote e uma curva deslocada para fora. */
const buildCollarBand = (): THREE.Shape => {
  const s = new THREE.Shape();
  const c = CUT;
  const outerHalfW = c.neckHalfW + c.collarBand * 0.6;

  s.moveTo(-c.neckHalfW, c.shoulderY);
  s.quadraticCurveTo(0, c.shoulderY - c.collarDepth, c.neckHalfW, c.shoulderY);
  s.lineTo(outerHalfW, c.shoulderY + c.collarBand * 0.35);
  s.quadraticCurveTo(0, c.shoulderY - c.collarDepth + c.collarBand, -outerHalfW, c.shoulderY + c.collarBand * 0.35);
  s.closePath();

  return s;
};

/**
 * Textura de trama.
 *
 * Um preto liso lê como plastico. Um mapa de rugosidade com ruido fino faz a
 * luz quebrar de forma irregular na superficie, que e o que o olho reconhece
 * como algodao pesado.
 */
const buildWeaveMap = (): THREE.Texture | null => {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Trama: duas ondas ortogonais + ruido, para nao virar xadrez perfeito.
      const weave = (Math.sin(x * 0.85) + Math.sin(y * 0.85)) * 0.5;
      const grain = random(`weave:${x}:${y}`) - 0.5;
      const v = 178 + weave * 14 + grain * 26;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  return tex;
};

type Props = {
  /** Cor do tecido. Preto de peca, nao preto absoluto — precisa receber luz. */
  color?: string;
  /** Espessura da peca. Baixa: e uma peca deitada, nao um bloco. */
  thickness?: number;
  /** Mostra a estampa. Desligar revela so o manequim. */
  showPrint?: boolean;
  castShadow?: boolean;
};

/**
 * A peca do DROP 01.
 *
 * A silhueta e construida programaticamente e extrudada, entao recebe a
 * iluminacao da cena como qualquer geometria — nao e uma imagem colada sobre o
 * video. A arte fornecida entra como estampa no peito, num plano rente a face
 * frontal, preservando a proporcao original do arquivo. Sem asset, a peca
 * aparece lisa e a cena continua de pe.
 */
export const Garment: React.FC<Props> = ({
  color = '#131313',
  thickness = 46,
  showPrint = true,
  castShadow = false,
}) => {
  const asset = useProductAsset();

  const bevel = 9;

  // A silhueta e centralizada a mao, guardando o deslocamento aplicado: a gola
  // e a estampa sao posicionadas em coordenadas do molde, e sem esse offset
  // elas flutuariam fora da peca.
  const { bodyGeometry, bodyOffset } = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildSilhouette(), {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    const offset = box
      ? new THREE.Vector3(
          -(box.max.x + box.min.x) / 2,
          -(box.max.y + box.min.y) / 2,
          -(box.max.z + box.min.z) / 2,
        )
      : new THREE.Vector3();
    geo.translate(offset.x, offset.y, offset.z);
    geo.computeVertexNormals();
    return { bodyGeometry: geo, bodyOffset: offset };
  }, [thickness]);

  const collarGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildCollarBand(), {
      depth: thickness * 0.5,
      bevelEnabled: true,
      bevelThickness: 5,
      bevelSize: 5,
      bevelSegments: 3,
      curveSegments: 24,
    });
    geo.computeVertexNormals();
    return geo;
  }, [thickness]);

  const weave = useMemo(buildWeaveMap, []);

  const fabric = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.86,
        metalness: 0,
        roughnessMap: weave,
        bumpMap: weave,
        bumpScale: 1.6,
        envMapIntensity: 0.7,
      }),
    [color, weave],
  );

  const rib = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // A gola canelada e um tom acima do corpo: e o que a faz existir no preto.
        color: '#151515',
        roughness: 0.94,
        metalness: 0,
        bumpMap: weave,
        bumpScale: 2.6,
        envMapIntensity: 0.6,
      }),
    [weave],
  );

  // A altura da peca define a escala da estampa, para que trocar o arquivo nao
  // exija recalcular nada: a proporcao original do asset e sempre respeitada.
  const bodyWidth = CUT.hipHalfW * 2;
  const bodyHeight = CUT.shoulderY - CUT.hemY;
  const printWidth = bodyWidth * PRODUCT.printScale;
  const printHeight = asset ? printWidth / asset.aspect : printWidth;

  // Altura do peito no molde: um pouco abaixo da linha do ombro, que e onde a
  // serigrafia cai numa peca real.
  const CHEST_Y = CUT.shoulderY - bodyHeight * 0.28;
  const printY = CHEST_Y + bodyOffset.y + bodyHeight * PRODUCT.printOffsetY;

  const frontZ = thickness / 2 + bevel + 1.5;

  const printMaterial = useMemo(() => {
    if (!asset) return null;
    return new THREE.MeshStandardMaterial({
      map: asset.texture,
      transparent: true,
      // A estampa e serigrafia sobre algodao: quase tao fosca quanto o tecido,
      // mas nao identica, senao ela desaparece na peca.
      roughness: 0.72,
      metalness: 0,
      envMapIntensity: 0.55,
      // Sem esta folga o plano da estampa briga em profundidade com a peca.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    });
  }, [asset]);

  return (
    <group>
      <mesh geometry={bodyGeometry} material={fabric} castShadow={castShadow} receiveShadow />
      <mesh
        geometry={collarGeometry}
        material={rib}
        position={[bodyOffset.x, bodyOffset.y, bodyOffset.z + thickness * 0.45]}
      />

      {showPrint && printMaterial ? (
        <mesh position={[0, printY, frontZ]} material={printMaterial} renderOrder={1}>
          <planeGeometry args={[printWidth, printHeight]} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Dimensoes uteis para a cena posicionar camera e luzes sem adivinhar numeros. */
export const GARMENT_BOUNDS = {
  width: CUT.sleeveHalfW * 2,
  height: CUT.shoulderY - CUT.hemY,
} as const;
