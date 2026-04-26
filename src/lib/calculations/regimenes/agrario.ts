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

export function calcularPlanillaAgrario(datos: DatosPeriodoInput, remuneracionDiariaAgraria: number, tasaEssaludAgrario?: number): ResultadoPlanilla {
  const remuneracionBasica = round2(remuneracionDiariaAgraria * datos.diasTrabajados);
  const asignacionFamiliar = calcularAsignacionFamiliar(datos.rmv, datos.tieneAsignacionFamiliar, false, datos.cantidadHijos);

  const totalIngresos = round2(remuneracionBasica + asignacionFamiliar);
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

  // Ley 31110 Art.9: tasa condicional según tamaño de empresa
  const essalud = round2(remuneracionBruta * (tasaEssaludAgrario ?? datos.tasaEssalud));
  const sctr = 0;
  const totalAportesEmpleador = round2(essalud + sctr);

  const netoPagar = Math.max(0, round2(totalIngresos - totalDescuentos));

  return {
    ingresos: { remuneracionBasica, horasExtrasTotal: 0, asignacionFamiliar, bonificacionCC: 0, movilidadCC: 0, bonificacionAltura: 0, otrosIngresos: 0, totalIngresos },
    descuentos: { descuentoOnp, descuentoAfp, comisionAfp, primaSeguroAfp, retencionQuinta, otrosDescuentos: 0, totalDescuentos },
    aportesEmpleador: { essalud, sctr, totalAportesEmpleador },
    netoPagar,
  };
}
