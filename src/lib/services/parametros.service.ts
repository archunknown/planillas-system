import { prisma } from '@/lib/prisma';
import type { TramoQuinta } from '@/lib/calculations/descuentos/quinta-categoria';

export async function getParametroVigente(codigo: string, fecha: Date = new Date()): Promise<number> {
  const parametro = await prisma.parametroLegal.findFirst({
    where: {
      codigo,
      vigenciaDesde: { lte: fecha },
      OR: [
        { vigenciaHasta: null },
        { vigenciaHasta: { gte: fecha } },
      ],
    },
    orderBy: { vigenciaDesde: 'desc' },
  });

  if (!parametro) {
    throw new Error(`Parámetro legal no encontrado: ${codigo} (fecha: ${fecha.toISOString()})`);
  }

  return parametro.valor.toNumber();
}

export async function getAfpTasas(
  afpNombre: string,
  fecha: Date = new Date()
): Promise<{ aporte: number; comision: number; primaSeguro: number }> {
  const nombre = afpNombre.toUpperCase();
  const [aporte, comision, primaSeguro] = await Promise.all([
    getParametroVigente(`AFP_${nombre}_APORTE`, fecha),
    getParametroVigente(`AFP_${nombre}_COMISION`, fecha),
    getParametroVigente(`AFP_${nombre}_PRIMA`, fecha),
  ]);

  return { aporte, comision, primaSeguro };
}

// ─── Generales ────────────────────────────────────────────────────────────────

export async function obtenerRmv(fecha?: Date): Promise<number> {
  return getParametroVigente('RMV', fecha);
}

export async function obtenerUit(fecha?: Date): Promise<number> {
  return getParametroVigente('UIT', fecha);
}

// ─── Pensiones ────────────────────────────────────────────────────────────────

export async function obtenerOnpTasa(fecha?: Date): Promise<number> {
  return getParametroVigente('ONP_TASA', fecha);
}

export async function obtenerRmaAfp(fecha?: Date): Promise<number> {
  return getParametroVigente('RMA_AFP', fecha);
}

// ─── EsSalud ──────────────────────────────────────────────────────────────────

export async function obtenerEssaludGeneral(fecha?: Date): Promise<number> {
  return getParametroVigente('ESSALUD_GENERAL', fecha);
}

export async function obtenerSisMypeMicroCuota(fecha?: Date): Promise<number> {
  return getParametroVigente('SIS_MYPE_MICRO_CUOTA', fecha);
}

export async function obtenerEssaludAgrarioMenor(fecha?: Date): Promise<number> {
  return getParametroVigente('ESSALUD_AGRARIO_MENOR', fecha);
}

export async function obtenerEssaludAgrarioMayor(fecha?: Date): Promise<number> {
  return getParametroVigente('ESSALUD_AGRARIO_MAYOR', fecha);
}

// ─── Horas extras ─────────────────────────────────────────────────────────────

export async function obtenerHeSobretasaPrimeras(fecha?: Date): Promise<number> {
  return getParametroVigente('HE_SOBRETASA_PRIMERAS_DOS', fecha);
}

export async function obtenerHeSobretasaResto(fecha?: Date): Promise<number> {
  return getParametroVigente('HE_SOBRETASA_RESTO', fecha);
}

export async function obtenerHeUmbralPrimeras(fecha?: Date): Promise<number> {
  return getParametroVigente('HE_UMBRAL_PRIMERAS_HORAS', fecha);
}

export async function obtenerHeSobretasaDescanso(fecha?: Date): Promise<number> {
  return getParametroVigente('HE_SOBRETASA_DESCANSO_FERIADO', fecha);
}

// ─── Quinta categoría ─────────────────────────────────────────────────────────

