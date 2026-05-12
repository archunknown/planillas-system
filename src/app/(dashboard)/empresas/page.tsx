import * as empresaService from '@/lib/services/empresa.service';
import { getSession } from '@/lib/auth/dal';
import { EmpresaTable } from '@/components/empresas/empresa-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EmpresasPage() {
  const [{ datos }, session] = await Promise.all([
    empresaService.listar({ incluirEliminados: true }),
    getSession(),
  ]);
  const isAdmin = session?.user?.rol === 'ADMIN';

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Empresas</h1>
        {isAdmin && (
          <Button render={<Link href="/empresas/nueva" />} size="sm" nativeButton={false}>
            Nueva empresa
          </Button>
        )}
      </div>
      <EmpresaTable empresas={datos} isAdmin={isAdmin} />
    </div>
  );
}
