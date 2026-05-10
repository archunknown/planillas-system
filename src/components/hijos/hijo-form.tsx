'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { z } from 'zod';
import { CrearHijoSchema, ActualizarHijoSchema } from '@/lib/validations/hijo';
import type { CrearHijoInput, ActualizarHijoInput } from '@/lib/services/trabajador.service';
import { agregarHijoAction, actualizarHijoAction } from '@/app/actions/trabajador.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Optional DNI: convert '' to undefined
const emptyToUndefined = { setValueAs: (v: string) => (v === '' ? undefined : v) } as const;

type CrearFormData = z.input<typeof CrearHijoSchema>;
type EditarFormData = z.input<typeof ActualizarHijoSchema>;

interface CrearProps {
  modo: 'crear';
  trabajadorId: string;
  onDone: () => void;
}

interface EditarProps {
  modo: 'editar';
  hijoId: string;
  defaultValues: { nombres: string; fechaNacimiento: string; dni?: string };
  onDone: () => void;
}

type Props = CrearProps | EditarProps;

export function HijoForm(props: Props) {
  const [isPending, startTransition] = useTransition();

  const schema = props.modo === 'crear' ? CrearHijoSchema : ActualizarHijoSchema;
  const defaults =
    props.modo === 'editar'
      ? {
          nombres: props.defaultValues.nombres,
          fechaNacimiento: props.defaultValues.fechaNacimiento as unknown,
          dni: props.defaultValues.dni,
        }
      : undefined;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrearFormData | EditarFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      let result;
      if (props.modo === 'crear') {
        result = await agregarHijoAction(props.trabajadorId, data as CrearHijoInput);
      } else {
        result = await actualizarHijoAction(props.hijoId, data as ActualizarHijoInput);
      }
      if (result.ok) {
        props.onDone();
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="hijoNombres">Nombres *</Label>
        <Input
          id="hijoNombres"
          {...register('nombres')}
          aria-invalid={!!errors.nombres}
        />
        {errors.nombres && (
          <p className="text-xs text-destructive">{errors.nombres.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="hijoFechaNacimiento">F. nacimiento *</Label>
        <Input
          id="hijoFechaNacimiento"
          type="date"
          {...register('fechaNacimiento')}
          aria-invalid={!!errors.fechaNacimiento}
        />
        {errors.fechaNacimiento && (
          <p className="text-xs text-destructive">{errors.fechaNacimiento.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="hijoDni">DNI</Label>
        <Input
          id="hijoDni"
          {...register('dni', emptyToUndefined)}
          maxLength={8}
          aria-invalid={!!errors.dni}
        />
        {errors.dni && <p className="text-xs text-destructive">{errors.dni.message}</p>}
      </div>

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-3">
          {errors.root.message}
        </div>
      )}

      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando...' : props.modo === 'crear' ? 'Agregar hijo' : 'Guardar'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
