import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/dal';
import { ContratoTable } from '@/components/contratos/contrato-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  searchParams: Promise<{ empresaId?: string; trabajadorId?: string }>;
}

export default async function ContratosPage({ searchParams }: Props) {
  const { empresaId, trabajadorId } = await searchParams;

  if (!empresaId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Contratos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una empresa para ver sus contratos.
        </p>
      </div>
    );
  }

  const [contratos, session] = await Promise.all([
    prisma.contrato.findMany({
      where: {
        empresaId,
        ...(trabajadorId ? { trabajadorId } : {}),
      },
      include: {
        trabajador: {
          select: {
            apellidoPaterno: true,
            apellidoMaterno: true,
            nombres: true,
            dni: true,
          },
        },
      },
      orderBy: [{ trabajadorId: 'asc' }, { fechaInicio: 'desc' }],
    }),
    getSession(),
  ]);

  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contratos</h1>
        {canEdit && (
          <Button
            render={
              <Link
                href={`/contratos/nuevo?empresaId=${empresaId}${trabajadorId ? `&trabajadorId=${trabajadorId}` : ''}`}
              />
            }
            size="sm"
            nativeButton={false}
          >
            Nuevo contrato
          </Button>
        )}
      </div>
      <ContratoTable contratos={contratos} canEdit={canEdit} />
    </div>
  );
}
