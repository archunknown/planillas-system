'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { actualizarInputsDetalleAction } from '@/app/actions/periodo.actions';
import { Button } from '@/components/ui/button';
import type { DetalleNormalizado } from './detalle-periodo-table';

const RowSchema = z.object({
  diasTrabajados: z.number().int().min(0).max(31),
  horasExtras25: z.number().min(0).max(200),
  horasExtras35: z.number().min(0).max(200),
  horasExtras100: z.number().min(0).max(200),
  faltas: z.number().int().min(0).max(31),
  feriados: z.number().int().min(0).max(31),
});
type RowData = z.input<typeof RowSchema>;

const asInt = { setValueAs: (v: string) => (v === '' ? 0 : parseInt(v, 10)) } as const;
const asFloat = { setValueAs: (v: string) => (v === '' ? 0 : parseFloat(v)) } as const;

interface Props {
  detalle: DetalleNormalizado;
  canEdit: boolean;
}

export function InputsDetalleRow({ detalle, canEdit }: Props) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<RowData>({
    resolver: zodResolver(RowSchema),
    defaultValues: {
      diasTrabajados: detalle.diasTrabajados,
      horasExtras25: detalle.horasExtras25,
      horasExtras35: detalle.horasExtras35,
      horasExtras100: detalle.horasExtras100,
      faltas: detalle.faltas,
      feriados: detalle.feriados,
    },
  });

  const onSave = handleSubmit((data) => {
    startTransition(async () => {
      const result = await actualizarInputsDetalleAction(detalle.id, data);
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  });

  const { contrato: { trabajador: t } } = detalle;
  const nombre = `${t.apellidoPaterno} ${t.apellidoMaterno}, ${t.nombres}`;

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3 font-medium text-sm">{nombre}</td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={31}
          className="w-16 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('diasTrabajados', asInt)}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={200}
          step="0.01"
          className="w-20 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('horasExtras25', asFloat)}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={200}
          step="0.01"
          className="w-20 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('horasExtras35', asFloat)}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={200}
          step="0.01"
          className="w-20 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('horasExtras100', asFloat)}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={31}
          className="w-14 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('faltas', asInt)}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          min={0}
          max={31}
          className="w-14 rounded border border-input px-2 py-1 text-sm disabled:opacity-50"
          disabled={!canEdit}
          {...register('feriados', asInt)}
        />
      </td>
      {canEdit && (
        <td className="py-2">
          <Button size="sm" onClick={() => onSave()} disabled={isPending}>
            {isPending ? '...' : 'Guardar'}
          </Button>
        </td>
      )}
    </tr>
  );
}
