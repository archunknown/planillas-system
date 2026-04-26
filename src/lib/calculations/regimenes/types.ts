export interface DatosPeriodoInput {
  remuneracionBase: number;
  diasTrabajados: number;
  horasExtras25: number;
  horasExtras35: number;
  horasExtras100: number;
  faltas: number;
  feriados: number;
  jornadaSemanal: number;
  tieneAsignacionFamiliar: boolean;
  cantidadHijos: number;
  rmv: number;
  uit: number;
  sistemaPensionario: 'ONP' | 'AFP';
  afpTasas: { aporte: number; comision: number; primaSeguro: number } | null;
  remuneracionMensualProyectada: number;
  gratificacionesAnualesProyectadas: number;
  mesActual: number;
  retencionesQuintaAnteriores: number;
  tasaEssalud: number;
  tasaSctr: number;
  tasaEssaludGeneral?: number;
  esTiempoParcial?: boolean;
  horasDiariasJornada?: number;
}

export interface ResultadoPlanilla {
  ingresos: {
    remuneracionBasica: number;
    horasExtrasTotal: number;
    asignacionFamiliar: number;
    bonificacionCC: number;
    movilidadCC: number;
    bonificacionAltura: number;
    otrosIngresos: number;
    totalIngresos: number;
  };
  descuentos: {
    descuentoOnp: number;
    descuentoAfp: number;
    comisionAfp: number;
    primaSeguroAfp: number;
    retencionQuinta: number;
    otrosDescuentos: number;
    totalDescuentos: number;
  };
  aportesEmpleador: {
    essalud: number;
    sctr: number;
    totalAportesEmpleador: number;
  };
  netoPagar: number;
}

export interface ConfigRegimen {
  tieneGratificaciones: boolean;
  tieneCts: boolean;
  diasVacaciones: number;
  tasaEssalud: number;
  asignacionFamiliarObligatoria: boolean;
}
