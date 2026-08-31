import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';

/**
 * REGISTRO DE ASSETS — EOG NAS RUAS
 *
 * Unica lista de arquivos do filme. As cenas pedem um asset pelo PAPEL que ele
 * cumpre, nunca pelo nome do arquivo, entao trocar o ensaio da proxima campanha
 * e trocar caminhos aqui.
 *
 * Cada entrada declara sua `folga` — quantas vezes a imagem cabe no quadro de
 * 1080x1920. E o dado mais importante do registro: ele diz quanto a camera pode
 * andar sobre aquela foto antes de a imagem amolecer. Duas fotos deste ensaio
 * tem folga 2.98x e aguentam close e movimento pesado; as outras oito tem 0.75x
 * e pedem tratamento de placa. A direcao respeita isso.
 *
 * Os recortes de pessoas fornecidos pela marca foram REMOVIDOS: com 155 a 360
 * px de conteudo, entravam em cena ampliados de tres a cinco vezes e a queda de
 * qualidade era visivel ao lado da fotografia original. A profundidade que eles
 * davam foi refeita com o que existe em alta qualidade — as maos vermelhas em
 * primeiro plano e a propria fotografia em camadas de velocidade diferente.
 */
export type AssetRole =
  | 'heroTheatro'
  | 'heroRegata'
  | 'torrePreta'
  | 'duplaChevron'
  | 'trioNoite'
  | 'costasNoite'
  | 'portaoDia'
  | 'balaustrada'
  | 'trioTorre'
  | 'portaoTrio'
  | 'maos';

type AssetSpec = {
  src: string;
  /** `foto` traz luz gravada; `arte` e chapada e recebe a luz da cena. */
  kind: 'foto' | 'arte';
  /** Descricao do papel narrativo. Documentacao viva. */
  papel: string;
};

export const ASSETS: Record<AssetRole, AssetSpec> = {
  heroTheatro: { src: 'assets/theatro-hero.jpg', kind: 'foto', papel: 'Theatro Municipal — abre o filme, aguenta close' },
  heroRegata: { src: 'assets/theatro-regata.jpg', kind: 'foto', papel: 'Theatro, regata branca — aguenta close' },

  torrePreta: { src: 'assets/torre-preta.jpg', kind: 'foto', papel: 'Contra-plongee na torre, fim de tarde' },
  duplaChevron: { src: 'assets/dupla-chevron.jpg', kind: 'foto', papel: 'Dupla na quina de pedra' },
  trioNoite: { src: 'assets/trio-noite.jpg', kind: 'foto', papel: 'Trio, hora azul' },
  costasNoite: { src: 'assets/costas-noite.jpg', kind: 'foto', papel: 'Estampa das costas, hora azul' },
  portaoDia: { src: 'assets/portao-dia.jpg', kind: 'foto', papel: 'Portao de ferro, luz de dia' },
  balaustrada: { src: 'assets/balaustrada.jpg', kind: 'foto', papel: 'Balaustrada com pichacao, noite' },
  trioTorre: { src: 'assets/trio-torre.jpg', kind: 'foto', papel: 'Trio contra a torre iluminada' },
  portaoTrio: { src: 'assets/portao-trio.jpg', kind: 'foto', papel: 'Trio na escadaria do portao' },

  maos: { src: 'assets/maos.png', kind: 'arte', papel: 'As maos vermelhas, isoladas' },
};

export type LoadedAsset = {
  texture: THREE.Texture;
  aspect: number;
  width: number;
  height: number;
  kind: AssetSpec['kind'];
  url: string;
  /** Quantas vezes a imagem cabe no quadro. Abaixo de 1, nao suporta close. */
  folga: number;
};

export type AssetMap = Partial<Record<AssetRole, LoadedAsset>>;

const FRAME = { width: 1080, height: 1920 };

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
        folga: Math.min(img.naturalWidth / FRAME.width, img.naturalHeight / FRAME.height),
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
    cached = Promise.all((Object.keys(ASSETS) as AssetRole[]).map((r) => toTexture(r, ASSETS[r]))).then(
      (entries) => Object.fromEntries(entries.filter((e): e is [AssetRole, LoadedAsset] => e !== null)),
    );
  }
  return cached;
};

const AssetContext = createContext<AssetMap>({});

/**
 * Carrega os assets ACIMA do `<ThreeCanvas>`.
 *
 * O Remotion desenha cada frame uma unica vez e nao reage a texturas que chegam
 * depois: um asset carregado por estado de um componente dentro do canvas nunca
 * apareceria, porque o unico draw do frame ja aconteceu.
 */
export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<AssetMap>({});
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Carregando fotografia da campanha'));

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
    if (ready) continueRender(handle);
  }, [ready, handle]);

  if (!ready) return null;

  return createElement(AssetContext.Provider, { value: assets }, children);
};

export const useAssets = (): AssetMap => useContext(AssetContext);
export const useAsset = (role: AssetRole): LoadedAsset | undefined => useAssets()[role];
