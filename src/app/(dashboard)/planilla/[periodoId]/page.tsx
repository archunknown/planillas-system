import { obtenerPeriodoConDetalles } from '@/lib/services/periodo.service';
import { getSession } from '@/lib/auth/dal';
import { DetallePeriodoTable, type DetalleNormalizado } from '@/components/planilla/detalle-periodo-table';
import { notFound } from 'next/navigation';
import { ServiceError } from '@/lib/errors/service-error';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  params: Promise<{ periodoId: string }>;
}

export default async function DetallePeriodoPage({ params }: Props) {
  const { periodoId } = await params;

  let periodo;
  try {
    periodo = await obtenerPeriodoConDetalles(periodoId);
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound();
    throw err;
  }

  const session = await getSession();
  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  // Normalize Decimal → number before passing to client components
  const detalles: DetalleNormalizado[] = periodo.detalles.map((d) => ({
    id: d.id,
    diasTrabajados: d.diasTrabajados,
    diasNoTrabajados: d.diasNoTrabajados,
    horasExtras25: d.horasExtras25.toNumber(),
    horasExtras35: d.horasExtras35.toNumber(),
    horasExtras100: d.horasExtras100.toNumber(),
    minutosAtraso: d.minutosAtraso,
    faltas: d.faltas,
    feriados: d.feriados,
    remuneracionBasica: d.remuneracionBasica.toNumber(),
    horasExtrasTotal: d.horasExtrasTotal.toNumber(),
    totalIngresos: d.totalIngresos.toNumber(),
    totalDescuentos: d.totalDescuentos.toNumber(),
    essalud: d.essalud.toNumber(),
    netoPagar: d.netoPagar.toNumber(),
    contrato: {
      id: d.contrato.id,
      trabajador: {
        apellidoPaterno: d.contrato.trabajador.apellidoPaterno,
        apellidoMaterno: d.contrato.trabajador.apellidoMaterno,
        nombres: d.contrato.trabajador.nombres,
      },
    },
  }));

  const titulo = `${MESES[periodo.mes - 1]} ${periodo.anio}`;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planilla — {titulo}</h1>
          <p className="text-sm text-muted-foreground">Estado: {periodo.estado}</p>
        </div>
      </div>
      <DetallePeriodoTable
        detalles={detalles}
        periodoId={periodo.id}
        estado={periodo.estado as 'ABIERTO' | 'CALCULADO' | 'CERRADO'}
        canEdit={canEdit}
      />
    </div>
  );
}
