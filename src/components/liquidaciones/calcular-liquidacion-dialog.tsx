'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { calcularLiquidacionAction } from '@/app/actions/liquidacion.actions';
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
import { Textarea } from '@/components/ui/textarea';

const FormSchema = z.object({
  fechaCese: z.string().min(1, 'Fecha de cese requerida'),
  motivoCese: z.string().min(3, 'Motivo de cese requerido (mín. 3 caracteres)'),
});
type FormData = z.infer<typeof FormSchema>;

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  contratoId: string;
}

export function CalcularLiquidacionDialog({ contratoId }: Props) {
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
    defaultValues: { fechaCese: today(), motivoCese: '' },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await calcularLiquidacionAction({
        contratoId,
        fechaCese: new Date(data.fechaCese),
        motivoCese: data.motivoCese,
      });
      if (result.ok) {
        toast.success('Liquidación calculada');
        setOpen(false);
        reset();
        router.push(`/liquidaciones/${result.data.id}`);
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Calcular liquidación
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calcular liquidación</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clFechaCese">Fecha de cese *</Label>
              <Input
                id="clFechaCese"
                type="date"
                {...register('fechaCese')}
                aria-invalid={!!errors.fechaCese}
              />
              {errors.fechaCese && (
                <p className="text-xs text-destructive">{errors.fechaCese.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clMotivoCese">Motivo de cese *</Label>
              <Textarea
                id="clMotivoCese"
                rows={3}
                {...register('motivoCese')}
                aria-invalid={!!errors.motivoCese}
              />
              {errors.motivoCese && (
                <p className="text-xs text-destructive">{errors.motivoCese.message}</p>
              )}
            </div>
            {errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Calculando...' : 'Calcular'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
