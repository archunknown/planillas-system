const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Cálculo de gratificación legal (Fiestas Patrias / Navidad) más bonificación extraordinaria.
 *
 * Base legal:
 *   - Ley 27735 (28/05/2002) — Ley de gratificaciones.
 *   - D.S. 005-2002-TR (04/07/2002) — Reglamento.
 *   - D.S. 017-2002-TR (05/12/2002) — Modifica art. 3.4: proporcionalidad por días a 1/30.
 *   - Ley 30334 (24/06/2015) y D.S. 012-2016-TR — Bonificación extraordinaria inafecta.
 *
 * Fórmula: (rem/6) × meses + (rem/180) × días + bonificación.
 * Donde 180 = 6 meses × 30 días.
 */
export interface GratificacionInput {
  remuneracionBase: number;
  asignacionFamiliar: number;
  mesesComputables: number;
  diasComputables?: number;
  tasaEssalud: number;
}

export interface GratificacionResult {
  gratificacionBase: number;
  bonificacionExtraordinaria: number;
  total: number;
}

export function calcularGratificacion(input: GratificacionInput): GratificacionResult {
  const { remuneracionBase, asignacionFamiliar, mesesComputables, diasComputables, tasaEssalud } = input;

  const remComputable = remuneracionBase + asignacionFamiliar;
  const gratificacionPorMeses = (remComputable / 6) * mesesComputables;
  const gratificacionPorDias = (remComputable / 180) * (diasComputables ?? 0);
  const gratificacionBase = round2(gratificacionPorMeses + gratificacionPorDias);
  const bonificacionExtraordinaria = round2(gratificacionBase * tasaEssalud);
  const total = round2(gratificacionBase + bonificacionExtraordinaria);

  return { gratificacionBase, bonificacionExtraordinaria, total };
}
