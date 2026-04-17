const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calcularAsignacionFamiliar(
  rmv: number,
  tieneHijos: boolean,
  esConstruccionCivil: boolean,
  cantidadHijos: number
): number {
  if (!tieneHijos) return 0;

  if (esConstruccionCivil) {
    return round2(rmv * 0.10 * cantidadHijos);
  }

  return round2(rmv * 0.10);
}
