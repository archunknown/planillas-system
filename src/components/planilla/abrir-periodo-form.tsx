'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { abrirPeriodoAction } from '@/app/actions/periodo.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const FormSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
});
type FormData = z.input<typeof FormSchema>;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const asInt = { setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)) } as const;

interface Props {
  empresaId: string;
}

export function AbrirPeriodoForm({ empresaId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await abrirPeriodoAction({ empresaId, mes: data.mes, anio: data.anio });
      if (result.ok) {
        toast.success('Período abierto');
        router.push(`/planilla/${result.data.id}`);
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apMes">Mes *</Label>
        <select
          id="apMes"
          {...register('mes', asInt)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.mes}
        >
          {MESES.map((nombre, i) => (
            <option key={i + 1} value={i + 1}>
              {nombre}
            </option>
          ))}
        </select>
        {errors.mes && <p className="text-xs text-destructive">{errors.mes.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apAnio">Año *</Label>
        <Input
          id="apAnio"
          type="number"
          min={2020}
          max={2100}
          {...register('anio', asInt)}
          aria-invalid={!!errors.anio}
        />
        {errors.anio && <p className="text-xs text-destructive">{errors.anio.message}</p>}
      </div>

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
          {errors.root.message}
        </div>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Abriendo...' : 'Abrir período'}
        </Button>
      </div>
    </form>
  );
}
