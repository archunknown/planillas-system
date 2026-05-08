'use client';
import type { Empresa } from '@prisma/client';
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
import { EliminarEmpresaDialog } from './eliminar-empresa-dialog';
import { RestaurarEmpresaButton } from './restaurar-empresa-button';

const TIPO_LABELS: Record<string, string> = {
  PERSONA_NATURAL: 'Persona Natural',
  EIRL: 'EIRL',
  SRL: 'SRL',
  SAC: 'S.A.C.',
  SA: 'S.A.',
  OTRO: 'Otro',
};

interface Props {
  empresas: Empresa[];
  isAdmin: boolean;
}

export function EmpresaTable({ empresas, isAdmin }: Props) {
  if (empresas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay empresas registradas.</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RUC</TableHead>
            <TableHead>Razón social</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {empresas.map((empresa) => (
            <TableRow key={empresa.id} className={empresa.eliminadoEn ? 'opacity-60' : ''}>
              <TableCell className="font-mono text-xs">{empresa.ruc}</TableCell>
              <TableCell>{empresa.razonSocial}</TableCell>
              <TableCell>{TIPO_LABELS[empresa.tipoEmpresa] ?? empresa.tipoEmpresa}</TableCell>
              <TableCell>
                {empresa.eliminadoEn ? (
                  <Badge variant="destructive">Eliminada</Badge>
                ) : empresa.activa ? (
                  <Badge>Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!empresa.eliminadoEn && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/empresas/${empresa.id}`} />}
                        >
                          Editar
                        </Button>
                        <EliminarEmpresaDialog
                          empresaId={empresa.id}
                          razonSocial={empresa.razonSocial}
                        />
                      </>
                    )}
                    {empresa.eliminadoEn && (
                      <RestaurarEmpresaButton empresaId={empresa.id} />
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
