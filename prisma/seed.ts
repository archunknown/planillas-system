import { config } from 'dotenv';
config();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface ParamSeed {
  codigo: string;
  descripcion: string;
  valor: number;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
}

async function upsertParametro(param: ParamSeed): Promise<void> {
  // Buscar si ya existe un registro con ese código y esa vigenciaDesde
  const existing = await prisma.parametroLegal.findFirst({
    where: { codigo: param.codigo, vigenciaDesde: param.vigenciaDesde },
  });

  if (existing) {
    await prisma.parametroLegal.update({
      where: { id: existing.id },
      data: {
        descripcion: param.descripcion,
        valor: param.valor,
        vigenciaHasta: param.vigenciaHasta ?? null,
      },
    });
  } else {
    await prisma.parametroLegal.create({
      data: {
        codigo: param.codigo,
        descripcion: param.descripcion,
        valor: param.valor,
        vigenciaDesde: param.vigenciaDesde,
        vigenciaHasta: param.vigenciaHasta ?? null,
      },
    });
  }
}

async function main(): Promise<void> {
  const desde2025    = new Date('2025-01-01T00:00:00.000Z');
  const desde2026    = new Date('2026-01-01T00:00:00.000Z');
  const desde2026Abr = new Date('2026-04-01T00:00:00.000Z');
  const hasta2026Mar = new Date('2026-03-31T00:00:00.000Z');
  const desde2021    = new Date('2021-01-01T00:00:00.000Z');
  const desde1996    = new Date('1996-01-01T00:00:00.000Z');
  const desde2002Jul = new Date('2002-07-04T00:00:00.000Z');
  const desde1991Nov = new Date('1991-11-05T00:00:00.000Z');
  const desde2013Dic = new Date('2013-12-28T00:00:00.000Z');
  const desde2015Jun = new Date('2015-06-24T00:00:00.000Z');

  const parametros: ParamSeed[] = [
    // =========================================================
    // Parámetros generales
    // =========================================================
    {
      codigo: 'RMV',
      descripcion: 'Remuneración Mínima Vital. D.S. 006-2024-TR, vigente desde 01/01/2025. Valor S/1130.',
      valor: 1130.00,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'UIT',
      descripcion: 'Unidad Impositiva Tributaria 2026. D.S. 301-2025-EF, publicado 15/12/2025, vigente desde 01/01/2026. Valor S/5500.',
      valor: 5500.00,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Pensiones
    // =========================================================
    {
      codigo: 'ONP_TASA',
      descripcion: 'Tasa de aporte al Sistema Nacional de Pensiones: 13% de remuneración asegurable. D.L. 19990 y modificatorias.',
      valor: 0.13,
      vigenciaDesde: desde2025,
    },

    // =========================================================
    // EsSalud
    // =========================================================
    {
      codigo: 'ESSALUD_GENERAL',
      descripcion: 'Tasa de aporte EsSalud régimen general: 9% de remuneración mensual, a cargo del empleador. Ley 26790 art. 6 modificado por Ley 28791.',
      valor: 0.09,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'SIS_MYPE_MICRO_CUOTA',
      descripcion: 'Cuota fija mensual al SIS por trabajador afiliado de microempresa. S/15. Ley 30056 y D.S. 013-2013-PRODUCE.',
      valor: 15.00,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'ESSALUD_AGRARIO_MENOR',
      descripcion: 'Tasa EsSalud régimen agrario, empresas con menos de 50 trabajadores: 6%. Ley 31110 art. 9.',
      valor: 0.06,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'ESSALUD_AGRARIO_MAYOR',
      descripcion: 'Tasa EsSalud régimen agrario, empresas con 50 o más trabajadores: 9%. Ley 31110 art. 9.',
      valor: 0.09,
      vigenciaDesde: desde2025,
    },

    // =========================================================
    // AFP Habitat
    // =========================================================
    {
      codigo: 'AFP_HABITAT_APORTE',
      descripcion: 'Aporte obligatorio al fondo AFP: 10% de remuneración asegurable. D.S. 054-97-EF (TUO Ley SPP).',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_HABITAT_COMISION',
      descripcion: 'Comisión sobre flujo AFP Habitat. Valor vigente según publicación bimestral SBS. Tope de aplicación: remuneración asegurable.',
      valor: 0.0147,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_HABITAT_PRIMA',
      descripcion: 'Prima de seguro de invalidez, sobrevivencia y gastos de sepelio AFP Habitat. Valor vigente según publicación bimestral SBS. SE APLICA CON TOPE DE REMUNERACIÓN MÁXIMA ASEGURABLE (ver parámetro RMA_AFP).',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Integra
    // =========================================================
    {
      codigo: 'AFP_INTEGRA_APORTE',
      descripcion: 'Aporte obligatorio al fondo AFP: 10% de remuneración asegurable. D.S. 054-97-EF (TUO Ley SPP).',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_INTEGRA_COMISION',
      descripcion: 'Comisión sobre flujo AFP Integra. Valor vigente según publicación bimestral SBS. Tope de aplicación: remuneración asegurable.',
      valor: 0.0155,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_INTEGRA_PRIMA',
      descripcion: 'Prima de seguro de invalidez, sobrevivencia y gastos de sepelio AFP Integra. Valor vigente según publicación bimestral SBS. SE APLICA CON TOPE DE REMUNERACIÓN MÁXIMA ASEGURABLE (ver parámetro RMA_AFP).',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Prima
    // =========================================================
    {
      codigo: 'AFP_PRIMA_APORTE',
      descripcion: 'Aporte obligatorio al fondo AFP: 10% de remuneración asegurable. D.S. 054-97-EF (TUO Ley SPP).',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PRIMA_COMISION',
      descripcion: 'Comisión sobre flujo AFP Prima. Valor vigente según publicación bimestral SBS. Tope de aplicación: remuneración asegurable.',
      valor: 0.0160,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PRIMA_PRIMA',
      descripcion: 'Prima de seguro de invalidez, sobrevivencia y gastos de sepelio AFP Prima. Valor vigente según publicación bimestral SBS. SE APLICA CON TOPE DE REMUNERACIÓN MÁXIMA ASEGURABLE (ver parámetro RMA_AFP).',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Profuturo
    // =========================================================
    {
      codigo: 'AFP_PROFUTURO_APORTE',
      descripcion: 'Aporte obligatorio al fondo AFP: 10% de remuneración asegurable. D.S. 054-97-EF (TUO Ley SPP).',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PROFUTURO_COMISION',
      descripcion: 'Comisión sobre flujo AFP Profuturo. Valor vigente según publicación bimestral SBS. Tope de aplicación: remuneración asegurable.',
      valor: 0.0169,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PROFUTURO_PRIMA',
      descripcion: 'Prima de seguro de invalidez, sobrevivencia y gastos de sepelio AFP Profuturo. Valor vigente según publicación bimestral SBS. SE APLICA CON TOPE DE REMUNERACIÓN MÁXIMA ASEGURABLE (ver parámetro RMA_AFP).',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Quinta categoría - tramos (límites en soles, usando UIT 2026 = 5500)
    // Los límites se almacenan en soles para evitar recalcularlos cada vez.
    // Se deben actualizar cuando cambie la UIT.
    // =========================================================
    {
      codigo: 'QUINTA_TRAMO_1_TASA',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 0.08,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_1_LIMITE',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 27500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_2_TASA',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 0.14,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_2_LIMITE',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 110000.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_3_TASA',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 0.17,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_3_LIMITE',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 192500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_4_TASA',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 0.20,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_4_LIMITE',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 247500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_5_TASA',
      descripcion: 'Tramo progresivo de impuesto a la renta de quinta categoría. D.S. 179-2004-EF art. 53 (TUO LIR).',
      valor: 0.30,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Remuneración Máxima Asegurable AFP
    // =========================================================
    {
      codigo: 'RMA_AFP',
      descripcion: 'Remuneración Máxima Asegurable para cálculo de prima de seguro AFP. Resolución SBS N° 1120-2026 (15/04/2026). Vigente trimestre abril-junio 2026. Actualización trimestral.',
      valor: 12598.91,
      vigenciaDesde: desde2026Abr,
    },
    {
      codigo: 'RMA_AFP',
      descripcion: 'Remuneración Máxima Asegurable. Trimestre enero-marzo 2026 (histórico).',
      valor: 12416.71,
      vigenciaDesde: desde2026,
      vigenciaHasta: hasta2026Mar,
    },

    // =========================================================
    // Construcción Civil - Jornales CAPECO-FTCCP 2026
    // =========================================================
    {
      codigo: 'JORNAL_CC_OPERARIO',
      descripcion: 'Jornal básico diario Operario. Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR).',
      valor: 89.30,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'JORNAL_CC_OFICIAL',
      descripcion: 'Jornal básico diario Oficial. Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR).',
      valor: 69.75,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'JORNAL_CC_PEON',
      descripcion: 'Jornal básico diario Peón. Convenio Colectivo CAPECO-FTCCP 2026 (R.M. 197-2025-TR).',
      valor: 62.80,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Construcción Civil - BUC (Bonificación Unificada de Construcción)
    // =========================================================
    {
      codigo: 'BUC_CC_OPERARIO',
      descripcion: 'BUC Operario: 32% sobre jornal básico. Resolución Directoral N° 155-94-DPSC y Convenio CAPECO-FTCCP.',
      valor: 0.32,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'BUC_CC_OFICIAL',
      descripcion: 'BUC Oficial: 30% sobre jornal básico. R.D. 155-94-DPSC y Convenio CAPECO-FTCCP.',
      valor: 0.30,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'BUC_CC_PEON',
      descripcion: 'BUC Peón: 30% sobre jornal básico. R.D. 155-94-DPSC y Convenio CAPECO-FTCCP.',
      valor: 0.30,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Construcción Civil - Movilidad
    // =========================================================
    {
      codigo: 'MOVILIDAD_CC_LABORABLE',
      descripcion: 'Bonificación por movilidad diaria, día laborable. Convenio CAPECO-FTCCP 2026. Concepto no remunerativo.',
      valor: 8.60,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'MOVILIDAD_CC_DOMINICAL',
      descripcion: 'Bonificación por movilidad diaria, domingo/feriado. Convenio CAPECO-FTCCP 2026. Concepto no remunerativo.',
      valor: 5.00,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Construcción Civil - Bonificaciones especiales
    // =========================================================
    {
      codigo: 'BONIF_ALTURA_CC',
      descripcion: 'Bonificación por trabajo en altura: 8% sobre jornal básico. Aplica a labores en exterior a partir del cuarto piso o diez metros. Convenio CAPECO-FTCCP 2026.',
      valor: 0.08,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'ASIG_ESCOLAR_CC_JORNALES_ANUAL',
      descripcion: 'Cantidad de jornales básicos anuales por hijo en edad escolar, régimen construcción civil. Convenio CAPECO-FTCCP 2026. Aplica a hijos en edad escolar y hasta 24 años si cursan estudios técnicos/universitarios.',
      valor: 30,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Régimen agrario - Ley 31110
    // =========================================================
    {
      codigo: 'AGRARIO_GRATIF_PRORRATEO',
      descripcion: 'Porcentaje de prorrateo de gratificación legal dentro de la remuneración diaria agraria. Ley 31110 art. 8, Reglamento D.S. 005-2021-MIDAGRI.',
      valor: 0.1666,
      vigenciaDesde: desde2021,
    },
    {
      codigo: 'AGRARIO_CTS_PRORRATEO',
      descripcion: 'Porcentaje de prorrateo de CTS dentro de la remuneración diaria agraria. Ley 31110 art. 8, Reglamento D.S. 005-2021-MIDAGRI.',
      valor: 0.0972,
      vigenciaDesde: desde2021,
    },
    {
      codigo: 'AGRARIO_BETA',
      descripcion: 'Bonificación Especial por Trabajo Agrario (BETA): 30% de la RMV. Carácter no remunerativo. Ley 31110.',
      valor: 0.30,
      vigenciaDesde: desde2021,
    },
    {
      codigo: 'AGRARIO_DIAS_VACACIONES',
      descripcion: 'Días calendario de vacaciones anuales para régimen agrario. Ley 31110 art. 3 literal g). Reemplaza los 15 días del derogado régimen de la Ley 27360.',
      valor: 30,
      vigenciaDesde: desde2021,
    },

    // =========================================================
    // Jornada tiempo parcial
    // =========================================================
    {
      codigo: 'JORNADA_TIEMPO_PARCIAL_MAX_HORAS_DIARIAS',
      descripcion: 'Umbral de horas diarias por debajo del cual se considera jornada parcial. D.S. 001-96-TR, Reglamento Ley de Fomento al Empleo. Relevante para piso RMV EsSalud y derechos proporcionales.',
      valor: 4,
      vigenciaDesde: desde1996,
    },

    // =========================================================
    // Horas extras - sobretasas
    // =========================================================
    {
      codigo: 'HE_SOBRETASA_PRIMERAS_DOS',
      descripcion: 'Sobretasa mínima de primeras dos horas extras diarias: 25%. D.S. 007-2002-TR art. 10 (TUO Ley de Jornada).',
      valor: 0.25,
      vigenciaDesde: desde2002Jul,
    },
    {
      codigo: 'HE_SOBRETASA_RESTO',
      descripcion: 'Sobretasa mínima a partir de la tercera hora extra diaria: 35%. D.S. 007-2002-TR art. 10.',
      valor: 0.35,
      vigenciaDesde: desde2002Jul,
    },
    {
      codigo: 'HE_UMBRAL_PRIMERAS_HORAS',
      descripcion: 'Número de primeras horas extras diarias con sobretasa reducida (25%). A partir de esa cantidad, aplica sobretasa 35%. D.S. 007-2002-TR art. 10.',
      valor: 2,
      vigenciaDesde: desde2002Jul,
    },
    {
      codigo: 'HE_SOBRETASA_DESCANSO_FERIADO',
      descripcion: 'Sobretasa por trabajo en día de descanso semanal o feriado no compensado: 100%. D.Leg. 713 art. 3.',
      valor: 1.00,
      vigenciaDesde: desde1991Nov,
    },

    // =========================================================
    // MYPE Pequeña empresa
    // =========================================================
    {
      codigo: 'MYPE_PEQUENA_GRATIF_FACTOR',
      descripcion: 'Factor aplicado a la gratificación de pequeña empresa: medio sueldo (50% de remuneración mensual). D.S. 013-2013-PRODUCE art. 41.',
      valor: 0.50,
      vigenciaDesde: desde2013Dic,
    },
    {
      codigo: 'MYPE_PEQUENA_CTS_DIAS_POR_ANIO',
      descripcion: 'Remuneraciones diarias de CTS por año completo en pequeña empresa. Tope acumulado 90 remuneraciones diarias. D.S. 013-2013-PRODUCE art. 42.',
      valor: 15,
      vigenciaDesde: desde2013Dic,
    },
    {
      codigo: 'MYPE_PEQUENA_CTS_TOPE_DIAS',
      descripcion: 'Tope acumulado de CTS en pequeña empresa: 90 remuneraciones diarias. D.S. 013-2013-PRODUCE art. 42.',
      valor: 90,
      vigenciaDesde: desde2013Dic,
    },

    // =========================================================
    // Bonificación extraordinaria gratificaciones (Ley 30334)
    // =========================================================
    {
      codigo: 'BONIF_EXTRAORDINARIA_ESSALUD',
      descripcion: 'Bonificación extraordinaria sobre gratificaciones legales: 9% equivalente al aporte EsSalud. Ley 30334 y D.S. 012-2016-TR.',
      valor: 0.09,
      vigenciaDesde: desde2015Jun,
    },
    {
      codigo: 'BONIF_EXTRAORDINARIA_EPS',
      descripcion: 'Bonificación extraordinaria sobre gratificaciones legales para afiliados a EPS: 6.75%. Ley 30334 y D.S. 012-2016-TR.',
      valor: 0.0675,
      vigenciaDesde: desde2015Jun,
    },
  ];

  console.log(`Insertando ${parametros.length} parámetros legales...`);

  for (const param of parametros) {
    await upsertParametro(param);
    console.log(`  ✓ ${param.codigo}`);
  }

  console.log('\nSeed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
