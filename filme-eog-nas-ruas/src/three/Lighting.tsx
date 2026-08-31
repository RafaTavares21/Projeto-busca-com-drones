import * as THREE from 'three';
import { COLORS } from '../styles/tokens';

type Props = {
  /** Intensidade da luz principal. */
  key?: number;
  /** Preenchimento — mantido muito baixo: o contraste alto e parte da estetica. */
  fill?: number;
  /** Contraluz vermelha. E ela que separa o sujeito do preto do fundo. */
  rim?: number;
  /** Posicao da contraluz vermelha, para poder varrer o objeto ao longo do tempo. */
  rimPosition?: [number, number, number];
  /** Luz de topo estreita, tipo softbox de estudio. */
  top?: number;
  /** Posicao do softbox. Move-lo e como reposicionar o rebatedor no set. */
  topPosition?: [number, number, number];
  /** Abertura do softbox, em radianos. */
  topAngle?: number;
  ambient?: number;
  castShadow?: boolean;
};

/**
 * Rig de iluminacao cinematografica de tres pontos.
 *
 * A leitura premium vem da proporcao, nao da quantidade: key dura e direcional,
 * fill quase inexistente para preservar o preto, e uma rim vermelha forte por
 * tras do sujeito. Nenhuma luz colorida alem do vermelho da marca.
 */
export const Lighting: React.FC<Props> = ({
  key: keyIntensity = 3.2,
  fill = 0.22,
  rim = 5.5,
  rimPosition = [-620, 180, -760],
  top = 1.1,
  topPosition = [120, 1500, 380],
  topAngle = 0.55,
  ambient = 0.08,
  castShadow = false,
}) => (
  <>
    <ambientLight intensity={ambient} color={COLORS.white} />

    {/* KEY — alta, frontal-esquerda, dura. Define a forma. */}
    <directionalLight
      position={[-760, 980, 1120]}
      intensity={keyIntensity}
      color={COLORS.white}
      castShadow={castShadow}
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0008}
      shadow-camera-near={100}
      shadow-camera-far={4200}
      shadow-camera-left={-1100}
      shadow-camera-right={1100}
      shadow-camera-top={1400}
      shadow-camera-bottom={-1400}
    />

    {/* FILL — oposta a key, fraquissima. So impede que a sombra vire buraco. */}
    <directionalLight position={[980, -180, 640]} intensity={fill} color="#AFC4E0" />

    {/* RIM vermelha — atras do sujeito, e o unico acento de cor do rig. */}
    <pointLight
      position={rimPosition}
      intensity={rim * 1_000_000}
      distance={4200}
      decay={2}
      color={COLORS.redHot}
    />

    {/* TOP — faixa estreita que desenha a aresta superior da tipografia. */}
    <spotLight
      position={topPosition}
      angle={topAngle}
      penumbra={0.9}
      intensity={top * 900_000}
      distance={4600}
      decay={2}
      color={COLORS.bone}
    />
  </>
);

/** Alvo neutro reutilizavel, para luzes que precisam apontar para a origem. */
export const ORIGIN = new THREE.Vector3(0, 0, 0);
