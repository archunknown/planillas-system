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

export function calcularCts(input: CtsInput): CtsResult {
  const { remuneracionBase, asignacionFamiliar, promedioHorasExtras6Meses, sextoGratificacion, mesesComputablesCompletos, diasComputablesRestantes } = input;

  const remuneracionComputable = round2(remuneracionBase + asignacionFamiliar + promedioHorasExtras6Meses + sextoGratificacion);
  const montoPorMeses = round2((remuneracionComputable / 12) * mesesComputablesCompletos);
  const montoPorDias = round2((remuneracionComputable / 12 / 30) * diasComputablesRestantes);
  const total = round2(montoPorMeses + montoPorDias);

  return { remuneracionComputable, montoPorMeses, montoPorDias, total };
}
