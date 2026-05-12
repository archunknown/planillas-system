'use client';
import type { Trabajador } from '@prisma/client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EliminarTrabajadorDialog } from './eliminar-trabajador-dialog';
import { RestaurarTrabajadorButton } from './restaurar-trabajador-button';

interface Props {
  trabajadores: Trabajador[];
  canEdit: boolean;
}

export function TrabajadorTable({ trabajadores, canEdit }: Props) {
  if (trabajadores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay trabajadores registrados.</p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DNI</TableHead>
            <TableHead>Apellidos y nombres</TableHead>
            <TableHead>F. nacimiento</TableHead>
            <TableHead>Estado</TableHead>
            {canEdit && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trabajadores.map((t) => (
            <TableRow key={t.id} className={t.eliminadoEn ? 'opacity-60' : ''}>
              <TableCell className="font-mono text-xs">{t.dni}</TableCell>
              <TableCell>
                {t.apellidoPaterno} {t.apellidoMaterno}, {t.nombres}
              </TableCell>
              <TableCell className="text-xs">
                {t.fechaNacimiento.toLocaleDateString('es-PE')}
              </TableCell>
              <TableCell>
                {t.eliminadoEn ? (
                  <Badge variant="destructive">Eliminado</Badge>
                ) : (
                  <Badge>Activo</Badge>
                )}
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!t.eliminadoEn && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/trabajadores/${t.id}`} />}
                          nativeButton={false}
                        >
                          Editar
                        </Button>
                        <EliminarTrabajadorDialog
                          trabajadorId={t.id}
                          nombres={`${t.apellidoPaterno} ${t.apellidoMaterno}, ${t.nombres}`}
                        />
                      </>
                    )}
                    {t.eliminadoEn && (
                      <RestaurarTrabajadorButton trabajadorId={t.id} />
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
