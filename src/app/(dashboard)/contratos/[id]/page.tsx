import { notFound } from 'next/navigation';
import * as contratoService from '@/lib/services/contrato.service';
import { getSession } from '@/lib/auth/dal';
import { ServiceError } from '@/lib/errors/service-error';
import { ContratoForm } from '@/components/contratos/contrato-form';
import { CerrarContratoDialog } from '@/components/contratos/cerrar-contrato-dialog';
import { EliminarContratoDialog } from '@/components/contratos/eliminar-contrato-dialog';
import { RestaurarContratoButton } from '@/components/contratos/restaurar-contrato-button';

export default async function EditarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let contrato;
  try {
    contrato = await contratoService.obtenerPorId(id);
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound();
    throw err;
  }

  const session = await getSession();
  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';
  const canMutate = canEdit && contrato.eliminadoEn === null;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{contrato.cargo}</h1>
          <p className="text-sm text-muted-foreground">
            {contrato.regimenLaboral.replace(/_/g, ' ')} ·{' '}
            {new Date(contrato.fechaInicio).toLocaleDateString('es-PE')}
          </p>
        </div>
        {canMutate && contrato.activo && (
          <CerrarContratoDialog contratoId={contrato.id} cargo={contrato.cargo} />
        )}
      </div>

      <ContratoForm modo="editar" contratoId={id} contrato={contrato} canEdit={canMutate} />

      {canEdit && contrato.eliminadoEn === null && (
        <div className="mt-6 border-t pt-4">
          <EliminarContratoDialog contratoId={contrato.id} cargo={contrato.cargo} />
        </div>
      )}
      {canEdit && contrato.eliminadoEn !== null && (
        <div className="mt-6 border-t pt-4">
          <RestaurarContratoButton contratoId={contrato.id} />
        </div>
      )}
    </div>
  );
}
