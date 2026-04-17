const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calcularDescuentoOnp(remuneracionBruta: number): number {
  return round2(remuneracionBruta * 0.13);
}
