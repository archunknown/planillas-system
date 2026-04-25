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
  tasas: AfpTasas,
  rma?: number
): AfpResult {
  const aporte = round2(remuneracionBruta * tasas.aporte);
  const comision = round2(remuneracionBruta * tasas.comision);
  const baseSeguro = rma !== undefined ? Math.min(remuneracionBruta, rma) : remuneracionBruta;
  const primaSeguro = round2(baseSeguro * tasas.primaSeguro);
  const total = round2(aporte + comision + primaSeguro);
  return { aporte, comision, primaSeguro, total };
}
