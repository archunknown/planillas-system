'use client';
import Link from 'next/link';
import type { Periodo } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PeriodoConCount = Periodo & { _count: { detalles: number } };

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function estadoBadge(estado: string) {
  if (estado === 'CERRADO') return <Badge variant="secondary">Cerrado</Badge>;
  if (estado === 'CALCULADO') return <Badge>Calculado</Badge>;
  return <Badge variant="outline">Abierto</Badge>;
}

interface Props {
  periodos: PeriodoConCount[];
}

export function PeriodoTable({ periodos }: Props) {
  if (periodos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay periodos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4">Período</th>
            <th className="pb-2 pr-4">Estado</th>
            <th className="pb-2 pr-4">Trabajadores</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {periodos.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">
                {MESES[p.mes - 1]} {p.anio}
              </td>
              <td className="py-2 pr-4">{estadoBadge(p.estado)}</td>
              <td className="py-2 pr-4">{p._count.detalles}</td>
              <td className="py-2">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/planilla/${p.id}`} />}
                >
                  Ver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
