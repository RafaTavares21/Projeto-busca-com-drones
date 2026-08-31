import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { TextOverlay } from '../components/TextOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { Particles } from '../three/Particles';
import { Stage } from '../three/Stage';
import { Typography3D } from '../three/Typography3D';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, pulse, range, rad } from '../animations/interpolate';
import { BRAND, COLORS } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.marca;

/**
 * CENA 04 — A MARCA (9s a 12s)
 *
 * Dois objetos vindos de profundidades opostas se encontram num frame so.
 *
 * O letreiro emerge do fundo do espaco; a frase vem de TRAS da lente, na
 * direcao contraria. Nenhum dos dois acelera — a velocidade em Z e constante,
 * e a impressao de aceleracao e inteiramente da perspectiva. Contrapor as
 * direcoes rende mais espaco do que empilhar dois elementos andando juntos.
 *
 * Tudo nesta cena — trepidacao, clarao, estilhaco, luz — le do mesmo numero:
 * o frame da colisao. E o que faz o impacto parecer causa e consequencia, e
 * nao varios efeitos disparando por acaso no mesmo instante.
 */
export const Scene04Marca: React.FC = () => {
  const frame = useCurrentFrame();

  // Velocidade constante em Z, em sentidos opostos.
  const logoZ = range(frame, [B.logoIn[0], B.colisao], [-2600, 240]);
  const logoIn = inOut(frame, [B.logoIn[0], B.logoIn[0] + 8, 999, 1000]);

  const fraseZ = range(frame, [B.fraseIn[0], B.colisao], [BASE_Z + 520, 300]);
  const fraseIn = inOut(frame, [B.fraseIn[0], B.fraseIn[0] + 8, 999, 1000]);
  // O borrao existe so enquanto a frase esta rapida, e some quando ela para.
  const fraseVel = Math.max(0, 1 - progress(frame, B.fraseIn[1] - 6, B.colisao + 6, EASE.expoOut));

  // A reacao. Um unico numero governa a cena inteira a partir daqui.
  const choque = 1 - progress(frame, B.choque[0], B.choque[1], EASE.power4Out);
  const clarao = pulse(frame, B.colisao - 2, B.colisao + 10, 0.22);

  // Deriva lenta depois do impacto: a composicao assenta em vez de congelar.
  const deriva = progress(frame, B.deriva[0], B.deriva[1], EASE.glide);
  const giro = range(deriva, [0, 1], [0.26, -0.08]);

  const assinatura = progress(frame, B.assinatura[0], B.assinatura[1], EASE.power3Out);
  const saida = 1 - progress(frame, B.saida[0], B.saida[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: saida }}>
      <Background pool={0.22 + clarao * 0.5} redWash={clarao * 0.85} grunge={0.46} parallax={-28} />

      <Stage exposure={1.04} environmentIntensity={0.5} redBounce={0.5 + clarao * 0.8}>
        <CameraRig
          position={[0, 0, BASE_Z]}
          handheld={5}
          shake={choque * 30}
          roll={choque * 0.06}
          seed="marca"
        />
        <Lighting
          key={2.0}
          fill={0.15}
          rim={1.8 + clarao * 6}
          rimPosition={[-540, 210, -820]}
          top={2.2}
          ambient={0.06}
        />

        {/* Estilhaco so na esteira da colisao, e so enquanto ela dura. */}
        <Particles
          count={26}
          radius={1200}
          depth={2400}
          size={7}
          shard
          color={COLORS.red}
          drift={[420, 220, 300]}
          opacity={0.32 * choque}
          startFrame={B.colisao}
          seed="colisao-estilhaco"
        />

        <Glow position={[0, 0, -700]} size={2400} color={COLORS.redHot} intensity={clarao * 0.4} />

        <LogoExtruded
          height={range(deriva, [0, 1], [560, 500])}
          position={[0, HEIGHT * 0.06, logoZ]}
          rotation={[rad(-3), giro, 0]}
          finish={1}
          opacity={logoIn}
          exposure={1.08 + clarao * 0.5}
        />

        {/* A frase vem de tras da lente e trava sob o letreiro. */}
        <Typography3D
          text={BRAND.tagline}
          size={112}
          depth={40}
          tracking={0.08}
          position={[0, -HEIGHT * 0.2, fraseZ]}
          rotation={[rad(-6), range(deriva, [0, 1], [rad(10), 0]), 0]}
          faceColor={COLORS.white}
          sideColor="#1A0605"
          opacity={fraseIn * (0.35 + assinatura * 0.65)}
          ghosts={fraseVel > 0.06 ? 4 : 0}
          ghostOffset={[0, 0, -180 * fraseVel]}
          ghostOpacity={0.15 * fraseVel}
        />
      </Stage>

      <TextOverlay
        bottomLeft={{ text: BRAND.place, reveal: assinatura }}
        bottomRight={{ text: BRAND.handle, reveal: assinatura }}
      />

      <FilmTreatment vignette={0.9} />
    </AbsoluteFill>
  );
};
