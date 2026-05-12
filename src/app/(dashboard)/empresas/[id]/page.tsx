import { notFound } from 'next/navigation';
import * as empresaService from '@/lib/services/empresa.service';
import { getSession } from '@/lib/auth/dal';
import { ServiceError } from '@/lib/errors/service-error';
import { EmpresaForm } from '@/components/empresas/empresa-form';
import { EliminarEmpresaDialog } from '@/components/empresas/eliminar-empresa-dialog';

export default async function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let empresa;
  try {
    empresa = await empresaService.obtenerPorId(id);
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound();
    throw err;
  }

  const session = await getSession();
  const isAdmin = session?.user?.rol === 'ADMIN';

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar empresa</h1>
        {isAdmin && !empresa.eliminadoEn && (
          <EliminarEmpresaDialog empresaId={empresa.id} razonSocial={empresa.razonSocial} />
        )}
      </div>
      <EmpresaForm modo="editar" empresa={empresa} isAdmin={isAdmin} />
    </div>
  );
}
