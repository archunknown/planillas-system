'use client';
import Link from 'next/link';
import type { Contrato, Trabajador } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EliminarContratoDialog } from './eliminar-contrato-dialog';
import { RestaurarContratoButton } from './restaurar-contrato-button';

type ContratoConTrabajador = Contrato & {
  trabajador: Pick<Trabajador, 'apellidoPaterno' | 'apellidoMaterno' | 'nombres' | 'dni'>;
};

interface Props {
  contratos: ContratoConTrabajador[];
  canEdit: boolean;
}

function estadoBadge(c: Contrato) {
  if (c.eliminadoEn !== null) return <Badge variant="destructive">Eliminado</Badge>;
  if (!c.activo) return <Badge variant="secondary">Cerrado</Badge>;
  return <Badge>Activo</Badge>;
}

export function ContratoTable({ contratos, canEdit }: Props) {
  if (contratos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay contratos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4">Trabajador</th>
            <th className="pb-2 pr-4">Cargo</th>
            <th className="pb-2 pr-4">Régimen</th>
            <th className="pb-2 pr-4">F. inicio</th>
            <th className="pb-2 pr-4">Remuneración</th>
            <th className="pb-2 pr-4">Estado</th>
            {canEdit && <th className="pb-2">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {contratos.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">
                {c.trabajador.apellidoPaterno} {c.trabajador.apellidoMaterno},{' '}
                {c.trabajador.nombres}
              </td>
              <td className="py-2 pr-4">{c.cargo}</td>
              <td className="py-2 pr-4">{c.regimenLaboral.replace(/_/g, ' ')}</td>
              <td className="py-2 pr-4">
                {new Date(c.fechaInicio).toLocaleDateString('es-PE')}
              </td>
              <td className="py-2 pr-4">
                S/ {parseFloat(c.remuneracionBase.toString()).toFixed(2)}
              </td>
              <td className="py-2 pr-4">{estadoBadge(c)}</td>
              {canEdit && (
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/contratos/${c.id}`} />}
                    >
                      Editar
                    </Button>
                    {c.eliminadoEn === null ? (
                      <EliminarContratoDialog contratoId={c.id} cargo={c.cargo} />
                    ) : (
                      <RestaurarContratoButton contratoId={c.id} />
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
