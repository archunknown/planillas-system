import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/dal';
import { LiquidacionDetalle } from '@/components/liquidaciones/liquidacion-detalle';
import { AnularLiquidacionDialog } from '@/components/liquidaciones/anular-liquidacion-dialog';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LiquidacionDetallePage({ params }: Props) {
  const { id } = await params;

  const liq = await prisma.liquidacion.findUnique({
    where: { id },
    include: {
      contrato: {
        select: {
          id: true,
          cargo: true,
          motivoCese: true,
          trabajador: {
            select: { dni: true, apellidoPaterno: true, apellidoMaterno: true, nombres: true },
          },
        },
      },
    },
  });

  if (!liq) notFound();

  const session = await getSession();
  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/contratos/${liq.contrato.id}`} />}
        >
          ← Volver al contrato
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`/api/boletas/liquidacion/${liq.id}`} download />}
          >
            Descargar boleta
          </Button>
          {canEdit && !liq.anulada && (
            <AnularLiquidacionDialog liquidacionId={liq.id} />
          )}
        </div>
      </div>
      <LiquidacionDetalle liquidacion={liq} />
    </div>
  );
}
