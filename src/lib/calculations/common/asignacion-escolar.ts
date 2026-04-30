const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Asignación escolar para trabajadores de construcción civil.
 * Base legal: Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR).
 *
 * Beneficio: 30 jornales básicos al año por cada hijo en edad escolar.
 * Incluye hijos en estudios técnicos/universitarios hasta los 24 años.
 * Carácter NO remunerativo: no afecta aportes pensionarios ni de salud.
 *
 * Modalidades de pago soportadas:
 * - 'ANUAL': pago único al inicio del año escolar (típicamente marzo).
 * - 'PRORRATEO_MENSUAL': prorrateo en cada planilla mensual (monto/12).
 *
 * El módulo es agnóstico al régimen. La decisión de invocar solo para trabajadores
 * de construcción civil corresponde al servicio que orquesta el cálculo.
 * El llamador debe pasar `cantidadHijosEnEdadEscolar` ya validado contra los
 * criterios de elegibilidad. El módulo no valida la elegibilidad.
 */
export type ModalidadAsignacionEscolar = 'ANUAL' | 'PRORRATEO_MENSUAL';

export interface AsignacionEscolarInput {
  jornalBasicoDiario: number;
  cantidadHijosEnEdadEscolar: number;
  modalidad: ModalidadAsignacionEscolar;
  jornalesPorHijoAnual?: number;
}

export interface AsignacionEscolarResult {
  montoTotal: number;
  montoAnualEquivalente: number;
  modalidad: ModalidadAsignacionEscolar;
}

export function calcularAsignacionEscolar(
  input: AsignacionEscolarInput
): AsignacionEscolarResult {
  const jornales = input.jornalesPorHijoAnual ?? 30;
  const montoAnual = round2(input.jornalBasicoDiario * jornales * input.cantidadHijosEnEdadEscolar);

  const montoTotal = input.modalidad === 'ANUAL'
    ? montoAnual
    : round2(montoAnual / 12);

  return {
    montoTotal,
    montoAnualEquivalente: montoAnual,
    modalidad: input.modalidad,
  };
}
