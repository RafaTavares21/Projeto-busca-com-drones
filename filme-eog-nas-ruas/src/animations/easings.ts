import { CustomEase } from 'gsap/CustomEase';
import { gsap } from 'gsap';

gsap.registerPlugin(CustomEase);

/**
 * Curvas de easing.
 *
 * O GSAP entra aqui como biblioteca de curvas, nunca como motor de animacao:
 * `gsap.parseEase` devolve uma funcao pura (t: 0..1) => 0..1, totalmente
 * deterministica. O ticker do GSAP — que e baseado em tempo real e dessincroniza
 * do render frame a frame — jamais e usado.
 */
type Ease = (t: number) => number;

const parse = (id: string): Ease => {
  const fn = gsap.parseEase(id);
  if (typeof fn !== 'function') {
    throw new Error(`Easing desconhecido: ${id}`);
  }
  return fn as Ease;
};

/** Curvas autorais, desenhadas para o ritmo deste comercial. */
CustomEase.create('nbaImpact', 'M0,0 C0.02,0.62 0.06,0.98 0.24,0.995 0.52,1.02 0.74,1 1,1');
CustomEase.create('nbaGlide', 'M0,0 C0.16,0.02 0.1,1 1,1');
CustomEase.create('nbaSnap', 'M0,0 C0.3,0 0.06,1.02 0.52,1.005 0.78,0.995 0.86,1 1,1');
CustomEase.create('nbaEditorial', 'M0,0 C0.25,0.1 0.25,1 1,1');

export const EASE = {
  /** Saida quase instantanea com assentamento longo — o corte de camera do comercial. */
  impact: parse('nbaImpact'),
  /** Entrada lenta, saida longa. Para movimentos de camera. */
  glide: parse('nbaGlide'),
  /** Chegada seca, com um micro-overshoot. Containers e HUD. */
  snap: parse('nbaSnap'),
  /** Curva sobria para tipografia editorial. */
  editorial: parse('nbaEditorial'),

  linear: parse('none'),
  expoOut: parse('expo.out'),
  expoIn: parse('expo.in'),
  expoInOut: parse('expo.inOut'),
  power2In: parse('power2.in'),
  power2Out: parse('power2.out'),
  power3In: parse('power3.in'),
  power3Out: parse('power3.out'),
  power4Out: parse('power4.out'),
  power4In: parse('power4.in'),
  power4InOut: parse('power4.inOut'),
  circOut: parse('circ.out'),
  backOut: parse('back.out(1.7)'),
  quintOut: parse('quint.out'),
  sineInOut: parse('sine.inOut'),
} as const;

export type EaseName = keyof typeof EASE;
