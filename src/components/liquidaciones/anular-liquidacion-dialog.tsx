'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { anularLiquidacionAction } from '@/app/actions/liquidacion.actions';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FormSchema = z.object({
  motivoAnulacion: z.string().min(5, 'Mínimo 5 caracteres').max(300),
});
type FormData = z.infer<typeof FormSchema>;

interface Props {
  liquidacionId: string;
}

export function AnularLiquidacionDialog({ liquidacionId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { motivoAnulacion: '' },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await anularLiquidacionAction(liquidacionId, {
        motivoAnulacion: data.motivoAnulacion,
      });
      if (result.ok) {
        toast.success('Liquidación anulada');
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
        Anular
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular la liquidación?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es definitiva y no puede revertirse. La liquidación quedará anulada y
            el contrato volverá a estado activo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alMotivo">Motivo de anulación *</Label>
            <Textarea
              id="alMotivo"
              rows={3}
              {...register('motivoAnulacion')}
              aria-invalid={!!errors.motivoAnulacion}
            />
            {errors.motivoAnulacion && (
              <p className="text-xs text-destructive">{errors.motivoAnulacion.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onSubmit()}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Anulando...' : 'Confirmar anulación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
