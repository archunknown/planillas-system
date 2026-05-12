'use client';
import { useState } from 'react';
import type { Hijo } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { HijoForm } from './hijo-form';
import { EliminarHijoDialog } from './eliminar-hijo-dialog';

interface Props {
  hijo: Hijo;
  canEdit: boolean;
  onDone: () => void;
}

export function HijoRow({ hijo, canEdit, onDone }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-md border bg-muted/30 p-3">
        <HijoForm
          modo="editar"
          hijoId={hijo.id}
          defaultValues={{
            nombres: hijo.nombres,
            fechaNacimiento: hijo.fechaNacimiento.toISOString().split('T')[0],
            dni: hijo.dni ?? undefined,
          }}
          onDone={() => {
            setEditing(false);
            onDone();
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{hijo.nombres}</span>
        <span className="text-xs text-muted-foreground">
          {hijo.fechaNacimiento.toLocaleDateString('es-PE')}
          {hijo.dni ? ` · DNI: ${hijo.dni}` : ''}
        </span>
      </div>
      {canEdit && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <EliminarHijoDialog
            hijoId={hijo.id}
            nombres={hijo.nombres}
            onDone={onDone}
          />
        </div>
      )}
    </li>
  );
}
