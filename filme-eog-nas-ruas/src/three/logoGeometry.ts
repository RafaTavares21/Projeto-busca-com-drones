import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

/**
 * Carrega o letreiro vetorizado e o converte em GEOMETRIA EXTRUDADA REAL.
 *
 * Este e o salto em relacao ao projeto anterior. La o logo era um bitmap, e
 * volume so podia ser simulado empilhando dezenas de copias chapadas: de frente
 * parecia 3D, mas nao sobrevivia a um giro de camera. Aqui o `vectorize.mjs`
 * transforma o bitmap em curvas, o `SVGLoader` le cada curva como forma, e o
 * `ExtrudeGeometry` constroi solido com bisel — que responde a luz de qualquer
 * angulo, tem parede lateral de verdade e projeta sombra propria.
 *
 * As tres camadas do SVG (letreiro, mao de fundo, mao da frente) viram tres
 * malhas independentes, cada uma com seu material. E o que permite dar pedra
 * ao letreiro e vermelho as maos, e trocar esses materiais ao longo do filme.
 */
export type LogoLayer = {
  geometry: THREE.ExtrudeGeometry;
  /** Cor de origem no SVG — identifica a camada sem depender da ordem. */
  color: THREE.Color;
  /** `letreiro`, `mao-fundo` ou `mao-frente`. */
  id: string;
};

export type LogoGeometry = {
  layers: LogoLayer[];
  /** Largura e altura do desenho inteiro, em unidades de geometria. */
  size: { width: number; height: number };
};

export type LogoOptions = {
  depth: number;
  bevel: number;
  curveSegments: number;
};

const DEFAULTS: LogoOptions = { depth: 46, bevel: 3.2, curveSegments: 5 };

let cached: Promise<LogoGeometry> | null = null;

const build = async (options: LogoOptions): Promise<LogoGeometry> => {
  const res = await fetch(staticFile('assets/logo.svg'));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao buscar o letreiro vetorizado`);
  }
  const parsed = new SVGLoader().parse(await res.text());

  const layers: LogoLayer[] = [];
  const bounds = new THREE.Box3();

  for (const svgPath of parsed.paths) {
    const shapes = SVGLoader.createShapes(svgPath);
    if (shapes.length === 0) continue;

    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: options.depth,
      bevelEnabled: true,
      bevelThickness: options.bevel,
      bevelSize: options.bevel * 0.8,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: options.curveSegments,
    });

    // O SVG tem Y para baixo e o three.js para cima. Sem esta inversao o
    // letreiro sai de cabeca para baixo.
    geometry.scale(1, -1, 1);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      bounds.union(geometry.boundingBox);
    }

    layers.push({
      geometry,
      color: svgPath.color.clone(),
      id: (svgPath.userData?.node as Element | undefined)?.parentElement?.id ?? `camada-${layers.length}`,
    });
  }

  if (layers.length === 0) {
    throw new Error('o letreiro vetorizado nao produziu nenhuma forma');
  }

  // Centraliza o conjunto INTEIRO, e nao cada camada: centralizar uma a uma
  // desmontaria a composicao do desenho.
  const center = bounds.getCenter(new THREE.Vector3());
  for (const layer of layers) {
    layer.geometry.translate(-center.x, -center.y, -center.z);
  }

  const size = bounds.getSize(new THREE.Vector3());
  return { layers, size: { width: size.x, height: size.y } };
};

const load = (options: LogoOptions): Promise<LogoGeometry> => {
  if (!cached) cached = build(options);
  return cached;
};

const LogoContext = createContext<LogoGeometry | null>(null);

/**
 * Constroi a geometria ACIMA do `<ThreeCanvas>`.
 *
 * A extrusao de um letreiro inteiro custa mais de um milhao de vertices e leva
 * centenas de milissegundos. Feita dentro do canvas, ela chegaria depois do
 * unico draw que o Remotion faz por frame, e o logo simplesmente nao apareceria.
 * Aqui o `delayRender` segura o frame e a geometria e construida uma unica vez
 * para o filme todo.
 */
export const LogoProvider: React.FC<{ children: ReactNode; options?: Partial<LogoOptions> }> = ({
  children,
  options,
}) => {
  const [logo, setLogo] = useState<LogoGeometry | null>(null);
  const [handle] = useState(() => delayRender('Extrudando o letreiro da marca'));

  useEffect(() => {
    let alive = true;
    load({ ...DEFAULTS, ...options })
      .then((built) => {
        if (alive) setLogo(built);
      })
      .catch((err: Error) => {
        throw new Error(`Falha ao extrudar o letreiro: ${err.message}`);
      });
    return () => {
      alive = false;
    };
    // As opcoes sao fixas para o filme inteiro: a geometria e cara demais para
    // ser reconstruida por cena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logo) continueRender(handle);
  }, [logo, handle]);

  if (!logo) return null;

  return createElement(LogoContext.Provider, { value: logo }, children);
};

export const useLogoGeometry = (): LogoGeometry => {
  const logo = useContext(LogoContext);
  if (!logo) {
    throw new Error('useLogoGeometry precisa estar dentro de <LogoProvider>.');
  }
  return logo;
};
