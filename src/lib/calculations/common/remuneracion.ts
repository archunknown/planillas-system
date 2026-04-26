const round2 = (value: number): number => Math.round(value * 100) / 100;

export function calcularRemuneracionProporcional(
  remuneracionBase: number,
  diasTrabajados: number
): number {
  return round2((remuneracionBase / 30) * diasTrabajados);
}

/**
 * Calcula el valor hora ordinario.
 * Base legal: D.S. 007-2002-TR art. 11 (TUO Ley de Jornada).
 * Fórmula: (Remuneración mensual / 30) / horas diarias habituales.
 *
 * @param remuneracionBase Remuneración mensual
 * @param horasDiariasHabituales Horas diarias trabajadas habitualmente (NO horas semanales)
 */
export function calcularValorHora(
  remuneracionBase: number,
  horasDiariasHabituales: number
): number {
  return round2((remuneracionBase / 30) / horasDiariasHabituales);
}
