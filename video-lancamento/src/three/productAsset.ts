import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';

/**
 * Configuracao do produto em destaque.
 *
 * Trocar a peca do DROP e trocar o caminho aqui — nenhuma cena precisa ser
 * reescrita. Os caminhos sao tentados em ordem e o primeiro que carregar vira o
 * asset oficial; se nenhum carregar, a cena cai no manequim geometrico.
 */
export const PRODUCT = {
  /** Caminhos relativos a /public, tentados em ordem. */
  sources: ['assets/camisa.png', 'assets/camisa.jpg'] as const,

  /**
   * Como o asset entra em cena:
   * - `print-on-garment`: a arte e aplicada como estampa sobre a peca 3D.
   *   Correto quando o arquivo e a arte da estampa (fundo chapado).
   * - `cutout`: o proprio arquivo E o produto, exibido como recorte iluminado.
   *   Correto quando o arquivo e uma foto da peca ja recortada.
   */
  mode: 'print-on-garment' as 'print-on-garment' | 'cutout',

  /**
   * Como obter a transparencia:
   * - `auto`: usa o canal alfa do arquivo se ele existir; senao chaveia o fundo.
   * - `alpha`: confia no canal alfa do arquivo.
   * - `luminance`: sempre chaveia o fundo escuro.
   * - `none`: sem transparencia.
   */
  matte: 'auto' as 'auto' | 'alpha' | 'luminance' | 'none',

  /**
   * Faixa do chaveamento por luminancia, em 0..1. O corte usa o canal MAIS
   * FORTE do pixel, e nao a luminancia perceptual: um vermelho saturado tem
   * luminancia baixa e seria comido por um corte perceptual — exatamente o
   * vermelho da marca. Assim a arte sai intacta.
   */
  matteRange: [0.02, 0.13] as const,

  /** Largura da estampa como fracao da largura do corpo da peca. */
  printScale: 0.62,
  /** Deslocamento vertical da estampa, como fracao da altura da peca. */
  printOffsetY: 0.04,
} as const;

export type ProductAsset = {
  texture: THREE.Texture;
  /** largura / altura da imagem original. */
  aspect: number;
  /** Caminho efetivamente carregado. */
  source: string;
  /** Se a transparencia veio do arquivo ou foi chaveada aqui. */
  matted: boolean;
};

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`nao foi possivel carregar ${url}`));
    img.src = url;
  });

/**
 * Constroi a textura do produto.
 *
 * O arquivo original nunca e alterado: o chaveamento acontece uma unica vez em
 * memoria, no carregamento, e produz uma `CanvasTexture`. Fazer isso na CPU em
 * vez de num shader mantem o material padrao do three.js — e portanto a peca
 * continua recebendo a iluminacao da cena como qualquer outro objeto.
 */
const buildTexture = async (url: string): Promise<ProductAsset> => {
  const img = await loadImage(url);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('contexto 2d indisponivel');
  }
  ctx.drawImage(img, 0, 0);

  let matted = false;

  if (PRODUCT.matte !== 'none') {
    const imageData = ctx.getImageData(0, 0, w, h);
    const px = imageData.data;

    // Um PNG opaco chega aqui com alfa 255 em toda parte. Nesse caso "usar o
    // alfa do arquivo" significaria nao ter recorte nenhum.
    let hasRealAlpha = false;
    for (let i = 3; i < px.length; i += 4) {
      const a = px[i];
      if (a !== undefined && a < 250) {
        hasRealAlpha = true;
        break;
      }
    }

    const shouldKey =
      PRODUCT.matte === 'luminance' || (PRODUCT.matte === 'auto' && !hasRealAlpha);

    if (shouldKey) {
      const [lo, hi] = PRODUCT.matteRange;
      for (let i = 0; i < px.length; i += 4) {
        const r = (px[i] ?? 0) / 255;
        const g = (px[i + 1] ?? 0) / 255;
        const b = (px[i + 2] ?? 0) / 255;
        const level = Math.max(r, g, b);
        px[i + 3] = Math.round(255 * smoothstep(lo, hi, level));
      }
      ctx.putImageData(imageData, 0, 0);
      matted = true;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return { texture, aspect: w / h, source: url, matted };
};

let cached: Promise<ProductAsset | null> | null = null;

const load = (): Promise<ProductAsset | null> => {
  if (!cached) {
    cached = (async () => {
      for (const source of PRODUCT.sources) {
        try {
          return await buildTexture(staticFile(source));
        } catch {
          // Caminho seguinte. Ausencia de asset nao e erro: existe fallback.
        }
      }
      return null;
    })();
  }
  return cached;
};

const ProductAssetContext = createContext<ProductAsset | null>(null);

/**
 * Carrega o asset do produto ACIMA do `<ThreeCanvas>`.
 *
 * Pela mesma razao do typeface: o Remotion desenha o canvas uma vez por frame e
 * nao reage a texturas que chegam depois. Carregar aqui garante que a peca ja
 * exista no primeiro (e unico) draw.
 */
export const ProductAssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [asset, setAsset] = useState<ProductAsset | null>(null);
  const [resolved, setResolved] = useState(false);
  const [handle] = useState(() => delayRender('Carregando asset do produto'));

  useEffect(() => {
    let alive = true;
    load().then((loaded) => {
      if (!alive) return;
      setAsset(loaded);
      setResolved(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (resolved) {
      continueRender(handle);
    }
  }, [resolved, handle]);

  if (!resolved) {
    return null;
  }

  return createElement(ProductAssetContext.Provider, { value: asset }, children);
};

/** `null` quando nenhum asset foi encontrado — a cena deve cair no placeholder. */
export const useProductAsset = (): ProductAsset | null => useContext(ProductAssetContext);
