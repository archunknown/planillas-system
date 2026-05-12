import * as trabajadorService from '@/lib/services/trabajador.service';
import { getSession } from '@/lib/auth/dal';
import { TrabajadorTable } from '@/components/trabajadores/trabajador-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function TrabajadoresPage({ searchParams }: Props) {
  const { empresaId } = await searchParams;

  if (!empresaId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Trabajadores</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una empresa para ver sus trabajadores.
        </p>
      </div>
    );
  }

  const [{ datos }, session] = await Promise.all([
    trabajadorService.listarPorEmpresa(empresaId, { incluirEliminados: true }),
    getSession(),
  ]);
  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trabajadores</h1>
        {canEdit && (
          <Button
            render={<Link href={`/trabajadores/nuevo?empresaId=${empresaId}`} />}
            size="sm"
            nativeButton={false}
          >
            Nuevo trabajador
          </Button>
        )}
      </div>
      <TrabajadorTable trabajadores={datos} canEdit={canEdit} />
    </div>
  );
}
