const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface CtsInput {
  remuneracionBase: number;
  asignacionFamiliar: number;
  promedioHorasExtras6Meses: number;
  sextoGratificacion: number;
  mesesComputablesCompletos: number;
  diasComputablesRestantes: number;
}

export interface CtsResult {
  remuneracionComputable: number;
  montoPorMeses: number;
  montoPorDias: number;
  total: number;
}

/**
 * CTS para régimen Pequeña Empresa (Ley MYPE).
 * Base legal: D.S. 013-2013-PRODUCE art. 42, D.S. 008-2008-TR.
 *
 * Fórmula: 15 remuneraciones diarias por año completo de servicios.
 * Para períodos parciales: (ctsAnual/12) × meses + (ctsAnual/360) × días.
 * El tope acumulado de 90 remuneraciones diarias se gestiona a nivel de servicio.
 *
 * Reutiliza CtsInput ya que los campos son idénticos al régimen general.
 */
export function calcularCtsPequenaEmpresa(input: CtsInput): number {
  const { remuneracionBase, asignacionFamiliar, promedioHorasExtras6Meses, sextoGratificacion, mesesComputablesCompletos, diasComputablesRestantes } = input;

  const remuneracionComputable = round2(remuneracionBase + asignacionFamiliar + promedioHorasExtras6Meses + sextoGratificacion);
  const ctsAnualCompleta = (remuneracionComputable / 30) * 15;

  const montoPorMeses = (ctsAnualCompleta / 12) * mesesComputablesCompletos;
  const montoPorDias = (ctsAnualCompleta / 360) * diasComputablesRestantes;

  return round2(montoPorMeses + montoPorDias);
}

export function calcularCts(input: CtsInput): CtsResult {
  const { remuneracionBase, asignacionFamiliar, promedioHorasExtras6Meses, sextoGratificacion, mesesComputablesCompletos, diasComputablesRestantes } = input;

  const remuneracionComputable = round2(remuneracionBase + asignacionFamiliar + promedioHorasExtras6Meses + sextoGratificacion);
  const montoPorMeses = round2((remuneracionComputable / 12) * mesesComputablesCompletos);
  const montoPorDias = round2((remuneracionComputable / 12 / 30) * diasComputablesRestantes);
  const total = round2(montoPorMeses + montoPorDias);

  return { remuneracionComputable, montoPorMeses, montoPorDias, total };
}
