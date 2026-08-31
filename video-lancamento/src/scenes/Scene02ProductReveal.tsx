import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { HudOverlay } from '../components/HudOverlay';
import { CameraRig } from '../three/CameraRig';
import { Glow } from '../three/Glow';
import { Lighting } from '../three/Lighting';
import { Particles } from '../three/Particles';
import { ProductReveal } from '../three/ProductReveal';
import { Stage } from '../three/Stage';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { inOut, progress, range, stagger } from '../animations/interpolate';
import { COLORS } from '../styles/tokens';
import { BEATS } from '../timing';

const B = BEATS.productReveal;

/**
 * CENA 02 — PRODUCT REVEAL (2.5s a 6s)
 *
 * Estudio fotografico: fundo em ciclorama, key dura, fill quase nula e uma luz
 * vermelha que atravessa a peca de um lado ao outro. A peca nasce minuscula ao
 * fundo e cresce ate ocupar o quadro enquanto a camera avanca — dois movimentos
 * somados, que e o que produz a compressao de perspectiva de lente longa.
 *
 * A peca e geometria real recebendo luz real, e nao uma imagem sobreposta ao
 * video: e por isso que a estampa acompanha a rotacao e escurece quando a peca
 * sai do facho.
 */
export const Scene02ProductReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const entrance = progress(frame, B.spaceFadeIn[0], B.spaceFadeIn[1], EASE.power3Out);

  // --- Camera --------------------------------------------------------------
  // Dolly continuo. Comeca longe e para de avancar antes do fim da cena: uma
  // camera que ainda acelera no ultimo frame denuncia o corte.
  const dolly = range(frame, [B.cameraDolly[0], B.cameraDolly[1]], [BASE_Z * 1.95, BASE_Z * 1.28], EASE.glide);
  // Contra-movimento vertical minimo, para a peca "assentar" no quadro.
  const riseY = range(frame, [0, 92], [-120, 26], EASE.glide);

  // --- Luz vermelha percorrendo a peca -------------------------------------
  const sweepT = progress(frame, B.lightSweep[0], B.lightSweep[1], EASE.sineInOut);
  const sweepX = range(sweepT, [0, 1], [-980, 980]);
  // A luz e mais forte no centro do percurso, quando cruza o peito da peca.
  const sweepPower = Math.sin(sweepT * Math.PI);

  // --- Saida ---------------------------------------------------------------
  const exit = 1 - progress(frame, B.exit[0], B.exit[1], EASE.power2In);

  const hud = (i: number) => inOut(frame, [stagger(i, 5, B.hudIn[0]), stagger(i, 5, B.hudIn[1]), 88, 100]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: exit }}>
      {/* Ciclorama: o halo atras da peca e o que cria a separacao entre
          produto, camera e fundo. Sem ele a peca cola no preto. */}
      <Background
        pool={entrance * 1.05}
        redWash={sweepPower * 0.34}
        grunge={0.35}
        parallax={26}
      />

      <Stage exposure={1.02} environmentIntensity={0.5} redBounce={0.55 + sweepPower * 0.5}>
        <CameraRig
          position={[0, riseY * 0.35, dolly]}
          lookAt={[0, riseY * 0.12, 0]}
          handheld={5}
          seed="product"
        />

        <Lighting
          // Key baixa e softbox alto: numa peca deitada e plana, uma direcional
          // forte ilumina tudo por igual e a peca vira um recorte de papel. A
          // modelagem tem que vir de uma fonte com queda.
          key={1.15}
          fill={0.16}
          // A rim vermelha E a luz que percorre a peca: uma unica fonte movel,
          // nao um efeito somado por cima.
          rim={2.6 + sweepPower * 4.4}
          rimPosition={[sweepX, 160, -620]}
          top={4.2}
          topPosition={[-420, 1180, 1420]}
          topAngle={0.62}
          ambient={0.055}
        />

        {/* Segunda fonte vermelha, frontal e rasante, para a luz tambem correr
            sobre a estampa e nao apenas contornar a silhueta. */}
        <pointLight
          position={[sweepX * 0.8, 60, 720]}
          intensity={sweepPower * 2_600_000}
          distance={3200}
          decay={2}
          color={COLORS.redHot}
        />

        <Glow position={[sweepX * 0.5, 40, -520]} size={1800} color={COLORS.redHot} intensity={sweepPower * 0.2} />

        <group position={[0, riseY, 0]}>
          <ProductReveal frame={frame} growth={B.garmentScale} spin={B.garmentSpin} scaleFrom={0.15} scaleTo={1} />
        </group>

        {/* Poeira de estudio: quase invisivel, existe so para dar volume ao ar
            entre a camera e a peca. */}
        <Particles
          count={34}
          radius={900}
          depth={2200}
          size={3.4}
          color={COLORS.bone}
          drift={[10, 26, 0]}
          opacity={0.15 * entrance}
          startFrame={B.particles[0]}
          seed="studio-dust"
        />
      </Stage>

      <HudOverlay
        top={[
          { text: 'Drop 01 / Peca 01', reveal: hud(0) },
          { text: 'Estudio', reveal: hud(1), align: 'right' },
        ]}
        bottom={[
          { text: 'Never Broke Again', reveal: hud(2) },
          { text: '100% Algodao', reveal: hud(3), align: 'right' },
        ]}
        marks={hud(0) * 0.7}
      />

      <FilmTreatment vignette={0.78} />
    </AbsoluteFill>
  );
};
