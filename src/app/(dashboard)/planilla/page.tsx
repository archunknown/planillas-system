import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/dal';
import { PeriodoTable } from '@/components/planilla/periodo-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function PlanillaPage({ searchParams }: Props) {
  const { empresaId } = await searchParams;

  if (!empresaId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Planilla mensual</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una empresa para ver sus períodos.
        </p>
      </div>
    );
  }

  const [periodos, session] = await Promise.all([
    prisma.periodo.findMany({
      where: { empresaId },
      include: { _count: { select: { detalles: true } } },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    }),
    getSession(),
  ]);

  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Planilla mensual</h1>
        {canEdit && (
          <Button
            render={<Link href={`/planilla/nuevo?empresaId=${empresaId}`} />}
            size="sm"
            nativeButton={false}
          >
            Nuevo período
          </Button>
        )}
      </div>
      <PeriodoTable periodos={periodos} />
    </div>
  );
}
