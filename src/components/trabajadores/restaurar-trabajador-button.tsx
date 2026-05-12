'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { restaurarTrabajadorAction } from '@/app/actions/trabajador.actions';

interface Props {
  trabajadorId: string;
}

export function RestaurarTrabajadorButton({ trabajadorId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRestaurar = () => {
    startTransition(async () => {
      const result = await restaurarTrabajadorAction(trabajadorId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleRestaurar} disabled={isPending}>
        {isPending ? 'Restaurando...' : 'Restaurar'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
