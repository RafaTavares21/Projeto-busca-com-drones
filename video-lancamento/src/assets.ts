import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';

/**
 * REGISTRO DE ASSETS DO PRODUTO
 *
 * Esta e a unica lista de arquivos do filme. Trocar a peca do proximo drop e
 * trocar os caminhos aqui — nenhuma cena precisa ser reescrita, porque as
 * cenas pedem os assets pelo papel que eles cumprem na narrativa
 * (`productFront`, `productBack`, `hands`) e nunca pelo nome do arquivo.
 *
 * Os originais ficam intactos em `public/assets/source/`; `npm run assets`
 * gera as versoes recortadas usadas aqui.
 */
export type AssetRole = 'productFront' | 'productBack' | 'productWorn' | 'printMark' | 'hands';

type AssetSpec = {
  /** Caminho relativo a /public. */
  src: string;
  /**
   * `art` recebe a iluminacao da cena — arte chapada ganha volume com luz.
   * `photo` e exibida como foi fotografada: a luz ja esta na imagem, e
   * ilumina-la de novo destruiria a fotografia.
   */
  kind: 'art' | 'photo';
  /** Descricao do papel narrativo. Serve de documentacao viva. */
  role: string;
};

export const ASSETS: Record<AssetRole, AssetSpec> = {
  productFront: {
    src: 'assets/shirt-front.png',
    kind: 'photo',
    role: 'A peca, frente — abre o reveal',
  },
  productBack: {
    src: 'assets/shirt-back.png',
    kind: 'photo',
    role: 'A peca, costas — revelada atras da mao',
  },
  productWorn: {
    src: 'assets/product-worn.jpg',
    kind: 'photo',
    role: 'A peca vestida — o caimento e o corpo, na cena de detalhes',
  },
  printMark: {
    src: 'assets/print-front.png',
    kind: 'art',
    role: 'A estampa isolada — assina o ultimo frame',
  },
  hands: {
    src: 'assets/hands.png',
    kind: 'art',
    role: 'As maos vermelhas — gesto de impacto, mascara e transicao',
  },
};

export type LoadedAsset = {
  texture: THREE.Texture;
  /** largura / altura. */
  aspect: number;
  width: number;
  height: number;
  kind: AssetSpec['kind'];
  /** URL servida, para quando a camada DOM precisar do mesmo arquivo. */
  url: string;
};

export type AssetMap = Partial<Record<AssetRole, LoadedAsset>>;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`nao foi possivel carregar ${url}`));
    img.src = url;
  });

const toTexture = async (role: AssetRole, spec: AssetSpec): Promise<[AssetRole, LoadedAsset] | null> => {
  try {
    const url = staticFile(spec.src);
    const img = await loadImage(url);

    const texture = new THREE.Texture(img);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return [
      role,
      {
        texture,
        aspect: img.naturalWidth / img.naturalHeight,
        width: img.naturalWidth,
        height: img.naturalHeight,
        kind: spec.kind,
        url,
      },
    ];
  } catch {
    // Asset ausente nao derruba o filme: a cena decide o que fazer sem ele.
    return null;
  }
};

let cached: Promise<AssetMap> | null = null;

const loadAll = (): Promise<AssetMap> => {
  if (!cached) {
    cached = Promise.all(
      (Object.keys(ASSETS) as AssetRole[]).map((role) => toTexture(role, ASSETS[role])),
    ).then((entries) => Object.fromEntries(entries.filter((e): e is [AssetRole, LoadedAsset] => e !== null)));
  }
  return cached;
};

const AssetContext = createContext<AssetMap>({});

/**
 * Carrega os assets ACIMA do `<ThreeCanvas>` e so entao monta os filhos.
 *
 * O Remotion desenha cada frame uma unica vez e nao reage a texturas que
 * chegam depois: um asset carregado por estado de um componente dentro do
 * canvas nunca apareceria, porque o unico draw do frame ja aconteceu.
 */
export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<AssetMap>({});
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Carregando assets do produto'));

  useEffect(() => {
    let alive = true;
    loadAll().then((loaded) => {
      if (!alive) return;
      setAssets(loaded);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      continueRender(handle);
    }
  }, [ready, handle]);

  if (!ready) {
    return null;
  }

  return createElement(AssetContext.Provider, { value: assets }, children);
};

export const useAssets = (): AssetMap => useContext(AssetContext);

/** `undefined` quando o arquivo nao carregou — a cena decide o fallback. */
export const useAsset = (role: AssetRole): LoadedAsset | undefined => useAssets()[role];
