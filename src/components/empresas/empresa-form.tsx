'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { Empresa } from '@prisma/client';
import { z } from 'zod';
import { CrearEmpresaSchema, ActualizarEmpresaSchema } from '@/lib/validations/empresa';
import type { CrearEmpresaInput, ActualizarEmpresaInput } from '@/lib/validations/empresa';
import { crearEmpresaAction, actualizarEmpresaAction } from '@/app/actions/empresa.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Optional string fields: convert '' to undefined so Zod's .optional() accepts empty inputs
const emptyToUndefined = { setValueAs: (v: string) => (v === '' ? undefined : v) } as const;

const TIPO_EMPRESA_OPTIONS = [
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'EIRL', label: 'EIRL' },
  { value: 'SRL', label: 'SRL' },
  { value: 'SAC', label: 'S.A.C.' },
  { value: 'SA', label: 'S.A.' },
  { value: 'OTRO', label: 'Otro' },
] as const;

// z.input<> matches zodResolver's output type (fields with .default() stay optional in RHF state)
type CrearFormData = CrearEmpresaInput;

interface Props {
  modo: 'crear' | 'editar';
  empresa?: Empresa;
  isAdmin?: boolean;
}

function CrearForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrearFormData>({ resolver: zodResolver(CrearEmpresaSchema) });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await crearEmpresaAction(data);
      if (result.ok) {
        toast.success('Empresa creada');
        router.push('/empresas');
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ruc">RUC *</Label>
        <Input
          id="ruc"
          {...register('ruc')}
          maxLength={11}
          aria-invalid={!!errors.ruc}
        />
        {errors.ruc && <p className="text-xs text-destructive">{errors.ruc.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input
          id="razonSocial"
          {...register('razonSocial')}
          aria-invalid={!!errors.razonSocial}
        />
        {errors.razonSocial && (
          <p className="text-xs text-destructive">{errors.razonSocial.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="nombreComercial">Nombre comercial</Label>
        <Input id="nombreComercial" {...register('nombreComercial', emptyToUndefined)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipoEmpresa">Tipo de empresa *</Label>
        <Controller
          control={control}
          name="tipoEmpresa"
          render={({ field }) => (
            <Select
              value={field.value as string | undefined}
              onValueChange={(v) => field.onChange(v)}
            >
              <SelectTrigger
                id="tipoEmpresa"
                className="w-full"
                aria-invalid={!!errors.tipoEmpresa}
              >
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_EMPRESA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipoEmpresa && (
          <p className="text-xs text-destructive">{errors.tipoEmpresa.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="direccion">Dirección *</Label>
        <Input
          id="direccion"
          {...register('direccion')}
          aria-invalid={!!errors.direccion}
        />
        {errors.direccion && (
          <p className="text-xs text-destructive">{errors.direccion.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="distrito">Distrito *</Label>
        <Input
          id="distrito"
          {...register('distrito')}
          aria-invalid={!!errors.distrito}
        />
        {errors.distrito && (
          <p className="text-xs text-destructive">{errors.distrito.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provincia">Provincia *</Label>
        <Input
          id="provincia"
          {...register('provincia')}
          aria-invalid={!!errors.provincia}
        />
        {errors.provincia && (
          <p className="text-xs text-destructive">{errors.provincia.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="departamento">Departamento *</Label>
        <Input
          id="departamento"
          {...register('departamento')}
          aria-invalid={!!errors.departamento}
        />
        {errors.departamento && (
          <p className="text-xs text-destructive">{errors.departamento.message}</p>
        )}
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

      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id="activa"
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          {...register('activa')}
        />
        <Label htmlFor="activa">Empresa activa</Label>
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
        <Button type="submit" disabled={isPending || !isAdmin}>
          {isPending ? 'Guardando...' : 'Crear empresa'}
        </Button>
      </div>
    </form>
  );
}

function EditarForm({ empresa, isAdmin }: { empresa: Empresa; isAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ActualizarEmpresaInput>({
    resolver: zodResolver(ActualizarEmpresaSchema),
    defaultValues: {
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial ?? undefined,
      tipoEmpresa: empresa.tipoEmpresa as ActualizarEmpresaInput['tipoEmpresa'],
      direccion: empresa.direccion,
      distrito: empresa.distrito,
      provincia: empresa.provincia,
      departamento: empresa.departamento,
      telefono: empresa.telefono ?? undefined,
      email: empresa.email ?? undefined,
      activa: empresa.activa,
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await actualizarEmpresaAction(empresa.id, data);
      if (result.ok) {
        toast.success('Empresa actualizada');
        router.push('/empresas');
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input
          id="razonSocial"
          {...register('razonSocial')}
          aria-invalid={!!errors.razonSocial}
        />
        {errors.razonSocial && (
          <p className="text-xs text-destructive">{errors.razonSocial.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="nombreComercial">Nombre comercial</Label>
        <Input id="nombreComercial" {...register('nombreComercial', emptyToUndefined)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipoEmpresa">Tipo de empresa *</Label>
        <Controller
          control={control}
          name="tipoEmpresa"
          render={({ field }) => (
            <Select
              value={field.value as string | undefined}
              onValueChange={(v) => field.onChange(v)}
            >
              <SelectTrigger
                id="tipoEmpresa"
                className="w-full"
                aria-invalid={!!errors.tipoEmpresa}
              >
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_EMPRESA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipoEmpresa && (
          <p className="text-xs text-destructive">{errors.tipoEmpresa.message as string}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="direccion">Dirección *</Label>
        <Input
          id="direccion"
          {...register('direccion')}
          aria-invalid={!!errors.direccion}
        />
        {errors.direccion && (
          <p className="text-xs text-destructive">{errors.direccion.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="distrito">Distrito *</Label>
        <Input
          id="distrito"
          {...register('distrito')}
          aria-invalid={!!errors.distrito}
        />
        {errors.distrito && (
          <p className="text-xs text-destructive">{errors.distrito.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provincia">Provincia *</Label>
        <Input
          id="provincia"
          {...register('provincia')}
          aria-invalid={!!errors.provincia}
        />
        {errors.provincia && (
          <p className="text-xs text-destructive">{errors.provincia.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="departamento">Departamento *</Label>
        <Input
          id="departamento"
          {...register('departamento')}
          aria-invalid={!!errors.departamento}
        />
        {errors.departamento && (
          <p className="text-xs text-destructive">{errors.departamento.message}</p>
        )}
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

      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id="activa"
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          {...register('activa')}
        />
        <Label htmlFor="activa">Empresa activa</Label>
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
        <Button type="submit" disabled={isPending || !isAdmin}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

export function EmpresaForm({ modo, empresa, isAdmin = true }: Props) {
  if (modo === 'crear') return <CrearForm isAdmin={isAdmin} />;
  return <EditarForm empresa={empresa!} isAdmin={isAdmin} />;
}
