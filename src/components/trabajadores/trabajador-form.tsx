'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { Trabajador } from '@prisma/client';
import { z } from 'zod';
import { CrearTrabajadorSchema, ActualizarTrabajadorSchema } from '@/lib/validations/trabajador';
import type { CrearTrabajadorInput, ActualizarTrabajadorInput } from '@/lib/services/trabajador.service';
import { crearTrabajadorAction, actualizarTrabajadorAction } from '@/app/actions/trabajador.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Optional string fields: convert '' to undefined so Zod's .optional() accepts empty inputs
const emptyToUndefined = { setValueAs: (v: string) => (v === '' ? undefined : v) } as const;

// empresaId is omitted from the form schema — passed as a prop and merged at submit
const CrearFormSchema = CrearTrabajadorSchema.omit({ empresaId: true });
// z.input<> matches zodResolver's output type; fechaNacimiento is unknown (accepts HTML date string)
type CrearFormData = z.input<typeof CrearFormSchema>;
type EditarFormData = z.input<typeof ActualizarTrabajadorSchema>;

interface Props {
  modo: 'crear' | 'editar';
  trabajador?: Trabajador;
  empresaId?: string;
  canEdit?: boolean;
}

function CrearForm({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrearFormData>({ resolver: zodResolver(CrearFormSchema) });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await crearTrabajadorAction(
        { ...data, empresaId } as z.input<typeof CrearTrabajadorSchema>,
      );
      if (result.ok) {
        toast.success('Trabajador creado');
        router.push(`/trabajadores?empresaId=${empresaId}`);
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          {...register('dni')}
          maxLength={8}
          aria-invalid={!!errors.dni}
        />
        {errors.dni && <p className="text-xs text-destructive">{errors.dni.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fechaNacimiento">Fecha de nacimiento *</Label>
        <Input
          id="fechaNacimiento"
          type="date"
          {...register('fechaNacimiento')}
          aria-invalid={!!errors.fechaNacimiento}
        />
        {errors.fechaNacimiento && (
          <p className="text-xs text-destructive">{errors.fechaNacimiento.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apellidoPaterno">Apellido paterno *</Label>
        <Input
          id="apellidoPaterno"
          {...register('apellidoPaterno')}
          aria-invalid={!!errors.apellidoPaterno}
        />
        {errors.apellidoPaterno && (
          <p className="text-xs text-destructive">{errors.apellidoPaterno.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apellidoMaterno">Apellido materno *</Label>
        <Input
          id="apellidoMaterno"
          {...register('apellidoMaterno')}
          aria-invalid={!!errors.apellidoMaterno}
        />
        {errors.apellidoMaterno && (
          <p className="text-xs text-destructive">{errors.apellidoMaterno.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="nombres">Nombres *</Label>
        <Input
          id="nombres"
          {...register('nombres')}
          aria-invalid={!!errors.nombres}
        />
        {errors.nombres && (
          <p className="text-xs text-destructive">{errors.nombres.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo">Sexo *</Label>
        <select
          id="sexo"
          {...register('sexo')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          aria-invalid={!!errors.sexo}
        >
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        {errors.sexo && <p className="text-xs text-destructive">{errors.sexo.message as string}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="estadoCivil">Estado civil</Label>
        <Input id="estadoCivil" {...register('estadoCivil', emptyToUndefined)} maxLength={50} />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" {...register('direccion', emptyToUndefined)} maxLength={300} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register('telefono', emptyToUndefined)} maxLength={20} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email', emptyToUndefined)}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
          {errors.root.message}
        </div>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !canEdit}>
          {isPending ? 'Guardando...' : 'Crear trabajador'}
        </Button>
      </div>
    </form>
  );
}

function EditarForm({ trabajador, canEdit }: { trabajador: Trabajador; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditarFormData>({
    resolver: zodResolver(ActualizarTrabajadorSchema),
    defaultValues: {
      dni: trabajador.dni,
      apellidoPaterno: trabajador.apellidoPaterno,
      apellidoMaterno: trabajador.apellidoMaterno,
      nombres: trabajador.nombres,
      // toISOString().split('T')[0] gives 'YYYY-MM-DD' for <input type="date">
      fechaNacimiento: trabajador.fechaNacimiento.toISOString().split('T')[0] as unknown,
      sexo: trabajador.sexo as 'M' | 'F',
      direccion: trabajador.direccion ?? undefined,
      telefono: trabajador.telefono ?? undefined,
      email: trabajador.email ?? undefined,
      estadoCivil: trabajador.estadoCivil ?? undefined,
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await actualizarTrabajadorAction(trabajador.id, data as ActualizarTrabajadorInput);
      if (result.ok) {
        toast.success('Trabajador actualizado');
        router.push(`/trabajadores?empresaId=${trabajador.empresaId}`);
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          {...register('dni')}
          maxLength={8}
          aria-invalid={!!errors.dni}
        />
        {errors.dni && <p className="text-xs text-destructive">{errors.dni.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fechaNacimiento">Fecha de nacimiento *</Label>
        <Input
          id="fechaNacimiento"
          type="date"
          {...register('fechaNacimiento')}
          aria-invalid={!!errors.fechaNacimiento}
        />
        {errors.fechaNacimiento && (
          <p className="text-xs text-destructive">{errors.fechaNacimiento.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apellidoPaterno">Apellido paterno *</Label>
        <Input
          id="apellidoPaterno"
          {...register('apellidoPaterno')}
          aria-invalid={!!errors.apellidoPaterno}
        />
        {errors.apellidoPaterno && (
          <p className="text-xs text-destructive">{errors.apellidoPaterno.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="apellidoMaterno">Apellido materno *</Label>
        <Input
          id="apellidoMaterno"
          {...register('apellidoMaterno')}
          aria-invalid={!!errors.apellidoMaterno}
        />
        {errors.apellidoMaterno && (
          <p className="text-xs text-destructive">{errors.apellidoMaterno.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="nombres">Nombres *</Label>
        <Input
          id="nombres"
          {...register('nombres')}
          aria-invalid={!!errors.nombres}
        />
        {errors.nombres && (
          <p className="text-xs text-destructive">{errors.nombres.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo">Sexo *</Label>
        <select
          id="sexo"
          {...register('sexo')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          aria-invalid={!!errors.sexo}
        >
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        {errors.sexo && <p className="text-xs text-destructive">{errors.sexo.message as string}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="estadoCivil">Estado civil</Label>
        <Input id="estadoCivil" {...register('estadoCivil', emptyToUndefined)} maxLength={50} />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" {...register('direccion', emptyToUndefined)} maxLength={300} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register('telefono', emptyToUndefined)} maxLength={20} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email', emptyToUndefined)}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
          {errors.root.message}
        </div>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !canEdit}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

export function TrabajadorForm({ modo, trabajador, empresaId, canEdit = true }: Props) {
  if (modo === 'crear') {
    return <CrearForm empresaId={empresaId ?? ''} canEdit={canEdit} />;
  }
  return <EditarForm trabajador={trabajador!} canEdit={canEdit} />;
}
