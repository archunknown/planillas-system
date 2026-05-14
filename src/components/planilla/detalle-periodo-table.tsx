'use client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CalcularPeriodoButton } from './calcular-periodo-button';
import { CerrarPeriodoDialog } from './cerrar-periodo-dialog';
import { InputsDetalleRow } from './inputs-detalle-row';

export type DetalleNormalizado = {
  id: string;
  diasTrabajados: number;
  diasNoTrabajados: number;
  horasExtras25: number;
  horasExtras35: number;
  horasExtras100: number;
  minutosAtraso: number;
  faltas: number;
  feriados: number;
  remuneracionBasica: number;
  horasExtrasTotal: number;
  totalIngresos: number;
  totalDescuentos: number;
  essalud: number;
  netoPagar: number;
  contrato: {
    id: string;
    trabajador: {
      apellidoPaterno: string;
      apellidoMaterno: string;
      nombres: string;
    };
  };
};

type EstadoPeriodo = 'ABIERTO' | 'CALCULADO' | 'CERRADO';

interface Props {
  detalles: DetalleNormalizado[];
  periodoId: string;
  estado: EstadoPeriodo;
  canEdit: boolean;
}

const showComputed = (estado: EstadoPeriodo) => estado === 'CALCULADO' || estado === 'CERRADO';

export function DetallePeriodoTable({ detalles, periodoId, estado, canEdit }: Props) {
  if (detalles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay trabajadores registrados para este período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3">Trabajador</th>
              <th className="pb-2 pr-2">Días trab.</th>
              <th className="pb-2 pr-2">HE 25%</th>
              <th className="pb-2 pr-2">HE 35%</th>
              <th className="pb-2 pr-2">HE 100%</th>
              <th className="pb-2 pr-2">Faltas</th>
              <th className="pb-2 pr-2">Feriados</th>
              {canEdit && estado === 'ABIERTO' && <th className="pb-2">Acciones</th>}
              {showComputed(estado) && (
                <>
                  <th className="pb-2 pr-2">Total ingresos</th>
                  <th className="pb-2 pr-2">Descuentos</th>
                  <th className="pb-2 pr-2">EsSalud</th>
                  <th className="pb-2 pr-2">Neto pagar</th>
                  <th className="pb-2">Boleta</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {detalles.map((d) =>
              estado === 'ABIERTO' ? (
                <InputsDetalleRow key={d.id} detalle={d} canEdit={canEdit} />
              ) : (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">
                    {d.contrato.trabajador.apellidoPaterno}{' '}
                    {d.contrato.trabajador.apellidoMaterno},{' '}
                    {d.contrato.trabajador.nombres}
                  </td>
                  <td className="py-2 pr-2">{d.diasTrabajados}</td>
                  <td className="py-2 pr-2">{d.horasExtras25.toFixed(2)}</td>
                  <td className="py-2 pr-2">{d.horasExtras35.toFixed(2)}</td>
                  <td className="py-2 pr-2">{d.horasExtras100.toFixed(2)}</td>
                  <td className="py-2 pr-2">{d.faltas}</td>
                  <td className="py-2 pr-2">{d.feriados}</td>
                  <td className="py-2 pr-2">S/ {d.totalIngresos.toFixed(2)}</td>
                  <td className="py-2 pr-2">S/ {d.totalDescuentos.toFixed(2)}</td>
                  <td className="py-2 pr-2">S/ {d.essalud.toFixed(2)}</td>
                  <td className="py-2 pr-2 font-semibold">S/ {d.netoPagar.toFixed(2)}</td>
                  <td className="py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<a href={`/api/boletas/pago/${d.id}`} download />}
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2">
          {estado === 'ABIERTO' && <CalcularPeriodoButton periodoId={periodoId} />}
          {estado === 'CALCULADO' && (
            <>
              <CalcularPeriodoButton periodoId={periodoId} />
              <CerrarPeriodoDialog periodoId={periodoId} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
