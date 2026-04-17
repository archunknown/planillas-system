const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface HorasExtrasResult {
  monto25: number;
  monto35: number;
  monto100: number;
  total: number;
}

export function calcularHorasExtras(
  valorHora: number,
  horas25: number,
  horas35: number,
  horas100: number
): HorasExtrasResult {
  const monto25 = round2(valorHora * 1.25 * horas25);
  const monto35 = round2(valorHora * 1.35 * horas35);
  const monto100 = round2(valorHora * 2.0 * horas100);
  const total = round2(monto25 + monto35 + monto100);
  return { monto25, monto35, monto100, total };
}
