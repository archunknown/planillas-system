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
}

async function upsertParametro(param: ParamSeed): Promise<void> {
  // Buscar si ya existe un registro con ese código y esa vigenciaDesde
  const existing = await prisma.parametroLegal.findFirst({
    where: { codigo: param.codigo, vigenciaDesde: param.vigenciaDesde },
  });

  if (existing) {
    await prisma.parametroLegal.update({
      where: { id: existing.id },
      data: { descripcion: param.descripcion, valor: param.valor },
    });
  } else {
    await prisma.parametroLegal.create({
      data: {
        codigo: param.codigo,
        descripcion: param.descripcion,
        valor: param.valor,
        vigenciaDesde: param.vigenciaDesde,
        vigenciaHasta: null,
      },
    });
  }
}

async function main(): Promise<void> {
  const desde2025 = new Date('2025-01-01T00:00:00.000Z');
  const desde2026 = new Date('2026-01-01T00:00:00.000Z');

  const parametros: ParamSeed[] = [
    // =========================================================
    // Parámetros generales
    // =========================================================
    {
      codigo: 'RMV',
      descripcion: 'Remuneración Mínima Vital (DS 006-2024-TR, vigente desde ene-2025)',
      valor: 1130.00,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'UIT',
      descripcion: 'Unidad Impositiva Tributaria 2026 (DS 301-2025-EF)',
      valor: 5500.00,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // Pensiones
    // =========================================================
    {
      codigo: 'ONP_TASA',
      descripcion: 'Tasa de aporte ONP (13% fijo)',
      valor: 0.13,
      vigenciaDesde: desde2025,
    },

    // =========================================================
    // EsSalud
    // =========================================================
    {
      codigo: 'ESSALUD_GENERAL',
      descripcion: 'Tasa EsSalud régimen general (9%)',
      valor: 0.09,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'SIS_MYPE_MICRO_CUOTA',
      descripcion: 'Cuota fija mensual SIS por trabajador - microempresa',
      valor: 15.00,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'ESSALUD_AGRARIO_MENOR',
      descripcion: 'Tasa EsSalud agrario - empresas menores (<=100 trabajadores o <=1700 UIT ventas)',
      valor: 0.06,
      vigenciaDesde: desde2025,
    },
    {
      codigo: 'ESSALUD_AGRARIO_MAYOR',
      descripcion: 'Tasa EsSalud agrario - empresas mayores',
      valor: 0.09,
      vigenciaDesde: desde2025,
    },

    // =========================================================
    // AFP Habitat
    // =========================================================
    {
      codigo: 'AFP_HABITAT_APORTE',
      descripcion: 'AFP Habitat - Aporte obligatorio al fondo',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_HABITAT_COMISION',
      descripcion: 'AFP Habitat - Comisión sobre flujo',
      valor: 0.0147,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_HABITAT_PRIMA',
      descripcion: 'AFP Habitat - Prima de seguro de invalidez, sobrevivencia y sepelio',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Integra
    // =========================================================
    {
      codigo: 'AFP_INTEGRA_APORTE',
      descripcion: 'AFP Integra - Aporte obligatorio al fondo',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_INTEGRA_COMISION',
      descripcion: 'AFP Integra - Comisión sobre flujo',
      valor: 0.0155,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_INTEGRA_PRIMA',
      descripcion: 'AFP Integra - Prima de seguro de invalidez, sobrevivencia y sepelio',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Prima
    // =========================================================
    {
      codigo: 'AFP_PRIMA_APORTE',
      descripcion: 'AFP Prima - Aporte obligatorio al fondo',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PRIMA_COMISION',
      descripcion: 'AFP Prima - Comisión sobre flujo',
      valor: 0.0160,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PRIMA_PRIMA',
      descripcion: 'AFP Prima - Prima de seguro de invalidez, sobrevivencia y sepelio',
      valor: 0.0137,
      vigenciaDesde: desde2026,
    },

    // =========================================================
    // AFP Profuturo
    // =========================================================
    {
      codigo: 'AFP_PROFUTURO_APORTE',
      descripcion: 'AFP Profuturo - Aporte obligatorio al fondo',
      valor: 0.10,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PROFUTURO_COMISION',
      descripcion: 'AFP Profuturo - Comisión sobre flujo',
      valor: 0.0169,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'AFP_PROFUTURO_PRIMA',
      descripcion: 'AFP Profuturo - Prima de seguro de invalidez, sobrevivencia y sepelio',
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
      descripcion: 'Quinta categoría - Tramo 1 (hasta 5 UIT): tasa 8%',
      valor: 0.08,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_1_LIMITE',
      descripcion: 'Quinta categoría - Tramo 1: límite superior en soles (5 UIT = 27500)',
      valor: 27500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_2_TASA',
      descripcion: 'Quinta categoría - Tramo 2 (5 a 20 UIT): tasa 14%',
      valor: 0.14,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_2_LIMITE',
      descripcion: 'Quinta categoría - Tramo 2: límite superior en soles (20 UIT = 110000)',
      valor: 110000.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_3_TASA',
      descripcion: 'Quinta categoría - Tramo 3 (20 a 35 UIT): tasa 17%',
      valor: 0.17,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_3_LIMITE',
      descripcion: 'Quinta categoría - Tramo 3: límite superior en soles (35 UIT = 192500)',
      valor: 192500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_4_TASA',
      descripcion: 'Quinta categoría - Tramo 4 (35 a 45 UIT): tasa 20%',
      valor: 0.20,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_4_LIMITE',
      descripcion: 'Quinta categoría - Tramo 4: límite superior en soles (45 UIT = 247500)',
      valor: 247500.00,
      vigenciaDesde: desde2026,
    },
    {
      codigo: 'QUINTA_TRAMO_5_TASA',
      descripcion: 'Quinta categoría - Tramo 5 (más de 45 UIT): tasa 30%',
      valor: 0.30,
      vigenciaDesde: desde2026,
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
