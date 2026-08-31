import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  /** Intensidade geral do ambiente. Baixa por padrao: o contraste vem das luzes diretas. */
  intensity?: number;
  /** Quanto do vermelho da marca entra nos reflexos das laterais extrudadas. */
  redBounce?: number;
};

/**
 * Ambiente de iluminacao procedural.
 *
 * Um HDRI baixado de CDN seria uma dependencia de rede dentro do render — e
 * portanto uma fonte de nao determinismo. Em vez disso o mapa equiretangular e
 * pintado em memoria: um ceu frio e fraco, um rebatedor branco no alto (a key)
 * e um rebatedor vermelho baixo, atras do sujeito. O PMREM converte tudo em um
 * mapa de reflexao real, o que da aos materiais o especular longo de estudio
 * que caracteriza campanha de moda.
 */
export const ProceduralEnvironment: React.FC<Props> = ({ intensity = 0.55, redBounce = 0.85 }) => {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const w = 256;
    const h = 128;
    const data = new Float32Array(w * h * 4);

    const put = (i: number, r: number, g: number, b: number) => {
      data[i * 4 + 0] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 1;
    };

    for (let y = 0; y < h; y++) {
      // v = 0 no topo, 1 na base do mapa equiretangular.
      const v = y / (h - 1);
      for (let x = 0; x < w; x++) {
        const u = x / (w - 1);
        const i = y * w + x;

        // Gradiente base: quase preto, levemente mais claro no zenite.
        const sky = 0.012 + (1 - v) * 0.05;
        let r = sky * 0.9;
        let g = sky * 0.95;
        let b = sky * 1.15;

        // Rebatedor branco superior-frontal — a fonte principal de especular.
        const keyU = Math.cos((u - 0.28) * Math.PI * 2) * 0.5 + 0.5;
        const key = Math.pow(Math.max(0, 1 - v * 2.6), 2) * Math.pow(keyU, 12);
        r += key * 3.2;
        g += key * 3.2;
        b += key * 3.3;

        // Rebatedor vermelho baixo e atras — devolve a cor da marca nos reflexos.
        const rimU = Math.cos((u - 0.78) * Math.PI * 2) * 0.5 + 0.5;
        const rim = Math.pow(Math.max(0, v - 0.45) * 1.9, 1.4) * Math.pow(rimU, 8);
        r += rim * 2.6 * redBounce;
        g += rim * 0.06 * redBounce;
        b += rim * 0.03 * redBounce;

        put(i, r * intensity, g * intensity, b * intensity);
      }
    }

    const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.needsUpdate = true;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular(texture);

    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      texture.dispose();
    };
  }, [scene, gl, intensity, redBounce]);

  return null;
};
