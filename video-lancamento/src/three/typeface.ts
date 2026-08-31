import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';

/**
 * Fonte typeface usada pelo `TextGeometry`.
 *
 * O arquivo e gerado por `scripts/generate-typeface.mjs` a partir do TTF da
 * Anton — o `three` nao distribui fontes e o `TextGeometry` so entende este
 * formato.
 *
 * O carregamento acontece ACIMA do `<ThreeCanvas>`, nunca dentro dele. Se a
 * fonte chegasse por estado de um componente interno, o canvas ja teria feito
 * seu unico draw do frame e a tipografia sairia ausente — o Remotion desenha
 * cada frame uma vez e nao reage a atualizacoes tardias do react-three-fiber.
 */
let cached: Promise<Font> | null = null;

const load = (): Promise<Font> => {
  if (!cached) {
    cached = fetch(staticFile('fonts/anton.typeface.json'))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ao buscar a fonte typeface`);
        }
        return res.json();
      })
      .then((json) => new FontLoader().parse(json));
  }
  return cached;
};

const TypefaceContext = createContext<Font | null>(null);

/**
 * Segura o frame ate a fonte estar pronta e so entao monta os filhos.
 * Deve envolver toda composicao que contenha tipografia 3D.
 */
export const TypefaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [font, setFont] = useState<Font | null>(null);
  const [handle] = useState(() => delayRender('Carregando typeface 3D'));

  useEffect(() => {
    let alive = true;
    load()
      .then((loaded) => {
        if (alive) setFont(loaded);
      })
      .catch((err: Error) => {
        throw new Error(`Falha ao carregar a fonte typeface 3D: ${err.message}`);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Liberar o frame so depois que a fonte foi committada: soltar dentro do
  // `.then()` devolveria o controle ao Remotion antes da arvore existir.
  useEffect(() => {
    if (font) {
      continueRender(handle);
    }
  }, [font, handle]);

  if (!font) {
    return null;
  }

  return createElement(TypefaceContext.Provider, { value: font }, children);
};

export const useTypeface = (): Font => {
  const font = useContext(TypefaceContext);
  if (!font) {
    throw new Error('useTypeface precisa estar dentro de <TypefaceProvider>.');
  }
  return font;
};
