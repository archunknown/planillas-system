'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { cerrarContratoAction } from '@/app/actions/contrato.actions';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CerrarFormSchema = z.object({
  fechaFin: z.string().min(1, 'Fecha fin requerida'),
  motivoCese: z.string().min(1, 'Motivo de cese requerido').max(300),
});
type CerrarFormData = z.infer<typeof CerrarFormSchema>;

interface Props {
  contratoId: string;
  cargo: string;
}

export function CerrarContratoDialog({ contratoId, cargo }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CerrarFormData>({
    resolver: zodResolver(CerrarFormSchema),
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      // Service calls CerrarContratoSchema.parse() internally; string date gets coerced to Date
      const result = await cerrarContratoAction(contratoId, data);
      if (result.ok) {
        toast.success('Contrato cerrado');
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Cerrar contrato
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar contrato — {cargo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ccFechaFin">Fecha de fin *</Label>
              <Input
                id="ccFechaFin"
                type="date"
                {...register('fechaFin')}
                aria-invalid={!!errors.fechaFin}
              />
              {errors.fechaFin && (
                <p className="text-xs text-destructive">{errors.fechaFin.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ccMotivo">Motivo de cese *</Label>
              <textarea
                id="ccMotivo"
                {...register('motivoCese')}
                maxLength={300}
                rows={3}
                aria-invalid={!!errors.motivoCese}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none aria-invalid:border-destructive"
              />
              {errors.motivoCese && (
                <p className="text-xs text-destructive">{errors.motivoCese.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setOpen(false); reset(); }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Cerrando...' : 'Confirmar cierre'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
