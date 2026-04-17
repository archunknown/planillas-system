export * from './common';
export * from './descuentos';
export * from './beneficios';
export * from './regimenes';

import {
  calcularPlanillaGeneral,
  calcularPlanillaMype,
  calcularPlanillaCC,
  calcularPlanillaAgrario,
  configGeneral,
  configMypeMicro,
  configMypePequena,
  configConstruccionCivil,
  configAgrario,
} from './regimenes';
import type { DatosPeriodoInput, ResultadoPlanilla, ConfigRegimen } from './regimenes/types';

export type RegimenType =
  | 'GENERAL'
  | 'MYPE_MICRO'
  | 'MYPE_PEQUENA'
  | 'CONSTRUCCION_CIVIL'
  | 'AGRARIO';

export interface DatosConstruccionCivil {
  jornalDiario: number;
  categoriaCC: 'OPERARIO' | 'OFICIAL' | 'PEON';
  porcentajeBuc: number;
  movilidadDiaria: number;
  trabajaEnAltura: boolean;
}

export interface CalcularPlanillaInput {
  regimen: RegimenType;
  datos: DatosPeriodoInput;
  datosConstruccionCivil?: DatosConstruccionCivil;
  remuneracionDiariaAgraria?: number;
}

export function calcularPlanilla(input: CalcularPlanillaInput): ResultadoPlanilla {
  const { regimen, datos, datosConstruccionCivil, remuneracionDiariaAgraria } = input;

  switch (regimen) {
    case 'GENERAL':
      return calcularPlanillaGeneral(datos);

    case 'MYPE_MICRO':
      return calcularPlanillaMype(datos, true);

    case 'MYPE_PEQUENA':
      return calcularPlanillaMype(datos, false);

    case 'CONSTRUCCION_CIVIL': {
      if (datosConstruccionCivil === undefined) {
        throw new Error('datosConstruccionCivil es requerido para el régimen CONSTRUCCION_CIVIL');
      }
      return calcularPlanillaCC(datos, {
        ...datosConstruccionCivil,
        diasTrabajados: datos.diasTrabajados,
      });
    }

    case 'AGRARIO': {
      if (remuneracionDiariaAgraria === undefined) {
        throw new Error('remuneracionDiariaAgraria es requerido para el régimen AGRARIO');
      }
      return calcularPlanillaAgrario(datos, remuneracionDiariaAgraria);
    }
  }
}

export function obtenerConfigRegimen(regimen: RegimenType): ConfigRegimen {
  switch (regimen) {
    case 'GENERAL':         return configGeneral;
    case 'MYPE_MICRO':      return configMypeMicro;
    case 'MYPE_PEQUENA':    return configMypePequena;
    case 'CONSTRUCCION_CIVIL': return configConstruccionCivil;
    case 'AGRARIO':         return configAgrario;
  }
}
