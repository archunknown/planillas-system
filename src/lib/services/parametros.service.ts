import { prisma } from '@/lib/prisma';

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
