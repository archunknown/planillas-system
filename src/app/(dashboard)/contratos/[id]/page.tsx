import { notFound } from 'next/navigation';
import * as contratoService from '@/lib/services/contrato.service';
import * as liquidacionService from '@/lib/services/liquidacion.service';
import { getSession } from '@/lib/auth/dal';
import { ServiceError } from '@/lib/errors/service-error';
import { ContratoForm } from '@/components/contratos/contrato-form';
import { CerrarContratoDialog } from '@/components/contratos/cerrar-contrato-dialog';
import { EliminarContratoDialog } from '@/components/contratos/eliminar-contrato-dialog';
import { RestaurarContratoButton } from '@/components/contratos/restaurar-contrato-button';
import { CalcularLiquidacionDialog } from '@/components/liquidaciones/calcular-liquidacion-dialog';
import Link from 'next/link';

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

  const [session, liquidacion] = await Promise.all([
    getSession(),
    liquidacionService.obtenerPorContrato(id, { incluirAnuladas: true }),
  ]);
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

      <div className="mt-6 border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Liquidación</h2>
          {canMutate && contrato.activo && !liquidacion && (
            <CalcularLiquidacionDialog contratoId={contrato.id} />
          )}
        </div>
        {liquidacion ? (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">
              Fecha de cese:{' '}
              <span className="font-medium text-foreground">
                {new Date(liquidacion.fechaCese).toLocaleDateString('es-PE')}
              </span>
              {' · '}
              Total neto:{' '}
              <span className="font-medium text-foreground">
                S/ {liquidacion.totalNeto.toNumber().toFixed(2)}
              </span>
              {' · '}
              {liquidacion.anulada ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Anulada
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  Vigente
                </span>
              )}
            </p>
            <Link
              href={`/liquidaciones/${liquidacion.id}`}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Ver detalle →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {contrato.activo
              ? 'No hay liquidación para este contrato.'
              : 'Contrato inactivo o eliminado.'}
          </p>
        )}
      </div>
    </div>
  );
}
