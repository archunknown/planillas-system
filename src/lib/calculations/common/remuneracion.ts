const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calcularRemuneracionProporcional(
  remuneracionBase: number,
  diasTrabajados: number
): number {
  return round2((remuneracionBase / 30) * diasTrabajados);
}

export function calcularValorHora(
  remuneracionBase: number,
  jornadaSemanal: number
): number {
  return round2(remuneracionBase / 30 / (jornadaSemanal / 6));
}
