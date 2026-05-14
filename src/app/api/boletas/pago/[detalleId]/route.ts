import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { requireSession, requireOwnership } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { BoletaPagoPDF } from '@/components/pdf/BoletaPagoPDF';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ detalleId: string }> },
) {
  await requireSession();

  const { detalleId } = await params;

  const detalle = await prisma.planillaDetalle.findUnique({
    where: { id: detalleId },
    include: {
      periodo: {
        include: {
          empresa: {
            select: { razonSocial: true, ruc: true, direccion: true, distrito: true },
          },
        },
      },
      contrato: {
        select: {
          cargo: true,
          regimenLaboral: true,
          sistemaPensionario: true,
          fechaInicio: true,
          trabajador: {
            select: { dni: true, apellidoPaterno: true, apellidoMaterno: true, nombres: true },
          },
        },
      },
    },
  });

  if (!detalle) {
    return Response.json({ error: 'Detalle no encontrado' }, { status: 404 });
  }

  await requireOwnership(detalle.periodo.empresaId);

  if (detalle.periodo.estado === 'ABIERTO') {
    return Response.json({ error: 'Periodo aun sin calcular' }, { status: 409 });
  }

  const data = {
    detalle: {
      ...detalle,
      remuneracionBasica: detalle.remuneracionBasica.toNumber(),
      horasExtrasTotal: detalle.horasExtrasTotal.toNumber(),
      asignacionFamiliar: detalle.asignacionFamiliar.toNumber(),
      bonificacionCC: detalle.bonificacionCC.toNumber(),
      movilidadCC: detalle.movilidadCC.toNumber(),
      bonificacionAltura: detalle.bonificacionAltura.toNumber(),
      asignacionEscolar: detalle.asignacionEscolar.toNumber(),
      otrosIngresos: detalle.otrosIngresos.toNumber(),
      totalIngresos: detalle.totalIngresos.toNumber(),
      descuentoOnp: detalle.descuentoOnp.toNumber(),
      descuentoAfp: detalle.descuentoAfp.toNumber(),
      comisionAfp: detalle.comisionAfp.toNumber(),
      primaSeguroAfp: detalle.primaSeguroAfp.toNumber(),
      retencionQuinta: detalle.retencionQuinta.toNumber(),
      otrosDescuentos: detalle.otrosDescuentos.toNumber(),
      totalDescuentos: detalle.totalDescuentos.toNumber(),
      essalud: detalle.essalud.toNumber(),
      sctr: detalle.sctr.toNumber(),
      netoPagar: detalle.netoPagar.toNumber(),
    },
    fechaEmision: new Date(),
  };

  const buffer = await renderToBuffer(
    React.createElement(BoletaPagoPDF, data) as never,
  );

  const mes = String(detalle.periodo.mes).padStart(2, '0');
  const filename = `boleta-${detalle.contrato.trabajador.dni}-${detalle.periodo.anio}-${mes}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
