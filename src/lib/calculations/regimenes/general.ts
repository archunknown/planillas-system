import { calcularRemuneracionProporcional, calcularValorHora, calcularHorasExtras, calcularAsignacionFamiliar } from '../common';
import { calcularDescuentoOnp, calcularDescuentoAfp, calcularRetencionQuinta } from '../descuentos';
import type { DatosPeriodoInput, ResultadoPlanilla, ConfigRegimen } from './types';

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const configGeneral: ConfigRegimen = {
  tieneGratificaciones: true,
  tieneCts: true,
  diasVacaciones: 30,
  tasaEssalud: 0.09,
  asignacionFamiliarObligatoria: true,
};

export function calcularPlanillaGeneral(datos: DatosPeriodoInput): ResultadoPlanilla {
  const remuneracionBasica = calcularRemuneracionProporcional(datos.remuneracionBase, datos.diasTrabajados);
  const valorHora = calcularValorHora(datos.remuneracionBase, datos.horasDiariasJornada ?? 8);
  const { total: horasExtrasTotal } = calcularHorasExtras(valorHora, datos.horasExtras25, datos.horasExtras35, datos.horasExtras100);
  const asignacionFamiliar = calcularAsignacionFamiliar(datos.rmv, datos.tieneAsignacionFamiliar, false, datos.cantidadHijos);

  const totalIngresos = round2(remuneracionBasica + horasExtrasTotal + asignacionFamiliar);
  const remuneracionBruta = totalIngresos;

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

  /**
   * Base imponible mínima EsSalud: no inferior a 1 RMV (proporcional a días trabajados).
   * Base legal: Ley 26790 art. 6 modificado por Ley 28791.
   * Excepción: trabajadores a tiempo parcial (< 4h/día) cotizan sobre remuneración real
   * sin piso, según D.S. 001-96-TR Reglamento Ley de Fomento al Empleo.
   */
  const baseEsSalud = datos.esTiempoParcial
    ? remuneracionBruta
    : Math.max(remuneracionBruta, round2(datos.rmv * datos.diasTrabajados / 30));
  const essalud = round2(baseEsSalud * (datos.tasaEssaludGeneral ?? 0.09));
  const sctr = 0;
  const totalAportesEmpleador = round2(essalud + sctr);

  const netoPagar = Math.max(0, round2(totalIngresos - totalDescuentos));

  return {
    ingresos: { remuneracionBasica, horasExtrasTotal, asignacionFamiliar, bonificacionCC: 0, movilidadCC: 0, bonificacionAltura: 0, otrosIngresos: 0, totalIngresos },
    descuentos: { descuentoOnp, descuentoAfp, comisionAfp, primaSeguroAfp, retencionQuinta, otrosDescuentos: 0, totalDescuentos },
    aportesEmpleador: { essalud, sctr, totalAportesEmpleador },
    netoPagar,
  };
}
