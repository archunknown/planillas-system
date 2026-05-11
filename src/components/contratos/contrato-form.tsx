'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { crearContratoAction, actualizarContratoAction } from '@/app/actions/contrato.actions';
import type { CrearContratoInput, ActualizarContratoInput } from '@/lib/services/contrato.service';
import type { Contrato } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// ── Inline form schemas (CrearContratoSchema uses .refine() → ZodEffects → no .omit()) ──

const REGIMEN_VALUES = ['GENERAL', 'MYPE_MICRO', 'MYPE_PEQUENA', 'CONSTRUCCION_CIVIL', 'AGRARIO'] as const;
const TIPO_CONTRATO_VALUES = ['INDEFINIDO', 'PLAZO_FIJO', 'TIEMPO_PARCIAL', 'INICIO_ACTIVIDAD', 'NECESIDAD_MERCADO', 'OBRA_DETERMINADA'] as const;
const FRECUENCIA_VALUES = ['SEMANAL', 'QUINCENAL', 'MENSUAL'] as const;
const PENSION_VALUES = ['ONP', 'AFP_HABITAT', 'AFP_INTEGRA', 'AFP_PRIMA', 'AFP_PROFUTURO', 'SIN_REGIMEN'] as const;
const CATEGORIA_CC_VALUES = ['OPERARIO', 'OFICIAL', 'PEON', 'NINGUNA'] as const;

const CrearFormSchema = z.object({
  trabajadorId: z.string().min(1, 'Selecciona un trabajador'),
  regimenLaboral: z.enum(REGIMEN_VALUES),
  tipoContrato: z.enum(TIPO_CONTRATO_VALUES),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFin: z.string().optional(),
  cargo: z.string().min(1, 'Cargo requerido').max(200),
  remuneracionBase: z.number().positive('Debe ser mayor a 0'),
  frecuenciaPago: z.enum(FRECUENCIA_VALUES),
  sistemaPensionario: z.enum(PENSION_VALUES),
  tieneAsignacionFamiliar: z.boolean().default(false),
  jornadaSemanal: z.number().int().min(1).max(48).default(48),
  categoriaCC: z.enum(CATEGORIA_CC_VALUES).default('NINGUNA'),
  zonaBonificacion: z.string().max(100).optional(),
  recibeBETA: z.boolean().default(false),
  esTiempoParcial: z.boolean().default(false),
});
type CrearFormData = z.input<typeof CrearFormSchema>;

const EditarFormSchema = z.object({
  tipoContrato: z.enum(TIPO_CONTRATO_VALUES).optional(),
  fechaFin: z.string().optional(),
  cargo: z.string().min(1).max(200).optional(),
  remuneracionBase: z.number().positive().optional(),
  frecuenciaPago: z.enum(FRECUENCIA_VALUES).optional(),
  sistemaPensionario: z.enum(PENSION_VALUES).optional(),
  tieneAsignacionFamiliar: z.boolean().optional(),
  jornadaSemanal: z.number().int().min(1).max(48).optional(),
  categoriaCC: z.enum(CATEGORIA_CC_VALUES).optional(),
  zonaBonificacion: z.string().max(100).optional(),
  recibeBETA: z.boolean().optional(),
  esTiempoParcial: z.boolean().optional(),
});
type EditarFormData = z.input<typeof EditarFormSchema>;

const asFloat = { setValueAs: (v: string) => (v === '' ? undefined : parseFloat(v)) } as const;
const asInt = { setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)) } as const;
const emptyToUndefined = { setValueAs: (v: string) => (v === '' ? undefined : v) } as const;

// ── Prop types ────────────────────────────────────────────────────────────────

type TrabajadorOpt = { id: string; apellidoPaterno: string; apellidoMaterno: string; nombres: string };

interface CrearProps {
  modo: 'crear';
  empresaId: string;
  trabajadorIdDefault?: string;
  trabajadores: TrabajadorOpt[];
}

interface EditarProps {
  modo: 'editar';
  contratoId: string;
  contrato: Contrato & { remuneracionBase: { toString(): string } };
  canEdit: boolean;
}

type Props = CrearProps | EditarProps;

// ── CrearForm ─────────────────────────────────────────────────────────────────

