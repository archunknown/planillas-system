const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface AfpTasas {
  aporte: number;
  comision: number;
  primaSeguro: number;
}

export interface AfpResult {
  aporte: number;
  comision: number;
  primaSeguro: number;
  total: number;
}

export function calcularDescuentoAfp(
  remuneracionBruta: number,
  tasas: AfpTasas
): AfpResult {
  const aporte = round2(remuneracionBruta * tasas.aporte);
  const comision = round2(remuneracionBruta * tasas.comision);
  const primaSeguro = round2(remuneracionBruta * tasas.primaSeguro);
  const total = round2(aporte + comision + primaSeguro);
  return { aporte, comision, primaSeguro, total };
}
