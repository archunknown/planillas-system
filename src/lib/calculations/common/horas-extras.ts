const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface HorasExtrasTasas {
  sobretasaPrimeras?: number;
  sobretasaResto?: number;
  sobretasaDescansoFeriado?: number;
}

export interface HorasExtrasResult {
  monto25: number;
  monto35: number;
  monto100: number;
  total: number;
}

/**
 * Clasifica el total de horas extras diarias en sobretasas según orden temporal.
 * Base legal: D.S. 007-2002-TR (TUO Ley de Jornada), art. 10.
 * Las primeras 2 horas se pagan con recargo de 25%; a partir de la tercera, 35%.
 *
 * @param totalHorasExtrasDelDia Total de horas extras trabajadas en un mismo día
 * @param umbralPrimerasHoras Cantidad de horas con sobretasa reducida (default 2)
 */
export function clasificarHorasExtras(
  totalHorasExtrasDelDia: number,
  umbralPrimerasHoras: number = 2
): { horas25: number; horas35: number } {
  if (totalHorasExtrasDelDia <= 0) {
    return { horas25: 0, horas35: 0 };
  }
  if (totalHorasExtrasDelDia <= umbralPrimerasHoras) {
    return { horas25: totalHorasExtrasDelDia, horas35: 0 };
  }
  return {
    horas25: umbralPrimerasHoras,
    horas35: totalHorasExtrasDelDia - umbralPrimerasHoras,
  };
}

export function calcularHorasExtras(
  valorHora: number,
  horas25: number,
  horas35: number,
  horas100: number,
  tasas?: HorasExtrasTasas
): HorasExtrasResult {
  const factor25 = 1 + (tasas?.sobretasaPrimeras ?? 0.25);
  const factor35 = 1 + (tasas?.sobretasaResto ?? 0.35);
  const factor100 = 1 + (tasas?.sobretasaDescansoFeriado ?? 1.00);
  const monto25 = round2(valorHora * factor25 * horas25);
  const monto35 = round2(valorHora * factor35 * horas35);
  const monto100 = round2(valorHora * factor100 * horas100);
  const total = round2(monto25 + monto35 + monto100);
  return { monto25, monto35, monto100, total };
}
