const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface LiquidacionInput {
  ctsTrunca: number;
  gratificacionTrunca: number;
  vacacionesTruncas: number;
  remuneracionPendiente: number;
  descuentos: number;
}

export interface LiquidacionResult {
  totalBruto: number;
  descuentos: number;
  totalNeto: number;
}

export function calcularLiquidacion(input: LiquidacionInput): LiquidacionResult {
  const { ctsTrunca, gratificacionTrunca, vacacionesTruncas, remuneracionPendiente, descuentos } = input;

  const totalBruto = round2(ctsTrunca + gratificacionTrunca + vacacionesTruncas + remuneracionPendiente);
  const totalNeto = Math.max(0, round2(totalBruto - descuentos));

  return { totalBruto, descuentos: round2(descuentos), totalNeto };
}
