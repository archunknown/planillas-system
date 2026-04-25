const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calcularDescuentoOnp(remuneracionBruta: number, tasa = 0.13): number {
  return round2(remuneracionBruta * tasa);
}
