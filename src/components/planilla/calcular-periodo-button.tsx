'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { calcularPeriodoAction } from '@/app/actions/periodo.actions';

interface Props {
  periodoId: string;
}

export function CalcularPeriodoButton({ periodoId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCalcular = () => {
    startTransition(async () => {
      const result = await calcularPeriodoAction(periodoId);
      if (result.ok) {
        toast.success('Planilla calculada');
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" variant="outline" />}>
        Calcular
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Calcular planilla?</AlertDialogTitle>
          <AlertDialogDescription>
            Se procesarán todos los detalles del período y se calcularán los montos de cada
            trabajador. Puedes recalcular mientras el período esté en estado Calculado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCalcular} disabled={isPending}>
            {isPending ? 'Calculando...' : 'Confirmar cálculo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
