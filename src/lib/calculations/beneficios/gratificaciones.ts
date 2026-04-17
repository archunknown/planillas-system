const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface GratificacionInput {
  remuneracionBase: number;
  asignacionFamiliar: number;
  mesesComputables: number;
  tasaEssalud: number;
}

export interface GratificacionResult {
  gratificacionBase: number;
  bonificacionExtraordinaria: number;
  total: number;
}

export function calcularGratificacion(input: GratificacionInput): GratificacionResult {
  const { remuneracionBase, asignacionFamiliar, mesesComputables, tasaEssalud } = input;

  const gratificacionBase = round2(((remuneracionBase + asignacionFamiliar) / 6) * mesesComputables);
  const bonificacionExtraordinaria = round2(gratificacionBase * tasaEssalud);
  const total = round2(gratificacionBase + bonificacionExtraordinaria);

  return { gratificacionBase, bonificacionExtraordinaria, total };
}
