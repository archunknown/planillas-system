'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { restaurarContratoAction } from '@/app/actions/contrato.actions';

interface Props {
  contratoId: string;
}

export function RestaurarContratoButton({ contratoId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRestaurar = () => {
    startTransition(async () => {
      const result = await restaurarContratoAction(contratoId);
      if (result.ok) {
        toast.success('Contrato restaurado');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleRestaurar}>
      {isPending ? 'Restaurando...' : 'Restaurar'}
    </Button>
  );
}
