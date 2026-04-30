const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Asignación familiar legal.
 * Base legal: Ley 25129 (12/06/1989), reglamento D.S. 035-90-TR.
 * Equivale al 10% de la RMV vigente, monto fijo independiente del número de hijos.
 * Aplicación a todos los regímenes de la actividad privada (general, MYPE, construcción civil, agrario).
 * Para construcción civil COEXISTE con la asignación escolar del convenio CAPECO-FTCCP
 * (ver módulo asignacion-escolar.ts), no la sustituye.
 * Confirmado por STC 02681-2023-AA y Casación 2630-2009-HUAURA.
 */
export function calcularAsignacionFamiliar(
  rmv: number,
  tieneHijos: boolean,
  esConstruccionCivil: boolean,
  cantidadHijos: number
): number {
  if (!tieneHijos) return 0;
  return round2(rmv * 0.10);
}
