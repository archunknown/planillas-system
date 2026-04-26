import { calcularAsignacionFamiliar } from '../common';
import { calcularDescuentoOnp, calcularDescuentoAfp, calcularRetencionQuinta } from '../descuentos';
import type { DatosPeriodoInput, ResultadoPlanilla, ConfigRegimen } from './types';

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const configConstruccionCivil: ConfigRegimen = {
  tieneGratificaciones: true,
  tieneCts: true,
  diasVacaciones: 30,
  tasaEssalud: 0.09,
  asignacionFamiliarObligatoria: true,
};

export interface DatosCCExtra {
  jornalDiario: number;
  categoriaCC: 'OPERARIO' | 'OFICIAL' | 'PEON';
  diasTrabajados: number;
  porcentajeBuc: number;
  movilidadDiaria: number;
  trabajaEnAltura: boolean;
  porcentajeBonifAltura?: number;
}

export function calcularPlanillaCC(datos: DatosPeriodoInput, datosCC: DatosCCExtra): ResultadoPlanilla {
  const remuneracionBasica = round2(datosCC.jornalDiario * datosCC.diasTrabajados);
  const bonificacionCC = round2(datosCC.jornalDiario * datosCC.porcentajeBuc * datosCC.diasTrabajados);
  const movilidadCC = round2(datosCC.movilidadDiaria * datosCC.diasTrabajados);
  /**
   * Bonificación por trabajo en altura: 8% sobre jornal básico.
   * Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR).
   * Aplica a labores en exterior a partir del cuarto piso o diez metros.
   * Default actualizado el 24/04/2026 (auditoría legal). Históricamente fue 7%.
   */
  const bonificacionAltura = datosCC.trabajaEnAltura
    ? round2(datosCC.jornalDiario * (datosCC.porcentajeBonifAltura ?? 0.08) * datosCC.diasTrabajados)
    : 0;
  const asignacionFamiliar = calcularAsignacionFamiliar(datos.rmv, datos.tieneAsignacionFamiliar, true, datos.cantidadHijos);

  const totalIngresos = round2(remuneracionBasica + bonificacionCC + movilidadCC + bonificacionAltura + asignacionFamiliar);
  const remuneracionBruta = round2(remuneracionBasica + bonificacionCC + asignacionFamiliar);

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

  const essalud = round2(remuneracionBruta * (datos.tasaEssaludGeneral ?? 0.09));
  const sctr = round2(remuneracionBruta * datos.tasaSctr);
  const totalAportesEmpleador = round2(essalud + sctr);

  const netoPagar = Math.max(0, round2(totalIngresos - totalDescuentos));

  return {
    ingresos: { remuneracionBasica, horasExtrasTotal: 0, asignacionFamiliar, bonificacionCC, movilidadCC, bonificacionAltura, otrosIngresos: 0, totalIngresos },
    descuentos: { descuentoOnp, descuentoAfp, comisionAfp, primaSeguroAfp, retencionQuinta, otrosDescuentos: 0, totalDescuentos },
    aportesEmpleador: { essalud, sctr, totalAportesEmpleador },
    netoPagar,
  };
}
