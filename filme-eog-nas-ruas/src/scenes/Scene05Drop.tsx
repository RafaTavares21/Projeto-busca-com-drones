import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { FilmTreatment } from '../components/FilmTreatment';
import { CameraRig } from '../three/CameraRig';
import { Lighting } from '../three/Lighting';
import { LogoExtruded } from '../three/LogoExtruded';
import { Stage } from '../three/Stage';
import { Typography3D } from '../three/Typography3D';
import { BASE_Z } from '../three/stageConfig';
import { EASE } from '../animations/easings';
import { progress, pulse, range, rad } from '../animations/interpolate';
import { springAt } from '../animations/springs';
import { BRAND, COLORS, FONTS, LABELS, TRACKING } from '../styles/tokens';
import { BEATS, HEIGHT } from '../timing';

const B = BEATS.drop;

/**
 * CENA 05 — DROP (17.5s a 20s)
 *
 * Preto. Um clarao vermelho de tres frames. Seis frames de silencio — e essa
 * pausa que da peso ao que vem depois. Entao a assinatura.
 *
 * Depois de vinte segundos de profundidade, o fecho ganha forca por quase
 * abandona-la: o letreiro para de girar e assenta quase de frente. A unica
 * coisa que ainda vem de longe e DROP 01, e ela vem como geometria extrudada,
 * atravessando o palco de tras para a frente. Todo o resto do texto e plano,
 * e essa diferenca E a hierarquia. O ultimo frame precisa aguentar ser visto
 * parado.
 */
export const Scene05Drop: React.FC = () => {
  const frame = useCurrentFrame();

  const clarao = pulse(frame, B.clarao[0], B.clarao[1], 0.3);

  const marca = springAt(frame, 'solid', {
    delay: B.marca[0],
    durationInFrames: B.marca[1] - B.marca[0],
  });
  // Giro que desacelera ate quase parar: a marca chega e assenta.
  const giro = range(progress(frame, B.marca[0], B.marca[1] + 16, EASE.expoOut), [0, 1], [0.5, 0.04]);

  const regua = progress(frame, B.regua[0], B.regua[1], EASE.power4Out);

  /**
   * DROP 01 e o unico texto do filme que existe como GEOMETRIA, e nao como
   * fonte desenhada na tela. Ele chega vindo do fundo do palco e trava: e o
   * mesmo beat da regua, entao a linha horizontal abre no exato frame em que a
   * palavra assenta sobre ela.
   */
  const drop = springAt(frame, 'snap', { delay: B.regua[0], durationInFrames: B.regua[1] - B.regua[0] });
  // Profundidade real: a palavra nasce 900 unidades atras e vem ate a frente.
  const dropZ = range(drop, [0, 1], [-900, 300]);
  // Velocidade quadro a quadro. O borrao so existe enquanto ela e alta — e
  // por isso que ele desaparece sozinho quando a palavra para.
  const dropVel = Math.max(0, 1 - progress(frame, B.regua[0], B.regua[0] + 12, EASE.expoOut));
  const breve = springAt(frame, 'snap', { delay: B.breve[0], durationInFrames: B.breve[1] - B.breve[0] });
  const contato = progress(frame, B.contato[0], B.contato[1], EASE.power3Out);
  const fim = 1 - progress(frame, B.fim[0], B.fim[1], EASE.power2In);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, opacity: fim }}>
      <Background pool={0.14 + clarao * 0.6} redWash={clarao} grunge={0.34} />

      {clarao > 0 ? (
        <AbsoluteFill style={{ backgroundColor: COLORS.red, opacity: clarao * 0.9, mixBlendMode: 'screen' }} />
      ) : null}

      <Stage exposure={1.04} environmentIntensity={0.6} redBounce={0.6}>
        <CameraRig position={[0, 0, BASE_Z]} handheld={3} seed="drop" />
        <Lighting key={2.4} fill={0.18} rim={3} rimPosition={[-480, 220, -640]} top={2.6} ambient={0.08} />
        <LogoExtruded
          height={470 * marca}
          position={[0, HEIGHT * 0.11, 240]}
          rotation={[rad(-2), giro, 0]}
          finish={1}
          opacity={marca}
          exposure={1.15}
        />

        {drop > 0.001 ? (
          <Typography3D
            text={LABELS.drop}
            size={84}
            depth={34}
            tracking={0.16}
            position={[0, -HEIGHT * 0.075, dropZ]}
            // Uma inclinacao minima em X entrega a face superior da extrusao a
            // luz de cima. Sem ela a palavra leria como texto plano.
            rotation={[rad(-7), range(drop, [0, 1], [rad(-16), 0]), 0]}
            faceColor={COLORS.white}
            sideColor="#1A0605"
            opacity={Math.min(1, drop * 1.6)}
            // Motion blur so no trecho rapido da entrada.
            ghosts={dropVel > 0.06 ? 3 : 0}
            ghostOffset={[0, 0, -140 * dropVel]}
            ghostOpacity={0.16 * dropVel}
          />
        ) : null}
      </Stage>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: HEIGHT * 0.42,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 420,
            height: 1,
            background: COLORS.ashDim,
            transform: `scaleX(${regua.toFixed(4)})`,
          }}
        />

        <div
          style={{
            marginTop: 52,
            fontFamily: FONTS.display,
            fontSize: 104,
            letterSpacing: TRACKING.wide,
            color: COLORS.red,
            transform: `scale(${range(breve, [0, 1], [0.24, 1]).toFixed(4)})`,
            opacity: breve,
          }}
        >
          {BRAND.status}
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 26,
            alignItems: 'baseline',
            fontFamily: FONTS.grotesque,
            fontSize: 25,
            fontWeight: 600,
            letterSpacing: TRACKING.wider,
            textTransform: 'uppercase',
            color: COLORS.ash,
            opacity: contato,
            transform: `translateY(${((1 - contato) * 18).toFixed(1)}px)`,
          }}
        >
          <span>{BRAND.handle}</span>
          <span style={{ color: COLORS.ashDim }}>·</span>
          <span>{BRAND.site}</span>
        </div>

        {/* Nota de rodape da hierarquia: a menor tipografia do filme, e a
            unica informacao de escassez. Entra depois de tudo, quase junto do
            corte final — se entrasse antes, disputaria com EM BREVE. */}
        <div
          style={{
            marginTop: 30,
            display: 'flex',
            gap: 18,
            fontFamily: FONTS.grotesque,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: TRACKING.widest,
            textTransform: 'uppercase',
            color: COLORS.ash,
            opacity: contato * 0.62,
          }}
        >
          <span>{LABELS.limitado}</span>
          <span>{LABELS.numero}</span>
        </div>
      </AbsoluteFill>

      <FilmTreatment vignette={0.78} grain={0.042} />
    </AbsoluteFill>
  );
};
