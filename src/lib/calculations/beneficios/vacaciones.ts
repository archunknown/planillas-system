const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface VacacionesInput {
  remuneracionBase: number;
  asignacionFamiliar: number;
  mesesComputables: number;
  diasComputables: number;
}

export interface VacacionesResult {
  montoPorMeses: number;
  montoPorDias: number;
  total: number;
}

export function calcularVacacionesTruncas(input: VacacionesInput): VacacionesResult {
  const { remuneracionBase, asignacionFamiliar, mesesComputables, diasComputables } = input;

  const remuneracionVacacional = round2(remuneracionBase + asignacionFamiliar);
  const montoPorMeses = round2((remuneracionVacacional / 12) * mesesComputables);
  const montoPorDias = round2((remuneracionVacacional / 12 / 30) * diasComputables);
  const total = round2(montoPorMeses + montoPorDias);

  return { montoPorMeses, montoPorDias, total };
}
