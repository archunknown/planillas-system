'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Hijo } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { HijoRow } from './hijo-row';
import { HijoForm } from './hijo-form';

interface Props {
  trabajadorId: string;
  hijos: Hijo[];
  canEdit: boolean;
}

export function HijosSection({ trabajadorId, hijos, canEdit }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const handleDone = () => {
    setShowAddForm(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {hijos.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground">Sin hijos registrados.</p>
      )}

      {hijos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {hijos.map((h) => (
            <HijoRow
              key={h.id}
              hijo={h}
              canEdit={canEdit}
              onDone={() => router.refresh()}
            />
          ))}
        </ul>
      )}

      {canEdit && !showAddForm && (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => setShowAddForm(true)}
        >
          Agregar hijo
        </Button>
      )}

      {showAddForm && (
        <div className="rounded-md border bg-muted/30 p-4">
          <HijoForm
            modo="crear"
            trabajadorId={trabajadorId}
            onDone={handleDone}
          />
        </div>
      )}
    </div>
  );
}