function CrearForm({ empresaId, trabajadorIdDefault, trabajadores }: CrearProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<CrearFormData>({
    resolver: zodResolver(CrearFormSchema),
    defaultValues: {
      trabajadorId: trabajadorIdDefault ?? '',
      jornadaSemanal: 48,
      categoriaCC: 'NINGUNA',
      tieneAsignacionFamiliar: false,
      recibeBETA: false,
      esTiempoParcial: false,
    },
  });

  const regimen = watch('regimenLaboral');

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      // empresaId not in form; merged here. Service calls CrearContratoSchema.parse() internally.
      const result = await crearContratoAction({ ...data, empresaId } as CrearContratoInput);
      if (result.ok) {
        toast.success('Contrato creado');
        router.push(`/contratos?empresaId=${empresaId}&trabajadorId=${data.trabajadorId}`);
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Trabajador */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cTrabajador">Trabajador *</Label>
        <select
          id="cTrabajador"
          {...register('trabajadorId')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.trabajadorId}
        >
          <option value="">Selecciona un trabajador</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.apellidoPaterno} {t.apellidoMaterno}, {t.nombres}
            </option>
          ))}
        </select>
        {errors.trabajadorId && (
          <p className="text-xs text-destructive">{errors.trabajadorId.message}</p>
        )}
      </div>

      {/* Régimen laboral */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cRegimen">Régimen *</Label>
        <select
          id="cRegimen"
          {...register('regimenLaboral')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.regimenLaboral}
        >
          <option value="">Selecciona régimen</option>
          <option value="GENERAL">Régimen General</option>
          <option value="MYPE_MICRO">MYPE Micro</option>
          <option value="MYPE_PEQUENA">MYPE Pequeña</option>
          <option value="CONSTRUCCION_CIVIL">Construcción Civil</option>
          <option value="AGRARIO">Agrario</option>
        </select>
        {errors.regimenLaboral && (
          <p className="text-xs text-destructive">{errors.regimenLaboral.message as string}</p>
        )}
      </div>

      {/* Tipo contrato */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cTipo">Tipo contrato *</Label>
        <select
          id="cTipo"
          {...register('tipoContrato')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.tipoContrato}
        >
          <option value="">Selecciona tipo</option>
          <option value="INDEFINIDO">Indefinido</option>
          <option value="PLAZO_FIJO">Plazo fijo</option>
          <option value="TIEMPO_PARCIAL">Tiempo parcial</option>
          <option value="INICIO_ACTIVIDAD">Inicio de actividad</option>
          <option value="NECESIDAD_MERCADO">Necesidad de mercado</option>
          <option value="OBRA_DETERMINADA">Obra determinada</option>
        </select>
        {errors.tipoContrato && (
          <p className="text-xs text-destructive">{errors.tipoContrato.message as string}</p>
        )}
      </div>

      {/* Cargo */}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="cCargo">Cargo *</Label>
        <Input
          id="cCargo"
          {...register('cargo')}
          aria-invalid={!!errors.cargo}
        />
        {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
      </div>

      {/* Fecha inicio */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cFechaInicio">F. inicio *</Label>
        <Input
          id="cFechaInicio"
          type="date"
          {...register('fechaInicio')}
          aria-invalid={!!errors.fechaInicio}
        />
        {errors.fechaInicio && (
          <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
        )}
      </div>

      {/* Fecha fin */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cFechaFin">F. fin</Label>
        <Input
          id="cFechaFin"
          type="date"
          {...register('fechaFin', emptyToUndefined)}
        />
      </div>

      {/* Remuneración */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cRemuneracion">Remuneración *</Label>
        <Input
          id="cRemuneracion"
          type="number"
          step="0.01"
          {...register('remuneracionBase', asFloat)}
          aria-invalid={!!errors.remuneracionBase}
        />
        {errors.remuneracionBase && (
          <p className="text-xs text-destructive">{errors.remuneracionBase.message}</p>
        )}
      </div>

      {/* Frecuencia pago */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cFrecuencia">Frecuencia pago *</Label>
        <select
          id="cFrecuencia"
          {...register('frecuenciaPago')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.frecuenciaPago}
        >
          <option value="">Selecciona frecuencia</option>
          <option value="SEMANAL">Semanal</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="MENSUAL">Mensual</option>
        </select>
        {errors.frecuenciaPago && (
          <p className="text-xs text-destructive">{errors.frecuenciaPago.message as string}</p>
        )}
      </div>

      {/* Sistema pensionario */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cPension">Sist. pensionario *</Label>
        <select
          id="cPension"
          {...register('sistemaPensionario')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-invalid={!!errors.sistemaPensionario}
        >
          <option value="">Selecciona sistema</option>
          <option value="ONP">ONP</option>
          <option value="AFP_HABITAT">AFP Habitat</option>
          <option value="AFP_INTEGRA">AFP Integra</option>
          <option value="AFP_PRIMA">AFP Prima</option>
          <option value="AFP_PROFUTURO">AFP Profuturo</option>
          <option value="SIN_REGIMEN">Sin régimen</option>
        </select>
        {errors.sistemaPensionario && (
          <p className="text-xs text-destructive">{errors.sistemaPensionario.message as string}</p>
        )}
      </div>

      {/* Jornada semanal */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="cJornada">Jornada semanal (h) *</Label>
        <Input
          id="cJornada"
          type="number"
          {...register('jornadaSemanal', asInt)}
          aria-invalid={!!errors.jornadaSemanal}
        />
        {errors.jornadaSemanal && (
          <p className="text-xs text-destructive">{errors.jornadaSemanal.message}</p>
        )}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('tieneAsignacionFamiliar')} />
          Tiene asignación familiar
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('esTiempoParcial')} />
          Es tiempo parcial
        </label>
      </div>

      {/* Conditional — CONSTRUCCION_CIVIL */}
      {regimen === 'CONSTRUCCION_CIVIL' && (
        <>
          <div className="flex flex-col gap-1.5 sm:col-span-1">
            <Label htmlFor="cCategoriaCC">Categoría CC</Label>
            <select
              id="cCategoriaCC"
              {...register('categoriaCC')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="NINGUNA">Ninguna</option>
              <option value="OPERARIO">Operario</option>
              <option value="OFICIAL">Oficial</option>
              <option value="PEON">Peón</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cZonaBonificacion">Zona bonificación</Label>
            <Input
              id="cZonaBonificacion"
              {...register('zonaBonificacion', emptyToUndefined)}
              maxLength={100}
            />
          </div>
        </>
      )}

      {/* Conditional — AGRARIO */}
      {regimen === 'AGRARIO' && (
        <div className="flex flex-col gap-2 sm:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('recibeBETA')} />
            Recibe BETA (Bonificación Especial por Trabajo Agrario)
          </label>
        </div>
      )}

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-3">
          {errors.root.message}
        </div>
      )}

      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear contrato'}
        </Button>
      </div>
    </form>
  );
}

// ── EditarForm ────────────────────────────────────────────────────────────────

function EditarForm({ contratoId, contrato, canEdit }: EditarProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditarFormData>({
    resolver: zodResolver(EditarFormSchema),
    defaultValues: {
      tipoContrato: contrato.tipoContrato as EditarFormData['tipoContrato'],
      fechaFin: contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : undefined,
      cargo: contrato.cargo,
      remuneracionBase: parseFloat(contrato.remuneracionBase.toString()),
      frecuenciaPago: contrato.frecuenciaPago as EditarFormData['frecuenciaPago'],
      sistemaPensionario: contrato.sistemaPensionario as EditarFormData['sistemaPensionario'],
      tieneAsignacionFamiliar: contrato.tieneAsignacionFamiliar,
      jornadaSemanal: contrato.jornadaSemanal,
      categoriaCC: contrato.categoriaCC as EditarFormData['categoriaCC'],
      zonaBonificacion: contrato.zonaBonificacion ?? undefined,
      recibeBETA: contrato.recibeBETA,
      esTiempoParcial: contrato.esTiempoParcial,
    },
  });

  const isCC = contrato.regimenLaboral === 'CONSTRUCCION_CIVIL';
  const isAgrario = contrato.regimenLaboral === 'AGRARIO';

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      // Service calls ActualizarContratoSchema.parse() internally
      const result = await actualizarContratoAction(contratoId, data as ActualizarContratoInput);
      if (result.ok) {
        toast.success('Contrato actualizado');
        router.refresh();
      } else {
        setError('root', { message: result.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Immutable fields displayed as text */}
      <div className="flex flex-col gap-1 sm:col-span-1">
        <span className="text-xs text-muted-foreground">Régimen laboral</span>
        <span className="text-sm font-medium">{contrato.regimenLaboral.replace('_', ' ')}</span>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-1">
        <span className="text-xs text-muted-foreground">Fecha inicio</span>
        <span className="text-sm font-medium">
          {new Date(contrato.fechaInicio).toLocaleDateString('es-PE')}
        </span>
      </div>

      {/* Tipo contrato */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="eTipo">Tipo contrato</Label>
        <select
          id="eTipo"
          {...register('tipoContrato')}
          disabled={!canEdit}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        >
          <option value="INDEFINIDO">Indefinido</option>
          <option value="PLAZO_FIJO">Plazo fijo</option>
          <option value="TIEMPO_PARCIAL">Tiempo parcial</option>
          <option value="INICIO_ACTIVIDAD">Inicio de actividad</option>
          <option value="NECESIDAD_MERCADO">Necesidad de mercado</option>
          <option value="OBRA_DETERMINADA">Obra determinada</option>
        </select>
      </div>

      {/* Cargo */}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="eCargo">Cargo</Label>
        <Input
          id="eCargo"
          {...register('cargo')}
          disabled={!canEdit}
          aria-invalid={!!errors.cargo}
        />
        {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
      </div>

      {/* Fecha fin */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="eFechaFin">F. fin</Label>
        <Input
          id="eFechaFin"
          type="date"
          {...register('fechaFin', emptyToUndefined)}
          disabled={!canEdit}
        />
      </div>

      {/* Remuneración */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="eRemuneracion">Remuneración</Label>
        <Input
          id="eRemuneracion"
          type="number"
          step="0.01"
          {...register('remuneracionBase', asFloat)}
          disabled={!canEdit}
          aria-invalid={!!errors.remuneracionBase}
        />
        {errors.remuneracionBase && (
          <p className="text-xs text-destructive">{errors.remuneracionBase.message}</p>
        )}
      </div>

      {/* Frecuencia pago */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="eFrecuencia">Frecuencia pago</Label>
        <select
          id="eFrecuencia"
          {...register('frecuenciaPago')}
          disabled={!canEdit}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        >
          <option value="SEMANAL">Semanal</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="MENSUAL">Mensual</option>
        </select>
      </div>

      {/* Sistema pensionario */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="ePension">Sist. pensionario</Label>
        <select
          id="ePension"
          {...register('sistemaPensionario')}
          disabled={!canEdit}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        >
          <option value="ONP">ONP</option>
          <option value="AFP_HABITAT">AFP Habitat</option>
          <option value="AFP_INTEGRA">AFP Integra</option>
          <option value="AFP_PRIMA">AFP Prima</option>
          <option value="AFP_PROFUTURO">AFP Profuturo</option>
          <option value="SIN_REGIMEN">Sin régimen</option>
        </select>
      </div>

      {/* Jornada semanal */}
      <div className="flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="eJornada">Jornada semanal (h)</Label>
        <Input
          id="eJornada"
          type="number"
          {...register('jornadaSemanal', asInt)}
          disabled={!canEdit}
          aria-invalid={!!errors.jornadaSemanal}
        />
        {errors.jornadaSemanal && (
          <p className="text-xs text-destructive">{errors.jornadaSemanal.message}</p>
        )}
      </div>

      {/* Checkboxes */}
      {canEdit && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('tieneAsignacionFamiliar')} />
            Tiene asignación familiar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('esTiempoParcial')} />
            Es tiempo parcial
          </label>
        </div>
      )}

      {/* Conditional — CONSTRUCCION_CIVIL */}
      {isCC && (
        <>
          <div className="flex flex-col gap-1.5 sm:col-span-1">
            <Label htmlFor="eCategoriaCC">Categoría CC</Label>
            <select
              id="eCategoriaCC"
              {...register('categoriaCC')}
              disabled={!canEdit}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="NINGUNA">Ninguna</option>
              <option value="OPERARIO">Operario</option>
              <option value="OFICIAL">Oficial</option>
              <option value="PEON">Peón</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="eZonaBonificacion">Zona bonificación</Label>
            <Input
              id="eZonaBonificacion"
              {...register('zonaBonificacion', emptyToUndefined)}
              disabled={!canEdit}
              maxLength={100}
            />
          </div>
        </>
      )}

      {/* Conditional — AGRARIO */}
      {isAgrario && canEdit && (
        <div className="flex flex-col gap-2 sm:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('recibeBETA')} />
            Recibe BETA (Bonificación Especial por Trabajo Agrario)
          </label>
        </div>
      )}

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-3">
          {errors.root.message}
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2 sm:col-span-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Public router ─────────────────────────────────────────────────────────────

export function ContratoForm(props: Props) {
  if (props.modo === 'crear') return <CrearForm {...props} />;
  return <EditarForm {...props} />;
}