export async function obtenerTramosQuintaCategoria(fecha?: Date): Promise<TramoQuinta[]> {
  const [
    tasa1, limite1,
    tasa2, limite2,
    tasa3, limite3,
    tasa4, limite4,
    tasa5,
  ] = await Promise.all([
    getParametroVigente('QUINTA_TRAMO_1_TASA', fecha),
    getParametroVigente('QUINTA_TRAMO_1_LIMITE', fecha),
    getParametroVigente('QUINTA_TRAMO_2_TASA', fecha),
    getParametroVigente('QUINTA_TRAMO_2_LIMITE', fecha),
    getParametroVigente('QUINTA_TRAMO_3_TASA', fecha),
    getParametroVigente('QUINTA_TRAMO_3_LIMITE', fecha),
    getParametroVigente('QUINTA_TRAMO_4_TASA', fecha),
    getParametroVigente('QUINTA_TRAMO_4_LIMITE', fecha),
    getParametroVigente('QUINTA_TRAMO_5_TASA', fecha),
  ]);

  return [
    { tasa: tasa1, limite: limite1 },
    { tasa: tasa2, limite: limite2 },
    { tasa: tasa3, limite: limite3 },
    { tasa: tasa4, limite: limite4 },
    { tasa: tasa5, limite: Infinity },
  ];
}

// ─── Construcción Civil ───────────────────────────────────────────────────────

export async function obtenerJornalCCOperario(fecha?: Date): Promise<number> {
  return getParametroVigente('JORNAL_CC_OPERARIO', fecha);
}

export async function obtenerJornalCCOficial(fecha?: Date): Promise<number> {
  return getParametroVigente('JORNAL_CC_OFICIAL', fecha);
}

export async function obtenerJornalCCPeon(fecha?: Date): Promise<number> {
  return getParametroVigente('JORNAL_CC_PEON', fecha);
}

export async function obtenerBucCCOperario(fecha?: Date): Promise<number> {
  return getParametroVigente('BUC_CC_OPERARIO', fecha);
}

export async function obtenerBucCCOficial(fecha?: Date): Promise<number> {
  return getParametroVigente('BUC_CC_OFICIAL', fecha);
}

export async function obtenerBucCCPeon(fecha?: Date): Promise<number> {
  return getParametroVigente('BUC_CC_PEON', fecha);
}

export async function obtenerMovilidadCCLaborable(fecha?: Date): Promise<number> {
  return getParametroVigente('MOVILIDAD_CC_LABORABLE', fecha);
}

export async function obtenerMovilidadCCDominical(fecha?: Date): Promise<number> {
  return getParametroVigente('MOVILIDAD_CC_DOMINICAL', fecha);
}

export async function obtenerBonifAlturaCc(fecha?: Date): Promise<number> {
  return getParametroVigente('BONIF_ALTURA_CC', fecha);
}

export async function obtenerAsigEscolarCcJornales(fecha?: Date): Promise<number> {
  return getParametroVigente('ASIG_ESCOLAR_CC_JORNALES_ANUAL', fecha);
}

// ─── Régimen agrario ──────────────────────────────────────────────────────────

export async function obtenerAgrarioGratifProrrateo(fecha?: Date): Promise<number> {
  return getParametroVigente('AGRARIO_GRATIF_PRORRATEO', fecha);
}

export async function obtenerAgrarioCtsProrrateo(fecha?: Date): Promise<number> {
  return getParametroVigente('AGRARIO_CTS_PRORRATEO', fecha);
}

export async function obtenerAgrarioBeta(fecha?: Date): Promise<number> {
  return getParametroVigente('AGRARIO_BETA', fecha);
}

export async function obtenerAgrarioDiasVacaciones(fecha?: Date): Promise<number> {
  return getParametroVigente('AGRARIO_DIAS_VACACIONES', fecha);
}

// ─── MYPE Pequeña empresa ─────────────────────────────────────────────────────

export async function obtenerMypePequenaGratifFactor(fecha?: Date): Promise<number> {
  return getParametroVigente('MYPE_PEQUENA_GRATIF_FACTOR', fecha);
}

export async function obtenerMypePequenaCtsDias(fecha?: Date): Promise<number> {
  return getParametroVigente('MYPE_PEQUENA_CTS_DIAS_POR_ANIO', fecha);
}

export async function obtenerMypePequenaCtsTopeDias(fecha?: Date): Promise<number> {
  return getParametroVigente('MYPE_PEQUENA_CTS_TOPE_DIAS', fecha);
}

// ─── Bonificación extraordinaria (gratificaciones) ───────────────────────────

export async function obtenerBonifExtraordinariaEssalud(fecha?: Date): Promise<number> {
  return getParametroVigente('BONIF_EXTRAORDINARIA_ESSALUD', fecha);
}

export async function obtenerBonifExtraordinariaEps(fecha?: Date): Promise<number> {
  return getParametroVigente('BONIF_EXTRAORDINARIA_EPS', fecha);
}
