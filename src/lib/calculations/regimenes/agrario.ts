import { calcularAsignacionFamiliar } from '../common';
import { calcularDescuentoOnp, calcularDescuentoAfp, calcularRetencionQuinta } from '../descuentos';
import type { DatosPeriodoInput, ResultadoPlanilla, ConfigRegimen } from './types';

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Vacaciones agrarias: 30 días calendario por año de servicio.
 * Base legal: Ley 31110 art. 3 literal g), vigente desde 01/01/2021.
 * Derogó el régimen anterior de la Ley 27360 que otorgaba 15 días.
 */
export const configAgrario: ConfigRegimen = {
  tieneGratificaciones: false,
  tieneCts: false,
  diasVacaciones: 30,
  tasaEssalud: 0.06,
  asignacionFamiliarObligatoria: true,
};

/**
 * Remuneración diaria régimen agrario.
 * Base legal: Ley 31110 art. 8, D.S. 005-2021-MIDAGRI.
 *
 * Por defecto (modoPago='PRORRATEADO'), la RD integra prorrateadas la gratificación
 * legal (16.66%) y la CTS (9.72%) sobre la remuneración básica diaria.
 * El trabajador puede optar por escrito por el pago semestral (modoPago='SEMESTRAL').
 *
 * Porcentajes derivados:
 * - Gratificación: 2 sueldos al año / 12 meses = 16.66%
 * - CTS: ~1.166 sueldos al año / 12 meses ≈ 9.72%
 */
export function calcularPlanillaAgrario(
  datos: DatosPeriodoInput,
  remuneracionDiariaAgraria: number,
  tasaEssaludAgrario?: number
): ResultadoPlanilla {
  const rb = round2(remuneracionDiariaAgraria * datos.diasTrabajados);
  const modoPago = datos.agrario?.modoPago ?? 'PRORRATEADO';

  const gratProrrateada = modoPago === 'PRORRATEADO'
    ? round2(rb * (datos.agrario?.porcentajeGratifProrrateo ?? 0.1666))
    : 0;
  const ctsProrrateada = modoPago === 'PRORRATEADO'
    ? round2(rb * (datos.agrario?.porcentajeCtsProrrateo ?? 0.0972))
    : 0;

  const remuneracionBasica = round2(rb + gratProrrateada + ctsProrrateada);
  const asignacionFamiliar = calcularAsignacionFamiliar(datos.rmv, datos.tieneAsignacionFamiliar, false, datos.cantidadHijos);

  /**
   * Bonificación Especial por Trabajo Agrario (BETA).
   * Base legal: Ley 31110 art. 8 inc. 2.
   * Equivale al 30% de la RMV mensual (proporcional a días trabajados).
   * Carácter NO remunerativo: no integra base imponible para EsSalud ni aportes pensionarios.
   */
  const beta = datos.recibeBETA === true
    ? round2(datos.rmv * 0.30 * (datos.diasTrabajados / 30))
    : 0;

  // remuneracionBruta: base imponible para EsSalud y pensiones (sin BETA — no remunerativo)
  const remuneracionBruta = round2(remuneracionBasica + asignacionFamiliar);
  // totalIngresos: lo que recibe el trabajador (incluye BETA)
  const totalIngresos = round2(remuneracionBruta + beta);

  let descuentoOnp = 0;
  let descuentoAfp = 0;
  let comisionAfp = 0;
  let primaSeguroAfp = 0;

  if (datos.sistemaPensionario === 'ONP') {
    descuentoOnp = calcularDescuentoOnp(remuneracionBruta);
  } else if (datos.sistemaPensionario === 'AFP' && datos.afpTasas !== null) {
    const afpResult = calcularDescuentoAfp(remuneracionBruta, datos.afpTasas);
    descuentoAfp = afpResult.aporte;
    comisionAfp = afpResult.comision;
    primaSeguroAfp = afpResult.primaSeguro;
  }

  const { retencionMensual: retencionQuinta } = calcularRetencionQuinta({
    remuneracionMensual: datos.remuneracionMensualProyectada,
    gratificacionesAnuales: datos.gratificacionesAnualesProyectadas,
    mesActual: datos.mesActual,
    retencionesAnteriores: datos.retencionesQuintaAnteriores,
    uit: datos.uit,
  });

  const totalDescuentos = round2(descuentoOnp + descuentoAfp + comisionAfp + primaSeguroAfp + retencionQuinta);

  // Ley 31110 Art.9: tasa condicional según tamaño de empresa
  const essalud = round2(remuneracionBruta * (tasaEssaludAgrario ?? datos.tasaEssalud));
  const sctr = 0;
  const totalAportesEmpleador = round2(essalud + sctr);

  const netoPagar = Math.max(0, round2(totalIngresos - totalDescuentos));

  return {
    ingresos: { remuneracionBasica, horasExtrasTotal: 0, asignacionFamiliar, bonificacionCC: 0, movilidadCC: 0, bonificacionAltura: 0, bonificacionAgraria: beta, otrosIngresos: 0, totalIngresos },
    descuentos: { descuentoOnp, descuentoAfp, comisionAfp, primaSeguroAfp, retencionQuinta, otrosDescuentos: 0, totalDescuentos },
    aportesEmpleador: { essalud, sctr, totalAportesEmpleador },
    netoPagar,
  };
}
