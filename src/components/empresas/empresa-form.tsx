'use client';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
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

const TIPO_EMPRESA_OPTIONS = [
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'EIRL', label: 'EIRL' },
  { value: 'SRL', label: 'SRL' },
  { value: 'SAC', label: 'S.A.C.' },
  { value: 'SA', label: 'S.A.' },
  { value: 'OTRO', label: 'Otro' },
] as const;

type CrearFormData = z.infer<typeof CrearEmpresaSchema>;

interface Props {
  modo: 'crear' | 'editar';
  empresa?: Empresa;
  isAdmin?: boolean;
}

export function EmpresaForm({ modo, empresa, isAdmin = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrearFormData>({
    resolver: zodResolver(
      modo === 'crear' ? CrearEmpresaSchema : ActualizarEmpresaSchema,
    ) as unknown as Resolver<CrearFormData>,
    defaultValues: empresa
      ? {
          razonSocial: empresa.razonSocial,
          nombreComercial: empresa.nombreComercial ?? undefined,
          tipoEmpresa: empresa.tipoEmpresa as CrearFormData['tipoEmpresa'],
          direccion: empresa.direccion,
          distrito: empresa.distrito,
          provincia: empresa.provincia,
          departamento: empresa.departamento,
          telefono: empresa.telefono ?? undefined,
          email: empresa.email ?? undefined,
          activa: empresa.activa,
        }
      : undefined,
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      let result;
      if (modo === 'crear') {
        result = await crearEmpresaAction(data as CrearEmpresaInput);
      } else {
        result = await actualizarEmpresaAction(empresa!.id, data as ActualizarEmpresaInput);
      }
      if (result.ok) {
        router.push('/empresas');
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {modo === 'crear' && (
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
      )}

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
        <Input id="nombreComercial" {...register('nombreComercial')} />
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
        <Input id="telefono" {...register('telefono')} maxLength={20} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
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
          {isPending ? 'Guardando...' : modo === 'crear' ? 'Crear empresa' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
