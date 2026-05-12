import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/dal';
import { LiquidacionTable } from '@/components/liquidaciones/liquidacion-table';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function LiquidacionesPage({ searchParams }: Props) {
  const { empresaId } = await searchParams;

  if (!empresaId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Liquidaciones</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una empresa para ver sus liquidaciones.
        </p>
      </div>
    );
  }

  const [rawLiquidaciones, session] = await Promise.all([
    prisma.liquidacion.findMany({
      where: { contrato: { empresaId } },
      include: {
        contrato: {
          select: {
            id: true,
            trabajador: {
              select: { apellidoPaterno: true, apellidoMaterno: true, nombres: true },
            },
          },
        },
      },
      orderBy: { fechaCese: 'desc' },
    }),
    getSession(),
  ]);

  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  const liquidaciones = rawLiquidaciones.map((liq) => ({
    ...liq,
    ctsTrunca: liq.ctsTrunca.toNumber(),
    gratificacionTrunca: liq.gratificacionTrunca.toNumber(),
    vacacionesTruncas: liq.vacacionesTruncas.toNumber(),
    totalNeto: liq.totalNeto.toNumber(),
  }));

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Liquidaciones</h1>
      <LiquidacionTable liquidaciones={liquidaciones} canEdit={canEdit} />
    </div>
  );
}
