'use client';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Button } from '@/components/ui/button';
import { AnularLiquidacionDialog } from './anular-liquidacion-dialog';

export type LiquidacionConTrabajador = {
  id: string;
  fechaCese: Date;
  ctsTrunca: number;
  gratificacionTrunca: number;
  vacacionesTruncas: number;
  totalNeto: number;
  anulada: boolean;
  contrato: {
    id: string;
    trabajador: {
      apellidoPaterno: string;
      apellidoMaterno: string;
      nombres: string;
    };
  };
};

interface Props {
  liquidaciones: LiquidacionConTrabajador[];
  canEdit: boolean;
}

export function LiquidacionTable({ liquidaciones, canEdit }: Props) {
  if (liquidaciones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay liquidaciones registradas.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3">Trabajador</th>
            <th className="pb-2 pr-2">Fecha cese</th>
            <th className="pb-2 pr-2">CTS trunca</th>
            <th className="pb-2 pr-2">Grat. trunca</th>
            <th className="pb-2 pr-2">Vac. truncas</th>
            <th className="pb-2 pr-2">Total neto</th>
            <th className="pb-2 pr-2">Estado</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {liquidaciones.map((liq) => (
            <tr key={liq.id} className="border-b last:border-0">
              <td className="py-2 pr-3 font-medium">
                {liq.contrato.trabajador.apellidoPaterno}{' '}
                {liq.contrato.trabajador.apellidoMaterno},{' '}
                {liq.contrato.trabajador.nombres}
              </td>
              <td className="py-2 pr-2">
                {new Date(liq.fechaCese).toLocaleDateString('es-PE')}
              </td>
              <td className="py-2 pr-2">S/ {liq.ctsTrunca.toFixed(2)}</td>
              <td className="py-2 pr-2">S/ {liq.gratificacionTrunca.toFixed(2)}</td>
              <td className="py-2 pr-2">S/ {liq.vacacionesTruncas.toFixed(2)}</td>
              <td className="py-2 pr-2 font-semibold">S/ {liq.totalNeto.toFixed(2)}</td>
              <td className="py-2 pr-2">
                {liq.anulada ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Anulada
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Vigente
                  </span>
                )}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href={`/liquidaciones/${liq.id}`} />}
                  >
                    Ver
                  </Button>
                  {canEdit && !liq.anulada && (
                    <AnularLiquidacionDialog liquidacionId={liq.id} />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span tabIndex={0}>
                          <Button size="sm" variant="outline" disabled>
                            PDF
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
