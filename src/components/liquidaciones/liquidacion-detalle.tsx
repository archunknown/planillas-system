import type { Liquidacion } from '@prisma/client';

export type LiquidacionConDetalle = Liquidacion & {
  contrato: {
    cargo: string;
    motivoCese: string | null;
    trabajador: {
      apellidoPaterno: string;
      apellidoMaterno: string;
      nombres: string;
    };
  };
};

interface Props {
  liquidacion: LiquidacionConDetalle;
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function Monto({ label, value }: { label: string; value: number }) {
  return <Campo label={label} value={`S/ ${value.toFixed(2)}`} />;
}

export function LiquidacionDetalle({ liquidacion: liq }: Props) {
  const trabajador = liq.contrato.trabajador;
  const nombreCompleto = `${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno}, ${trabajador.nombres}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{nombreCompleto}</h2>
        {liq.anulada ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            Anulada
          </span>
        ) : (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Vigente
          </span>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Datos del cese
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Campo label="Cargo" value={liq.contrato.cargo} />
          <Campo
            label="Fecha de cese"
            value={new Date(liq.fechaCese).toLocaleDateString('es-PE')}
          />
          <Campo
            label="Fecha de cálculo"
            value={new Date(liq.fechaCalculo).toLocaleDateString('es-PE')}
          />
          <div className="col-span-2 sm:col-span-3">
            <Campo label="Motivo de cese" value={liq.contrato.motivoCese ?? '—'} />
          </div>
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          CTS trunca
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Meses" value={String(liq.ctsTruncaMeses)} />
          <Campo label="Días" value={String(liq.ctsTruncaDias)} />
          <Monto label="Monto" value={liq.ctsTrunca.toNumber()} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Gratificación trunca
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Meses" value={String(liq.gratificacionTruncaMeses)} />
          <Campo label="Días" value={String(liq.gratificacionTruncaDias)} />
          <Monto label="Monto" value={liq.gratificacionTrunca.toNumber()} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vacaciones truncas
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Meses" value={String(liq.vacacionesTruncaMeses)} />
          <Campo label="Días" value={String(liq.vacacionesTruncaDias)} />
          <Monto label="Monto" value={liq.vacacionesTruncas.toNumber()} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Totales
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Monto label="Total bruto" value={liq.totalBruto.toNumber()} />
          <Monto label="Descuentos" value={liq.descuentos.toNumber()} />
          <Monto label="Total neto" value={liq.totalNeto.toNumber()} />
        </dl>
      </section>

      {liq.anulada && (
        <section className="rounded-md border border-red-200 bg-red-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-red-700">Información de anulación</h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo
              label="Anulada el"
              value={
                liq.anuladaEn ? new Date(liq.anuladaEn).toLocaleDateString('es-PE') : '—'
              }
            />
            <div className="sm:col-span-2">
              <Campo label="Motivo de anulación" value={liq.motivoAnulacion ?? '—'} />
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
